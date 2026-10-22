import { StrictMode, createElement, type ReactNode } from "react";
import { act, renderHook, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { MAX_PHOTOS, useLeadDraft } from "./useLeadDraft";
import { loadHistory } from "@/app/lib/history";

// Canvas isn't available in jsdom: compression is tested manually on a real phone
vi.mock("@/app/lib/compressImage", () => ({
  compressImage: (file: File) => Promise.resolve(file),
}));

const DRAFT_KEY = "lead-capture:draft:v2";

// StrictMode runs state updaters twice in dev: catches accidental state mutation
const wrapper = ({ children }: { children: ReactNode }) => createElement(StrictMode, null, children);

async function renderLead() {
  const hook = renderHook(() => useLeadDraft(), { wrapper });
  await waitFor(() => expect(hook.result.current.hydrated).toBe(true));
  return hook;
}

function photo(name = "a.jpg") {
  return new File(["x"], name, { type: "image/jpeg" });
}

function mockFetch(handler: (url: string, init?: RequestInit) => Response | Promise<Response>) {
  const fn = vi.fn((input: RequestInfo | URL, init?: RequestInit) => Promise.resolve(handler(String(input), init)));
  vi.stubGlobal("fetch", fn);
  return fn;
}

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } });

beforeEach(() => {
  localStorage.clear();
  vi.spyOn(console, "error").mockImplementation(() => {});
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe("barcodes", () => {
  it("adds a new barcode with quantity 1", async () => {
    const { result } = await renderLead();
    act(() => result.current.addBarcode("123"));
    expect(result.current.barcodes).toEqual([{ barcode: "123", quantity: 1 }]);
  });

  it("bumps the quantity of an existing barcode and moves it to the end", async () => {
    const { result } = await renderLead();
    act(() => result.current.addBarcode("A"));
    act(() => result.current.addBarcode("B"));
    act(() => result.current.addBarcode("A"));
    expect(result.current.barcodes).toEqual([
      { barcode: "B", quantity: 1 },
      { barcode: "A", quantity: 2 },
    ]);
  });

  it("adds a manual quantity to an existing barcode", async () => {
    const { result } = await renderLead();
    act(() => result.current.addBarcode("A"));
    act(() => result.current.addBarcode(" A ", 3));
    expect(result.current.barcodes).toEqual([{ barcode: "A", quantity: 4 }]);
  });

  it("ignores empty barcodes and quantities below 1", async () => {
    const { result } = await renderLead();
    act(() => result.current.addBarcode("   "));
    act(() => result.current.addBarcode("A", 0));
    expect(result.current.barcodes).toEqual([]);
  });

  it("increments and decrements by exactly 1", async () => {
    const { result } = await renderLead();
    act(() => result.current.addBarcode("A"));
    act(() => result.current.changeQuantity("A", 1));
    expect(result.current.barcodes[0].quantity).toBe(2);
    act(() => result.current.changeQuantity("A", -1));
    expect(result.current.barcodes[0].quantity).toBe(1);
  });

  it("removes a barcode when its quantity reaches 0", async () => {
    const { result } = await renderLead();
    act(() => result.current.addBarcode("A"));
    act(() => result.current.addBarcode("B"));
    act(() => result.current.changeQuantity("A", -1));
    expect(result.current.barcodes).toEqual([{ barcode: "B", quantity: 1 }]);
  });
});

describe("photos", () => {
  it(`keeps at most ${MAX_PHOTOS} photos`, async () => {
    const { result } = await renderLead();
    await act(() => result.current.addPhotos([photo("1"), photo("2"), photo("3")]));
    await act(() => result.current.addPhotos([photo("4"), photo("5")]));
    expect(result.current.photos.map((p) => p.name)).toEqual(["1", "2", "3", "4"]);
  });

  it("removes a photo by index", async () => {
    const { result } = await renderLead();
    await act(() => result.current.addPhotos([photo("1"), photo("2")]));
    act(() => result.current.removePhoto(0));
    expect(result.current.photos.map((p) => p.name)).toEqual(["2"]);
  });
});

describe("draft persistence", () => {
  it("saves store and barcodes to localStorage on every change", async () => {
    const { result } = await renderLead();
    act(() => result.current.setStore({ name: "Shop", number: "7" }));
    act(() => result.current.addBarcode("A"));

    const draft = JSON.parse(localStorage.getItem(DRAFT_KEY)!);
    expect(draft.store).toEqual({ name: "Shop", number: "7" });
    expect(draft.barcodes).toEqual([{ barcode: "A", quantity: 1 }]);
    expect(draft.submissionId).toBeTruthy();
  });

  it("restores the draft after a reload, keeping the same submissionId", async () => {
    const first = await renderLead();
    act(() => first.result.current.setStore({ name: "Shop", number: "7" }));
    act(() => first.result.current.addBarcode("A"));
    const { submissionId } = JSON.parse(localStorage.getItem(DRAFT_KEY)!);
    first.unmount();

    const second = await renderLead();
    expect(second.result.current.store).toEqual({ name: "Shop", number: "7" });
    expect(second.result.current.barcodes).toEqual([{ barcode: "A", quantity: 1 }]);
    expect(JSON.parse(localStorage.getItem(DRAFT_KEY)!).submissionId).toBe(submissionId);
  });

  it("starts empty when the saved draft is corrupted", async () => {
    localStorage.setItem(DRAFT_KEY, "{not json");
    const { result } = await renderLead();
    expect(result.current.store).toBeNull();
    expect(result.current.barcodes).toEqual([]);
  });
});

describe("submit", () => {
  async function readyLead() {
    const hook = await renderLead();
    act(() => hook.result.current.setStore({ name: "Shop", number: "7" }));
    act(() => hook.result.current.addBarcode("A"));
    act(() => hook.result.current.addBarcode("B", 2));
    await act(() => hook.result.current.addPhotos([photo("1"), photo("2")]));
    return hook;
  }

  it("uploads photos, saves the lead with the expected payload and resets", async () => {
    const { result } = await readyLead();
    const { submissionId } = JSON.parse(localStorage.getItem(DRAFT_KEY)!);
    let n = 0;
    const fetchMock = mockFetch((url) =>
      url.startsWith("/api/upload") ? json({ url: `https://img/${++n}` }) : json({ status: "success" })
    );

    let res;
    await act(async () => {
      res = await result.current.submit();
    });
    expect(res).toEqual({ ok: true });

    const uploadCalls = fetchMock.mock.calls.filter(([u]) => String(u).startsWith("/api/upload"));
    expect(uploadCalls).toHaveLength(2);
    expect(String(uploadCalls[0][0])).toBe(`/api/upload?submissionId=${submissionId}`);

    const saveCall = fetchMock.mock.calls.find(([u]) => u === "/api/save-lead")!;
    const { createdAt: submittedAt } = loadHistory()[0];
    expect(JSON.parse(String(saveCall[1]!.body))).toEqual({
      submissionId,
      submittedAt,
      storeName: "Shop",
      storeNumber: "7",
      barcodes: [
        {
          barcode: "A", quantity: 1, storeName: "Shop", storeNumber: "7",
          photo_1: "https://img/1", photo_2: "https://img/2", photo_3: "", photo_4: "", delete_link: "",
        },
        {
          barcode: "B", quantity: 2, storeName: "Shop", storeNumber: "7",
          photo_1: "", photo_2: "", photo_3: "", photo_4: "", delete_link: "",
        },
      ],
    });

    expect(result.current.store).toBeNull();
    expect(result.current.barcodes).toEqual([]);
    expect(result.current.photos).toEqual([]);
    const draft = JSON.parse(localStorage.getItem(DRAFT_KEY)!);
    expect(draft.barcodes).toEqual([]);
    expect(draft.submissionId).not.toBe(submissionId);

    expect(loadHistory()).toEqual([
      expect.objectContaining({
        id: submissionId,
        status: "sent",
        store: { name: "Shop", number: "7" },
        photoUrls: ["https://img/1", "https://img/2"],
      }),
    ]);
  });

  it("records a failed send once, and updates the same entry on retry", async () => {
    const { result } = await readyLead();
    let saveStatus = 502;
    const fetchMock = mockFetch((url) => (url.startsWith("/api/upload") ? json({ url: "u" }) : json({}, saveStatus)));

    await act(async () => {
      await result.current.submit();
    });
    expect(loadHistory()).toHaveLength(1);
    expect(loadHistory()[0]).toMatchObject({ status: "failed", error: "Saving the lead failed" });

    const firstDate = loadHistory()[0].createdAt;
    saveStatus = 200;
    await act(async () => {
      await result.current.submit();
    });
    expect(loadHistory()).toHaveLength(1);
    expect(loadHistory()[0].status).toBe("sent");

    // the retry must send the date of the first attempt
    const bodies = fetchMock.mock.calls
      .filter(([u]) => u === "/api/save-lead")
      .map(([, init]) => JSON.parse(String(init!.body)));
    expect(bodies.map((b) => b.submittedAt)).toEqual([firstDate, firstDate]);
  });

  it("keeps all data when a photo upload fails", async () => {
    const { result } = await readyLead();
    mockFetch(() => json({ error: "boom" }, 500));

    let res;
    await act(async () => {
      res = await result.current.submit();
    });
    expect(res).toEqual({ ok: false, error: "Failed to upload photo. Please try again." });
    expect(result.current.barcodes).toHaveLength(2);
    expect(result.current.photos).toHaveLength(2);
    expect(JSON.parse(localStorage.getItem(DRAFT_KEY)!).barcodes).toHaveLength(2);
  });

  it("keeps all data when the network is down", async () => {
    const { result } = await readyLead();
    vi.stubGlobal("fetch", vi.fn(() => Promise.reject(new TypeError("Failed to fetch"))));

    let res;
    await act(async () => {
      res = await result.current.submit();
    });
    expect(res).toMatchObject({ ok: false });
    expect(result.current.barcodes).toHaveLength(2);
  });

  it("keeps all data when saving the lead fails", async () => {
    const { result } = await readyLead();
    mockFetch((url) => (url.startsWith("/api/upload") ? json({ url: "u" }) : json({ status: "error" }, 502)));

    let res;
    await act(async () => {
      res = await result.current.submit();
    });
    expect(res).toEqual({ ok: false, error: "Failed to save lead. Please try again." });
    expect(result.current.store).toEqual({ name: "Shop", number: "7" });
    expect(result.current.barcodes).toHaveLength(2);
  });
});
