// @vitest-environment node
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { POST } from "@/app/api/save-inventory/route";

const SCRIPT_URL = "https://script.example/exec";

function request(body: unknown) {
  return new Request("http://localhost/api/save-inventory", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: typeof body === "string" ? body : JSON.stringify(body),
  });
}

function mockScript(response: Response) {
  const fn = vi.fn(() => Promise.resolve(response));
  vi.stubGlobal("fetch", fn);
  return fn;
}

beforeEach(() => {
  vi.stubEnv("GOOGLE_SCRIPT_URL", SCRIPT_URL);
  vi.spyOn(console, "log").mockImplementation(() => {});
  vi.spyOn(console, "error").mockImplementation(() => {});
});

afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe("POST /api/save-inventory", () => {
  it("forwards the inventory to the Apps Script and returns its result", async () => {
    const fetchMock = mockScript(Response.json({ status: "success" }));
    const inventory = { storeName: "Shop", storeNumber: "7", barcodes: [] };

    const res = await POST(request(inventory));

    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ status: "success" });
    expect(fetchMock).toHaveBeenCalledWith(SCRIPT_URL, expect.objectContaining({ method: "POST" }));
    expect(JSON.parse((fetchMock.mock.calls[0] as unknown as [string, RequestInit])[1].body as string)).toEqual(inventory);
  });

  it("returns 500 when GOOGLE_SCRIPT_URL is not set", async () => {
    vi.stubEnv("GOOGLE_SCRIPT_URL", "");
    const fetchMock = mockScript(Response.json({}));

    const res = await POST(request({}));

    expect(res.status).toBe(500);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("returns 502 when the Apps Script responds with an HTTP error", async () => {
    mockScript(new Response("Service unavailable", { status: 503 }));
    const res = await POST(request({}));
    expect(res.status).toBe(502);
  });

  it("returns 502 when the Apps Script reports status error", async () => {
    mockScript(Response.json({ status: "error", message: "lock timeout" }));
    const res = await POST(request({}));
    expect(res.status).toBe(502);
  });

  it("returns 500 when the Apps Script returns non-JSON (e.g. an HTML error page)", async () => {
    mockScript(new Response("<html>error</html>", { status: 200 }));
    const res = await POST(request({}));
    expect(res.status).toBe(500);
  });

  it("returns 500 when the request body is not valid JSON", async () => {
    mockScript(Response.json({}));
    const res = await POST(request("not json"));
    expect(res.status).toBe(500);
  });
});
