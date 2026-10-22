"use client";

import { useRouter } from "next/navigation";
import ManualBarcodeForm from "@/src/components/ManualBarcodeForm";
import { useInventory } from "@/src/providers/InventoryDraftProvider";
import { ROUTES } from "@/src/lib/routes";

export default function ManualPage() {
  const inventory = useInventory();
  const router = useRouter();

  return (
    <ManualBarcodeForm
      onAdd={(barcode, quantity) => {
        inventory.addBarcode(barcode, quantity);
        router.push(ROUTES.scan);
      }}
      onBack={() => router.push(ROUTES.scan)}
    />
  );
}
