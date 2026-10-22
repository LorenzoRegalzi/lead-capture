"use client";

import { createContext, useContext, type ReactNode } from "react";
import { useInventoryDraft } from "@/src/hooks/useInventoryDraft";
import type { Store } from "@/src/lib/inventory";

type InventoryDraft = ReturnType<typeof useInventoryDraft>;

const InventoryDraftContext = createContext<InventoryDraft | null>(null);

// Lives in the root layout, so the draft (including in-memory photos) survives navigation between pages
export function InventoryDraftProvider({ children }: { children: ReactNode }) {
  const inventory = useInventoryDraft();

  // wait for the saved draft before rendering any page, so guards don't redirect too early
  if (!inventory.hydrated) return null;

  return <InventoryDraftContext.Provider value={inventory}>{children}</InventoryDraftContext.Provider>;
}

export function useInventory(): InventoryDraft {
  const inventory = useContext(InventoryDraftContext);
  if (!inventory) throw new Error("useInventory must be used inside InventoryDraftProvider");
  return inventory;
}

// For pages under app/(inventory): their layout only renders them once a store is set
export function useStore(): Store {
  const { store } = useInventory();
  if (!store) throw new Error("useStore must be used inside the (inventory) layout");
  return store;
}
