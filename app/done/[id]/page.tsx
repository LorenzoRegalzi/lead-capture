"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import SentScreen from "@/src/components/SentScreen";
import { useInventory } from "@/src/providers/InventoryDraftProvider";
import { loadHistoryEntry } from "@/src/lib/history";
import { shareHistoryEntryCsv } from "@/src/lib/shareCsv";
import { ROUTES } from "@/src/lib/routes";

export default function DonePage() {
  const { id } = useParams<{ id: string }>();
  const { reset } = useInventory();
  const router = useRouter();
  const [entry] = useState(() => loadHistoryEntry(decodeURIComponent(id)));

  // The inventory is saved: start a fresh draft for the next inventory
  useEffect(() => {
    reset();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- run once on arrival
  }, []);

  return (
    <SentScreen
      entry={entry}
      onShare={() => entry && shareHistoryEntryCsv(entry)}
      onNewInventory={() => router.replace(ROUTES.store)}
    />
  );
}
