import { useSyncExternalStore, type ComponentType } from "react";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { InventoryDraftProvider } from "@/src/providers/InventoryDraftProvider";
import { ROUTES } from "@/src/lib/routes";
import { VALID_BARCODES } from "@/src/lib/validBarcodes";
import { t } from "@/src/lib/strings";
import { shareFile } from "@/src/lib/shareFile";
import StorePage from "@/app/page";
import ScanPage from "@/app/(inventory)/scan/page";
import ManualPage from "@/app/(inventory)/manual/page";
import PhotosPage from "@/app/(inventory)/photos/page";
import DonePage from "@/app/done/[id]/page";
import HistoryPage from "@/app/history/page";
import InventoryLayout from "@/app/(inventory)/layout";
import HistoryEntryPage from "@/app/history/[id]/page";

// In-memory replacement for the Next router: a history stack like the browser's
const nav = vi.hoisted(() => {
  const listeners = new Set<() => void>();
  const state = { stack: ["/"] };
  const notify = () => listeners.forEach((l) => l());
  const router = {
    push: (href: string) => {
      state.stack = [...state.stack, href];
      notify();
    },
    replace: (href: string) => {
      state.stack = [...state.stack.slice(0, -1), href];
      notify();
    },
    back: () => {
      state.stack = state.stack.slice(0, -1);
      notify();
    },
  };
  return {
    state,
    router,
    path: () => state.stack[state.stack.length - 1],
    subscribe: (l: () => void) => {
      listeners.add(l);
      return () => listeners.delete(l);
    },
  };
});

vi.mock("next/navigation", () => ({
  useRouter: () => nav.router,
  usePathname: () => nav.path(),
  useParams: () => ({ id: nav.path().split("/")[2] }),
}));

// The real scanner needs a camera: replace it with buttons that emit a scan
vi.mock("@/src/components/QrScanner", () => ({
  default: ({ onScan }: { onScan: (code: string) => void }) => (
    <div>
      <button onClick={() => onScan(VALID_BARCODES[0])}>scan valid</button>
      <button onClick={() => onScan("0000000000000")}>scan invalid</button>
    </div>
  ),
}));

// Sharing opens the native share sheet: just record what would be shared
vi.mock("@/src/lib/shareFile", () => ({ shareFile: vi.fn(() => Promise.resolve()) }));

vi.mock("@/src/lib/compressImage", () => ({
  compressImage: (file: File) => Promise.resolve(file),
}));

vi.mock("next/image", () => ({
  // eslint-disable-next-line @next/next/no-img-element
  default: ({ src, alt }: { src: string; alt: string }) => <img src={src} alt={alt} />,
}));

// path -> page, and whether it lives in the app/(inventory) route group
type Route = { Page: ComponentType; inGroup?: boolean };

const PAGES: Record<string, Route> = {
  [ROUTES.store]: { Page: StorePage },
  [ROUTES.scan]: { Page: ScanPage, inGroup: true },
  [ROUTES.manual]: { Page: ManualPage, inGroup: true },
  [ROUTES.photos]: { Page: PhotosPage, inGroup: true },
  [ROUTES.history]: { Page: HistoryPage },
};

// Root layout + group layout (when needed) + the page matching the current path, like Next does
function App() {
  const path = useSyncExternalStore(nav.subscribe, nav.path);
  const route: Route | undefined = path.startsWith(`${ROUTES.history}/`)
    ? { Page: HistoryEntryPage }
    : path.startsWith("/done/")
      ? { Page: DonePage }
      : PAGES[path];
  if (!route) return <p>404 {path}</p>;
  const page = <route.Page />;
  return (
    <InventoryDraftProvider>
      {route.inGroup ? <InventoryLayout>{page}</InventoryLayout> : page}
    </InventoryDraftProvider>
  );
}

function openApp(path = "/") {
  nav.state.stack = [path];
  return render(<App />);
}

