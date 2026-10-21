"use client";

import { useState } from "react";
import CompanyCodeInput from "@/app/components/CompanyCodeInput";
import Loader from "@/app/components/Loader";
import ScanOverlay from "@/app/components/ScanOverlay";
import TakePhoto from "@/app/components/TakePhoto";
import AddManualBarcode from "@/app/components/AddManualBarcode";
import MainContent from "@/app/components/MainContent";
import ErrorMessage from "@/app/components/ErrorMessage";
import History from "@/app/components/History";
import { useLeadDraft, type Store } from "@/app/hooks/useLeadDraft";
import { VALID_BARCODES } from "@/app/lib/validBarcodes";

type Screen =
  | { kind: "scan" }
  | { kind: "manual" }
  | { kind: "photos" }
  | { kind: "scanResult"; ok: boolean }
  | { kind: "uploading" }
  | { kind: "done" }
  | { kind: "error"; message: string }
  | { kind: "history" };

export default function Home() {
  const lead = useLeadDraft();
  const [screen, setScreen] = useState<Screen>({ kind: "scan" });
  // prefills the store form when going back from the scanner
  const [previousStore, setPreviousStore] = useState<Store | null>(null);

  function handleBackToStore() {
    setPreviousStore(lead.store);
    lead.setStore(null);
  }

  function handleScan(code: string) {
    // the scanner stays live under the result overlay: ignore reads until it's dismissed
    if (screen.kind !== "scan") return;
    const ok = VALID_BARCODES.length === 0 || VALID_BARCODES.includes(code);
    if (ok) lead.addBarcode(code);
    setScreen({ kind: "scanResult", ok });
  }

  async function handleSubmit() {
    setScreen({ kind: "uploading" });
    const result = await lead.submit();
    if (result.ok) setPreviousStore(null);
    setScreen(result.ok ? { kind: "done" } : { kind: "error", message: result.error });
  }

  if (!lead.hydrated) {
    return null;
  }

  // Full-screen overlays, shown regardless of the store step
  switch (screen.kind) {
    case "uploading":
      return <Loader />;

    case "done":
      return <ScanOverlay onClose={() => setScreen({ kind: "scan" })} text="Completed" />;

    case "error":
      return (
        <ErrorMessage
          error={screen.message}
          onRetry={handleSubmit}
          onBack={() => setScreen({ kind: "photos" })}
        />
      );

    case "history":
      return <History onBack={() => setScreen({ kind: "scan" })} />;
  }

  if (!lead.store) {
    return (
      <main className="h-dvh w-screen flex flex-col bg-white relative">
        <button
          className="absolute top-4 right-4 z-10 border border-blue-950 text-blue-950 font-semibold px-3 py-1 rounded"
          onClick={() => setScreen({ kind: "history" })}
        >
          History
        </button>
        <div className="flex-1 flex items-center justify-center p-4">
          <CompanyCodeInput
            initialName={previousStore?.name}
            initialNumber={previousStore?.number}
            onSubmit={(name, number) => lead.setStore({ name, number })}
          />
        </div>
      </main>
    );
  }

  switch (screen.kind) {
    case "manual":
      return (
        <AddManualBarcode
          onAdd={(barcode, quantity) => {
            lead.addBarcode(barcode, quantity);
            setScreen({ kind: "scan" });
          }}
          onCancel={() => setScreen({ kind: "scan" })}
        />
      );

    case "photos":
      return (
        <TakePhoto
          photos={lead.photos}
          processingPhotos={lead.processingPhotos}
          onAddPhotos={lead.addPhotos}
          onRemovePhoto={lead.removePhoto}
          onSubmit={handleSubmit}
          onBack={() => setScreen({ kind: "scan" })}
        />
      );

    // The scanner stays mounted while the result overlay is shown: restarting the camera
    // on every scan exhausted it on long inventories (only a full browser restart recovered)
    case "scan":
    case "scanResult":
      return (
        <>
          <MainContent
            store={lead.store}
            barcodes={lead.barcodes}
            onIncrement={(barcode) => lead.changeQuantity(barcode, 1)}
            onDecrement={(barcode) => lead.changeQuantity(barcode, -1)}
            onScan={handleScan}
            onOpenManual={() => setScreen({ kind: "manual" })}
            onProceed={() => setScreen({ kind: "photos" })}
            onBack={handleBackToStore}
          />
          {screen.kind === "scanResult" && (
            <ScanOverlay
              onClose={() => setScreen({ kind: "scan" })}
              error={!screen.ok}
              text={screen.ok ? undefined : "Error, this barcode is not recognized. Try again."}
            />
          )}
        </>
      );
  }
}
