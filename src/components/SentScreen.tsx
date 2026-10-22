import Button from "@/src/components/ui/Button";
import Screen, { ScreenHeader } from "@/src/components/ui/Screen";
import type { HistoryEntry } from "@/src/lib/history";
import { t } from "@/src/lib/strings";

type SentScreenProps = {
  // null if the history entry can't be found: the screen still confirms, without Share
  entry: HistoryEntry | null;
  onShare: () => void;
  onNewInventory: () => void;
};

export default function SentScreen({ entry, onShare, onNewInventory }: SentScreenProps) {
  const total = entry?.barcodes.reduce((acc, b) => acc + b.quantity, 0) ?? 0;

  return (
    <Screen
      header={<ScreenHeader title={t.done.title} />}
      footer={
        <>
          {entry && (
            <Button variant="secondary" fullWidth onClick={onShare}>
              {t.common.shareCsv}
            </Button>
          )}
          <Button fullWidth onClick={onNewInventory}>
            {t.done.newInventory}
          </Button>
        </>
      }
    >
      <div role="status" className="flex flex-1 flex-col items-center justify-center gap-3 p-6 text-center">
        <span
          className="flex h-24 w-24 items-center justify-center rounded-full bg-success text-5xl text-white"
          aria-hidden
        >
          ✓
        </span>
        <p className="text-2xl font-bold text-ink">{t.done.title}</p>
        {entry && (
          <>
            <p className="text-lg font-semibold text-ink">
              {entry.store.name} #{entry.store.number}
            </p>
            <p className="text-muted">{t.history.summary(entry.barcodes.length, total, entry.photoUrls.length)}</p>
          </>
        )}
      </div>
    </Screen>
  );
}
