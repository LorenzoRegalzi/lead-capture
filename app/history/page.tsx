"use client";

import { useRouter } from "next/navigation";
import History from "@/src/components/History";
import { ROUTES, historyEntryRoute } from "@/src/lib/routes";

export default function HistoryPage() {
  const router = useRouter();
  return (
    <History
      onBack={() => router.push(ROUTES.store)}
      onView={(id) => router.push(historyEntryRoute(id))}
    />
  );
}
