import { beforeEach, describe, expect, it } from "vitest";
import {
  historyEntryFilename,
  historyEntryToCsv,
  loadHistory,
  saveHistoryEntry,
  type HistoryEntry,
} from "@/src/lib/history";

function entry(overrides: Partial<HistoryEntry> = {}): HistoryEntry {
  return {
    id: "id-1",
    createdAt: "2026-10-21T10:30:00.000Z",
    store: { name: "Shop", number: "7" },
    barcodes: [{ barcode: "A", quantity: 2 }],
    photoUrls: [],
    status: "sent",
    ...overrides,
  };
}

beforeEach(() => {
  localStorage.clear();
});

describe("history storage", () => {
  it("is empty by default and when storage is corrupted", () => {
    expect(loadHistory()).toEqual([]);
    localStorage.setItem("lead-capture:history:v1", "{bad");
    expect(loadHistory()).toEqual([]);
  });

  it("puts new entries at the top", () => {
    saveHistoryEntry(entry({ id: "1" }));
    saveHistoryEntry(entry({ id: "2" }));
    expect(loadHistory().map((e) => e.id)).toEqual(["2", "1"]);
  });

  it("updates an existing entry in place and keeps its original date", () => {
    saveHistoryEntry(entry({ id: "1", status: "pending" }));
    saveHistoryEntry(entry({ id: "2" }));
    saveHistoryEntry(entry({ id: "1", status: "sent", createdAt: "2030-01-01T00:00:00.000Z" }));

    const history = loadHistory();
    expect(history.map((e) => e.id)).toEqual(["2", "1"]);
    expect(history[1]).toMatchObject({ status: "sent", createdAt: "2026-10-21T10:30:00.000Z" });
  });
});

describe("csv export", () => {
  it("writes one row per barcode with photos on the first row", () => {
    const csv = historyEntryToCsv(
      entry({
        barcodes: [
          { barcode: "A", quantity: 2 },
          { barcode: "B", quantity: 1 },
        ],
        photoUrls: ["https://img/1", "https://img/2"],
      })
    );

    expect(csv.split("\r\n")).toEqual([
      "submission_id,date,store_name,store_number,barcode,quantity,photo_1,photo_2,photo_3,photo_4,status",
      "id-1,2026-10-21 06:30,Shop,7,A,2,https://img/1,https://img/2,,,sent",
      "id-1,2026-10-21 06:30,Shop,7,B,1,,,,,sent",
    ]);
  });

  it("escapes commas and quotes", () => {
    const csv = historyEntryToCsv(entry({ store: { name: 'Bob\'s "Best", Inc', number: "7" } }));
    expect(csv.split("\r\n")[1]).toContain('"Bob\'s ""Best"", Inc"');
  });

  it("builds a filesystem-safe filename", () => {
    expect(historyEntryFilename(entry({ store: { name: "My Shop/NY", number: "7" } }))).toBe(
      "inventory_My_Shop_NY_7_2026-10-21-06-30.csv"
    );
  });
});
