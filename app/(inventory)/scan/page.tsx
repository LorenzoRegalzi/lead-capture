"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import ScanScreen from "@/src/components/ScanScreen";
import { FeedbackOverlay } from "@/src/components/ui/Feedback";
import { useInventory, useStore } from "@/src/providers/InventoryDraftProvider";
import { VALID_BARCODES } from "@/src/lib/validBarcodes";
import { ROUTES } from "@/src/lib/routes";
import { t } from "@/src/lib/strings";

export default function ScanPage() {
  const inventory = useInventory();
  const store = useStore();
  const router = useRouter();
  const [scanResult, setScanResult] = useState<{ ok: boolean } | null>(null);

  function handleScan(code: string) {
    const ok = VALID_BARCODES.length === 0 || VALID_BARCODES.includes(code);
    if (ok) inventory.addBarcode(code);
    setScanResult({ ok });
  }

  // The overlay replaces the scanner on purpose: the camera stays off until the user taps
  if (scanResult) {
    return scanResult.ok ? (
      <FeedbackOverlay variant="success" title={t.scan.scanned} onClose={() => setScanResult(null)} />
    ) : (
      <FeedbackOverlay
        variant="error"
        title={t.scan.notRecognized}
        message={t.scan.tryAgain}
        onClose={() => setScanResult(null)}
      />
    );
  }

  return (
    <ScanScreen
      store={store}
      barcodes={inventory.barcodes}
      onScan={handleScan}
      onIncrement={(barcode) => inventory.changeQuantity(barcode, 1)}
      onDecrement={(barcode) => inventory.changeQuantity(barcode, -1)}
      onOpenManual={() => router.push(ROUTES.manual)}
      onNext={() => router.push(ROUTES.photos)}
      onBack={() => router.push(ROUTES.store)}
    />
  );
}
