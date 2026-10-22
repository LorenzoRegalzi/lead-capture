"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import HistoryDetail from "@/src/components/HistoryDetail";
import { loadHistoryEntry } from "@/src/lib/history";
import { ROUTES } from "@/src/lib/routes";

export default function HistoryEntryPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [entry] = useState(() => loadHistoryEntry(decodeURIComponent(id)));

  return <HistoryDetail entry={entry} onBack={() => router.push(ROUTES.history)} />;
}