// A reload keeps the URL and the browser history, but loses all React state
function reload(app: ReturnType<typeof render>) {
  app.unmount();
  return render(<App />);
}

const VALID = VALID_BARCODES[0];

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } });

let saveStatus = 200;
let fetchMock: ReturnType<typeof vi.fn>;

beforeEach(() => {
  vi.mocked(shareFile).mockClear();
  saveStatus = 200;
  fetchMock = vi.fn((input: RequestInfo | URL) => {
    const url = String(input);
    if (url.startsWith("/api/upload")) return Promise.resolve(json({ url: "https://img/1" }));
    return Promise.resolve(json({ status: saveStatus === 200 ? "success" : "error" }, saveStatus));
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
  await user.click(screen.getByRole("button", { name: t.common.next }));
}

async function scanValid(user: ReturnType<typeof userEvent.setup>) {
  await user.click(screen.getByRole("button", { name: "scan valid" }));
  await user.click(screen.getByText("Tap anywhere to continue"));
}

async function goToPhotosAndAddOne(user: ReturnType<typeof userEvent.setup>) {
  await user.click(screen.getByRole("button", { name: t.common.next }));
  const input = document.querySelector<HTMLInputElement>('input[type="file"]')!;
  await user.upload(input, new File(["x"], "p.jpg", { type: "image/jpeg" }));
  await screen.findByAltText("Photo 1");
}

describe("inventory capture flow", () => {
  it("asks for the store first, then opens /scan", async () => {
    const user = userEvent.setup();
    openApp();
    await enterStore(user);
    expect(nav.path()).toBe("/scan");
    expect(screen.getByLabelText("Shop #7")).toBeInTheDocument();
  });

  it("redirects pages that need a store to the store form", async () => {
    openApp("/scan");
    await waitFor(() => expect(nav.path()).toBe("/"));
    expect(screen.getByPlaceholderText("Store name")).toBeInTheDocument();
  });

  it("adds a valid scan and rejects an unknown barcode", async () => {
    const user = userEvent.setup();
    openApp();
    await enterStore(user);

    await user.click(screen.getByRole("button", { name: "scan valid" }));
    expect(screen.getByText(t.scan.scanned)).toBeInTheDocument();
    await user.click(screen.getByText("Tap anywhere to continue"));
    expect(screen.getByText(VALID)).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "scan invalid" }));
    expect(screen.getByText(t.scan.notRecognized)).toBeInTheDocument();
    await user.click(screen.getByText("Tap anywhere to continue"));
    expect(screen.queryByText("0000000000000")).not.toBeInTheDocument();
    expect(screen.getByText("Total: 1")).toBeInTheDocument();
  });

  it("keeps Next disabled until at least one barcode is in the list", async () => {
    const user = userEvent.setup();
    openApp();
    await enterStore(user);

    expect(screen.getByText(t.scan.empty)).toBeInTheDocument();
    expect(screen.getByText(t.scan.needBarcode)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: t.common.next })).toBeDisabled();

    await scanValid(user);
    expect(screen.queryByText(t.scan.needBarcode)).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: t.common.next })).toBeEnabled();
  });

  it("keeps Send disabled until at least one photo is added", async () => {
    const user = userEvent.setup();
    openApp();
    await enterStore(user);
    await scanValid(user);
    await user.click(screen.getByRole("button", { name: t.common.next }));

    expect(screen.getByText(t.photos.needPhoto)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: t.photos.send })).toBeDisabled();
  });

  it("keeps Next disabled on the store form until both fields are filled", async () => {
    const user = userEvent.setup();
    openApp();
    await user.type(await screen.findByLabelText(t.store.name), "Shop");
    expect(screen.getByRole("button", { name: t.common.next })).toBeDisabled();
    await user.type(screen.getByLabelText(t.store.number), "7");
    expect(screen.getByRole("button", { name: t.common.next })).toBeEnabled();
  });

  it("changes quantities by exactly one and removes at zero", async () => {
    const user = userEvent.setup();
    openApp();
    await enterStore(user);
    await scanValid(user);

    await user.click(screen.getByRole("button", { name: "Increment" }));
    expect(screen.getByText("x2")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Decrement" }));
    await user.click(screen.getByRole("button", { name: "Decrement" }));
    expect(screen.queryByText(VALID)).not.toBeInTheDocument();
  });

  it("adds a barcode manually on /manual and returns to /scan", async () => {
    const user = userEvent.setup();
    openApp();
    await enterStore(user);

    await user.click(screen.getByRole("button", { name: t.scan.addManually }));
    expect(nav.path()).toBe("/manual");
    await user.type(screen.getByPlaceholderText("Barcode"), "999");
    const qty = screen.getByPlaceholderText("Quantity");
    await user.clear(qty);
    await user.type(qty, "3");
    await user.click(screen.getByRole("button", { name: "Add" }));

    expect(nav.path()).toBe("/scan");
    expect(screen.getByText("999")).toBeInTheDocument();
    expect(screen.getByText("x3")).toBeInTheDocument();
  });

  it("submits the inventory, shows /done and starts a fresh draft", async () => {
    const user = userEvent.setup();
    openApp();
    await enterStore(user);
    await scanValid(user);
    await goToPhotosAndAddOne(user);

    await user.click(screen.getByRole("button", { name: t.photos.send }));
    expect(await screen.findByRole("heading", { name: t.done.title })).toBeInTheDocument();
    expect(nav.path()).toMatch(/^\/done\/.+/);
    expect(screen.getByText("Shop #7")).toBeInTheDocument();
    expect(fetchMock).toHaveBeenCalledWith("/api/save-inventory", expect.anything());

    await user.click(screen.getByRole("button", { name: t.done.newInventory }));
    expect(nav.path()).toBe("/");
    expect(screen.getByPlaceholderText("Store name")).toHaveValue("");
  });

  it("on save failure shows the error, Back keeps the data, Try again succeeds", async () => {
    const user = userEvent.setup();
    openApp();
    await enterStore(user);
    await scanValid(user);
    await goToPhotosAndAddOne(user);

    saveStatus = 502;
    await user.click(screen.getByRole("button", { name: t.photos.send }));
    expect(await screen.findByText(t.errors.saveInventory)).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: t.common.back }));
    expect(screen.getByAltText("Photo 1")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: t.photos.send }));
    await screen.findByText(t.errors.saveInventory);
    saveStatus = 200;
    await user.click(screen.getByRole("button", { name: t.photos.retry }));
    expect(await screen.findByRole("heading", { name: t.done.title })).toBeInTheDocument();
  });

  it("shares the sent inventory as CSV from the sent screen", async () => {
    const user = userEvent.setup();
    openApp();
    await enterStore(user);
    await scanValid(user);
    await goToPhotosAndAddOne(user);
    await user.click(screen.getByRole("button", { name: t.photos.send }));

    await user.click(await screen.findByRole("button", { name: t.common.shareCsv }));
    const file = vi.mocked(shareFile).mock.calls[0][0];
    expect(file.name).toMatch(/^inventory_Shop_7_.+\.csv$/);
    expect(file.type).toBe("text/csv");
  });

  it("offers Share CSV when sending fails, so the inventory can still leave the phone", async () => {
    const user = userEvent.setup();
    openApp();
    await enterStore(user);
    await scanValid(user);
    await goToPhotosAndAddOne(user);

    saveStatus = 502;
    await user.click(screen.getByRole("button", { name: t.photos.send }));
    await user.click(await screen.findByRole("button", { name: t.common.shareCsv }));

    expect(vi.mocked(shareFile)).toHaveBeenCalledTimes(1);
    expect(vi.mocked(shareFile).mock.calls[0][0].name).toMatch(/^inventory_Shop_7_.+\.csv$/);
  });

  it("opens /history from the store page and lists the sent inventory", async () => {
    const user = userEvent.setup();
    openApp();
    await enterStore(user);
    await scanValid(user);
    await goToPhotosAndAddOne(user);
    await user.click(screen.getByRole("button", { name: t.photos.send }));
    await user.click(await screen.findByRole("button", { name: t.done.newInventory }));

    await user.click(screen.getByRole("button", { name: t.store.history }));
    expect(nav.path()).toBe("/history");
    expect(screen.getByText("Shop #7")).toBeInTheDocument();
    expect(screen.getByText("Sent")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "← Back" }));
    expect(nav.path()).toBe("/");
  });

  it("opens a single inventory from /history and goes back to the list", async () => {
    const user = userEvent.setup();
    openApp();
    await enterStore(user);
    await scanValid(user);
    await goToPhotosAndAddOne(user);
    await user.click(screen.getByRole("button", { name: t.photos.send }));
    await user.click(await screen.findByRole("button", { name: t.done.newInventory }));
    await user.click(screen.getByRole("button", { name: t.store.history }));

    await user.click(screen.getByRole("button", { name: "View" }));
    expect(nav.path()).toMatch(/^\/history\/.+/);
    expect(screen.getByRole("heading", { name: "Inventory" })).toBeInTheDocument();
    expect(screen.getByText(VALID)).toBeInTheDocument();
    expect(screen.getByAltText("Photo 1")).toHaveAttribute("src", "https://img/1");

    await user.click(screen.getByRole("button", { name: "← Back" }));
    expect(nav.path()).toBe("/history");
  });

  it("goes back from /photos to /scan keeping barcodes and photos", async () => {
    const user = userEvent.setup();
    openApp();
    await enterStore(user);
    await scanValid(user);
    await goToPhotosAndAddOne(user);

    await user.click(screen.getByRole("button", { name: "← Back" }));
    expect(nav.path()).toBe("/scan");
    expect(screen.getByText(VALID)).toBeInTheDocument();
    await scanValid(user);
    expect(screen.getByText("x2")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: t.common.next }));
    expect(screen.getByAltText("Photo 1")).toBeInTheDocument();
  });

  it("goes back from /scan to the store form, prefilled and keeping barcodes", async () => {
    const user = userEvent.setup();
    openApp();
    await enterStore(user);
    await scanValid(user);

    await user.click(screen.getByRole("button", { name: "← Back" }));
    expect(nav.path()).toBe("/");
    expect(screen.getByPlaceholderText("Store name")).toHaveValue("Shop");
    expect(screen.getByPlaceholderText("Store number")).toHaveValue("7");

    await user.clear(screen.getByPlaceholderText("Store number"));
    await user.type(screen.getByPlaceholderText("Store number"), "8");
    await user.click(screen.getByRole("button", { name: t.common.next }));
    expect(screen.getByLabelText("Shop #8")).toBeInTheDocument();
    expect(screen.getByText(VALID)).toBeInTheDocument();
  });

  it("keeps store and barcodes when the page is reloaded after pressing Back", async () => {
    const user = userEvent.setup();
    const app = openApp();
    await enterStore(user);
    await scanValid(user);
    await user.click(screen.getByRole("button", { name: "← Back" }));

    reload(app);
    expect(await screen.findByPlaceholderText("Store name")).toHaveValue("Shop");
    await user.click(screen.getByRole("button", { name: t.common.next }));
    expect(screen.getByText(VALID)).toBeInTheDocument();
  });

  it("restores store and barcodes after reloading /scan", async () => {
    const user = userEvent.setup();
    const app = openApp();
    await enterStore(user);
    await scanValid(user);

    reload(app);
    await waitFor(() => expect(screen.getByLabelText("Shop #7")).toBeInTheDocument());
    expect(nav.path()).toBe("/scan");
    expect(screen.getByText(VALID)).toBeInTheDocument();
  });
});
