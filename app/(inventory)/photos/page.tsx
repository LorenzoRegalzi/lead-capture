"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import PhotosScreen from "@/src/components/PhotosScreen";
import SendError from "@/src/components/SendError";
import { Spinner } from "@/src/components/ui/Feedback";
import { useInventory } from "@/src/providers/InventoryDraftProvider";
import { ROUTES, doneRoute } from "@/src/lib/routes";
import { loadHistoryEntry } from "@/src/lib/history";
import { shareHistoryEntryCsv } from "@/src/lib/shareCsv";
import { t } from "@/src/lib/strings";

type SubmitState = { kind: "idle" } | { kind: "uploading" } | { kind: "error"; message: string; id: string };

export default function PhotosPage() {
  const inventory = useInventory();
  const router = useRouter();
  const [submitState, setSubmitState] = useState<SubmitState>({ kind: "idle" });

  async function handleSubmit() {
    setSubmitState({ kind: "uploading" });
    const result = await inventory.submit();
    if (result.ok) {
      // replace: the browser back button must not return to an already sent inventory
      router.replace(doneRoute(result.id));
    } else {
      setSubmitState({ kind: "error", message: result.error, id: result.id });
    }
  }

  if (submitState.kind === "uploading") {
    return <Spinner label={t.photos.sending} />;
  }

  if (submitState.kind === "error") {
    // the failed attempt is already in the history, with any photo already uploaded
    const entry = loadHistoryEntry(submitState.id);
    return (
      <SendError
        message={submitState.message}
        onRetry={handleSubmit}
        onShare={entry ? () => shareHistoryEntryCsv(entry) : undefined}
        onBack={() => setSubmitState({ kind: "idle" })}
      />
    );
  }

  return (
    <PhotosScreen
      photos={inventory.photos}
      processingPhotos={inventory.processingPhotos}
      onAddPhotos={inventory.addPhotos}
      onRemovePhoto={inventory.removePhoto}
      onSubmit={handleSubmit}
      onBack={() => router.push(ROUTES.scan)}
    />
  );
}
