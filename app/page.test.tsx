import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import Home from "./page";
import { VALID_BARCODES } from "./lib/validBarcodes";

// The real scanner needs a camera: replace it with buttons that emit a scan
vi.mock("@/app/components/QrScanner", () => ({
  default: ({ onScan }: { onScan: (code: string) => void }) => (
    <div>
      <button onClick={() => onScan(VALID_BARCODES[0])}>scan valid</button>
      <button onClick={() => onScan("0000000000000")}>scan invalid</button>
    </div>
  ),
}));

vi.mock("@/app/lib/compressImage", () => ({
  compressImage: (file: File) => Promise.resolve(file),
}));

vi.mock("next/image", () => ({
  // eslint-disable-next-line @next/next/no-img-element
  default: ({ src, alt }: { src: string; alt: string }) => <img src={src} alt={alt} />,
}));

const VALID = VALID_BARCODES[0];

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } });

let saveLeadStatus = 200;
let fetchMock: ReturnType<typeof vi.fn>;

beforeEach(() => {
  saveLeadStatus = 200;
  fetchMock = vi.fn((input: RequestInfo | URL) => {
    const url = String(input);
    if (url.startsWith("/api/upload")) return Promise.resolve(json({ url: "https://img/1" }));
    return Promise.resolve(json({ status: saveLeadStatus === 200 ? "success" : "error" }, saveLeadStatus));
  });
  vi.stubGlobal("fetch", fetchMock);
  URL.createObjectURL = vi.fn(() => "blob:preview");
  URL.revokeObjectURL = vi.fn();
  vi.spyOn(console, "error").mockImplementation(() => {});
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

async function enterStore(user: ReturnType<typeof userEvent.setup>) {
  await user.type(await screen.findByPlaceholderText("Store name"), "Shop");
  await user.type(screen.getByPlaceholderText("Store number"), "7");
  await user.click(screen.getByRole("button", { name: "Continue" }));
}

async function scanValid(user: ReturnType<typeof userEvent.setup>) {
  await user.click(screen.getByRole("button", { name: "scan valid" }));
  await user.click(screen.getByText("Tap anywhere to continue"));
}

async function goToPhotosAndAddOne(user: ReturnType<typeof userEvent.setup>) {
  await user.click(screen.getByRole("button", { name: "Proceed" }));
  const input = document.querySelector<HTMLInputElement>('input[type="file"]')!;
  await user.upload(input, new File(["x"], "p.jpg", { type: "image/jpeg" }));
  await screen.findByAltText("Photo 1");
}

describe("lead capture flow", () => {
  it("asks for the store first, then shows the scanner", async () => {
    const user = userEvent.setup();
    render(<Home />);
    await enterStore(user);
    expect(screen.getByText("Shop #7")).toBeInTheDocument();
  });

  it("adds a valid scan and rejects an unknown barcode", async () => {
    const user = userEvent.setup();
    render(<Home />);
    await enterStore(user);

    await user.click(screen.getByRole("button", { name: "scan valid" }));
    expect(screen.getByText("✅ Item scanned")).toBeInTheDocument();
    await user.click(screen.getByText("Tap anywhere to continue"));
    expect(screen.getByText(VALID)).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "scan invalid" }));
    expect(screen.getByText(/not recognized/)).toBeInTheDocument();
    await user.click(screen.getByText("Tap anywhere to continue"));
    expect(screen.queryByText("0000000000000")).not.toBeInTheDocument();
    expect(screen.getByText("Total: 1")).toBeInTheDocument();
  });

  it("changes quantities by exactly one and removes at zero", async () => {
    const user = userEvent.setup();
    render(<Home />);
    await enterStore(user);
    await scanValid(user);

    await user.click(screen.getByRole("button", { name: "Increment" }));
    expect(screen.getByText("x2")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Decrement" }));
    await user.click(screen.getByRole("button", { name: "Decrement" }));
    expect(screen.queryByText(VALID)).not.toBeInTheDocument();
  });

  it("adds a barcode manually", async () => {
    const user = userEvent.setup();
    render(<Home />);
    await enterStore(user);

    await user.click(screen.getByRole("button", { name: "Add barcode manually" }));
    await user.type(screen.getByPlaceholderText("Barcode"), "999");
    const qty = screen.getByPlaceholderText("Quantity");
    await user.clear(qty);
    await user.type(qty, "3");
    await user.click(screen.getByRole("button", { name: "Add" }));

    expect(screen.getByText("999")).toBeInTheDocument();
    expect(screen.getByText("x3")).toBeInTheDocument();
  });

  it("submits the lead and goes back to the store step", async () => {
    const user = userEvent.setup();
    render(<Home />);
    await enterStore(user);
    await scanValid(user);
    await goToPhotosAndAddOne(user);

    await user.click(screen.getByRole("button", { name: "Send Data" }));
    expect(await screen.findByText("Completed")).toBeInTheDocument();
    expect(fetchMock).toHaveBeenCalledWith("/api/save-lead", expect.anything());

    await user.click(screen.getByText("Tap anywhere to continue"));
    expect(screen.getByPlaceholderText("Store name")).toBeInTheDocument();
  });

  it("on save failure shows the error, Go back keeps the data, Retry succeeds", async () => {
    const user = userEvent.setup();
    render(<Home />);
    await enterStore(user);
    await scanValid(user);
    await goToPhotosAndAddOne(user);

    saveLeadStatus = 502;
    await user.click(screen.getByRole("button", { name: "Send Data" }));
    expect(await screen.findByText("Failed to save lead. Please try again.")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Go back" }));
    expect(screen.getByAltText("Photo 1")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Send Data" }));
    await screen.findByText("Failed to save lead. Please try again.");
    saveLeadStatus = 200;
    await user.click(screen.getByRole("button", { name: "Retry" }));
    expect(await screen.findByText("Completed")).toBeInTheDocument();
  });

  it("opens the history from the store step and lists the sent lead", async () => {
    const user = userEvent.setup();
    render(<Home />);
    await enterStore(user);
    await scanValid(user);
    await goToPhotosAndAddOne(user);
    await user.click(screen.getByRole("button", { name: "Send Data" }));
    await user.click(await screen.findByText("Tap anywhere to continue"));

    await user.click(screen.getByRole("button", { name: "History" }));
    expect(screen.getByText("Shop #7")).toBeInTheDocument();
    expect(screen.getByText("Sent")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "← Back" }));
    expect(screen.getByPlaceholderText("Store name")).toBeInTheDocument();
  });

  it("goes back from photos to the scanner keeping barcodes and photos", async () => {
    const user = userEvent.setup();
    render(<Home />);
    await enterStore(user);
    await scanValid(user);
    await goToPhotosAndAddOne(user);

    await user.click(screen.getByRole("button", { name: "← Back" }));
    expect(screen.getByText(VALID)).toBeInTheDocument();
    await scanValid(user);
    expect(screen.getByText("x2")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Proceed" }));
    expect(screen.getByAltText("Photo 1")).toBeInTheDocument();
  });

  it("goes back from the scanner to the store form, prefilled and keeping barcodes", async () => {
    const user = userEvent.setup();
    render(<Home />);
    await enterStore(user);
    await scanValid(user);

    await user.click(screen.getByRole("button", { name: "← Back" }));
    expect(screen.getByPlaceholderText("Store name")).toHaveValue("Shop");
    expect(screen.getByPlaceholderText("Store number")).toHaveValue("7");

    await user.clear(screen.getByPlaceholderText("Store number"));
    await user.type(screen.getByPlaceholderText("Store number"), "8");
    await user.click(screen.getByRole("button", { name: "Continue" }));
    expect(screen.getByText("Shop #8")).toBeInTheDocument();
    expect(screen.getByText(VALID)).toBeInTheDocument();
  });

  it("restores store and barcodes after a page reload", async () => {
    const user = userEvent.setup();
    const first = render(<Home />);
    await enterStore(user);
    await scanValid(user);
    first.unmount();

    render(<Home />);
    await waitFor(() => expect(screen.getByText("Shop #7")).toBeInTheDocument());
    expect(screen.getByText(VALID)).toBeInTheDocument();
  });
});
