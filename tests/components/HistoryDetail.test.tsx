import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import HistoryDetail from "@/src/components/HistoryDetail";
import type { HistoryEntry } from "@/src/lib/history";

function entry(overrides: Partial<HistoryEntry> = {}): HistoryEntry {
  return {
    id: "id-1",
    createdAt: "2026-10-21T10:30:00.000Z",
    store: { name: "Shop", number: "7" },
    barcodes: [
      { barcode: "A", quantity: 2 },
      { barcode: "B", quantity: 3 },
    ],
    photoUrls: ["https://img/1", "https://img/2"],
    status: "sent",
    ...overrides,
  };
}

describe("HistoryDetail", () => {
  it("shows store, status, every barcode with its quantity and the photos", () => {
    render(<HistoryDetail entry={entry()} onBack={() => {}} />);

    expect(screen.getByText("Shop #7")).toBeInTheDocument();
    expect(screen.getByText("Sent")).toBeInTheDocument();
    expect(screen.getByText("Barcodes (2)")).toBeInTheDocument();
    expect(screen.getByText("Total: 5")).toBeInTheDocument();
    expect(screen.getByText("x2")).toBeInTheDocument();
    expect(screen.getByText("x3")).toBeInTheDocument();
    expect(screen.getByAltText("Photo 2")).toHaveAttribute("src", "https://img/2");
  });

  it("shows why a failed inventory failed", () => {
    render(<HistoryDetail entry={entry({ status: "failed", error: "Photo upload failed", photoUrls: [] })} onBack={() => {}} />);
    expect(screen.getByText("Photo upload failed")).toBeInTheDocument();
    expect(screen.getByText("No photos were uploaded for this inventory.")).toBeInTheDocument();
  });

  it("handles a missing entry", async () => {
    const user = userEvent.setup();
    const onBack = vi.fn();
    render(<HistoryDetail entry={null} onBack={onBack} />);

    expect(screen.getByText("Inventory not found.")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "← Back" }));
    expect(onBack).toHaveBeenCalled();
  });
});
