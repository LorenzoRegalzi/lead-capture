"use client";

import { useEffect, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { useInventory } from "@/src/providers/InventoryDraftProvider";
import { ROUTES } from "@/src/lib/routes";

// Every page in this group belongs to an inventory in progress: without a store, go back to the store form
export default function InventoryLayout({ children }: { children: ReactNode }) {
  const { store } = useInventory();
  const router = useRouter();

  useEffect(() => {
    if (!store) router.replace(ROUTES.store);
  }, [store, router]);

  if (!store) return null;
  return children;
}
