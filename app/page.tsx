"use client";

import { useRouter } from "next/navigation";
import StoreForm from "@/src/components/StoreForm";
import { useInventory } from "@/src/providers/InventoryDraftProvider";
import { ROUTES } from "@/src/lib/routes";

// Store step. The form is prefilled from the draft, so coming back here never loses the inventory.
export default function StorePage() {
  const inventory = useInventory();
  const router = useRouter();

  return (
    <StoreForm
      initialName={inventory.store?.name}
      initialNumber={inventory.store?.number}
      onOpenHistory={() => router.push(ROUTES.history)}
      onSubmit={(name, number) => {
        inventory.setStore({ name, number });
        router.push(ROUTES.scan);
      }}
    />
  );
}
