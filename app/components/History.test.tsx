import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import History from "./History";
import { loadHistory, saveHistoryEntry, type HistoryEntry } from "@/app/lib/history";
import { shareFile } from "@/app/lib/shareFile";

vi.mock("@/app/lib/shareFile", () => ({ shareFile: vi.fn(() => Promise.resolve()) }));

function entry(overrides: Partial<HistoryEntry> = {}): HistoryEntry {
  return {
    id: "id-1",
    createdAt: "2026-10-21T10:30:00.000Z",
    store: { name: "Shop", number: "7" },
    barcodes: [{ barcode: "A", quantity: 2 }],
    photoUrls: ["https://img/1"],
    status: "failed",
    error: "Saving the lead failed",
    ...overrides,
  };
}

// jsdom's File has no .text()
function readText(file: File) {
  return new Promise<string>((resolve) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.readAsText(file);
  });
}

let fetchMock: ReturnType<typeof vi.fn>;

beforeEach(() => {
  localStorage.clear();
  fetchMock = vi.fn(() => Promise.resolve(Response.json({ status: "success" })));
  vi.stubGlobal("fetch", fetchMock);
  vi.spyOn(console, "error").mockImplementation(() => {});
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe("History", () => {
  it("shows an empty state", () => {
    render(<History onBack={() => {}} />);
    expect(screen.getByText("No submissions yet.")).toBeInTheDocument();
  });

  it("lists entries with their status", () => {
    saveHistoryEntry(entry());
    render(<History onBack={() => {}} />);
    expect(screen.getByText("Shop #7")).toBeInTheDocument();
    expect(screen.getByText("Failed")).toBeInTheDocument();
    expect(screen.getByText("1 barcodes · 2 items · 1 photos")).toBeInTheDocument();
  });

  it("shares the entry as a CSV file", async () => {
    const user = userEvent.setup();
    saveHistoryEntry(entry());
    render(<History onBack={() => {}} />);

    await user.click(screen.getByRole("button", { name: "Share CSV" }));

    const file = vi.mocked(shareFile).mock.calls[0][0];
    expect(file.name).toBe("lead_Shop_7_2026-10-21-06-30.csv");
    expect(file.type).toBe("text/csv");
    expect(await readText(file)).toContain("Shop,7,A,2,https://img/1");
  });

  it("resends a failed entry and marks it as sent", async () => {
    const user = userEvent.setup();
    saveHistoryEntry(entry());
    render(<History onBack={() => {}} />);

    await user.click(screen.getByRole("button", { name: "Resend" }));

    await waitFor(() => expect(screen.getByText("Sent")).toBeInTheDocument());
    expect(loadHistory()[0].status).toBe("sent");
    const body = JSON.parse(fetchMock.mock.calls[0][1].body);
    expect(body).toMatchObject({
      submissionId: "id-1",
      submittedAt: "2026-10-21T10:30:00.000Z",
      storeName: "Shop",
      storeNumber: "7",
    });
    expect(body.barcodes[0]).toMatchObject({ barcode: "A", quantity: 2, photo_1: "https://img/1" });
  });

  it("keeps the entry as failed when the resend fails", async () => {
    const user = userEvent.setup();
    vi.spyOn(window, "alert").mockImplementation(() => {});
    fetchMock.mockImplementation(() => Promise.resolve(Response.json({ status: "error" }, { status: 502 })));
    saveHistoryEntry(entry());
    render(<History onBack={() => {}} />);

    await user.click(screen.getByRole("button", { name: "Resend" }));

    await waitFor(() => expect(window.alert).toHaveBeenCalled());
    expect(screen.getByText("Failed")).toBeInTheDocument();
    expect(loadHistory()[0].status).toBe("failed");
  });

  it("asks for confirmation before resending an already sent entry", async () => {
    const user = userEvent.setup();
    const confirmSpy = vi.spyOn(window, "confirm").mockReturnValue(false);
    saveHistoryEntry(entry({ status: "sent" }));
    render(<History onBack={() => {}} />);

    await user.click(screen.getByRole("button", { name: "Resend" }));

    expect(confirmSpy).toHaveBeenCalled();
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
