import BarcodeList from "@/src/components/BarcodeList";
import StatusBadge from "@/src/components/StatusBadge";
import Screen, { ScreenHeader } from "@/src/components/ui/Screen";
import { formatDisplayDate, type HistoryEntry } from "@/src/lib/history";
import { t } from "@/src/lib/strings";

type HistoryDetailProps = {
  entry: HistoryEntry | null;
  onBack: () => void;
};

export default function HistoryDetail({ entry, onBack }: HistoryDetailProps) {
  const header = <ScreenHeader title={t.detail.title} onBack={onBack} />;

  if (!entry) {
    return (
      <Screen header={header}>
        <p className="text-center text-muted mt-8">{t.detail.notFound}</p>
      </Screen>
    );
  }

  const total = entry.barcodes.reduce((acc, b) => acc + b.quantity, 0);

  return (
    <Screen header={header}>
      <div className="flex flex-col gap-5 p-4">
        <section className="flex justify-between items-start gap-2">
          <div className="min-w-0">
            <p className="text-lg font-semibold">
              {entry.store.name} #{entry.store.number}
            </p>
            <p className="text-sm text-muted">{formatDisplayDate(entry.createdAt)}</p>
            <p className="text-xs text-muted mt-1 break-all">{t.detail.id(entry.id)}</p>
          </div>
          <StatusBadge status={entry.status} />
        </section>

        {entry.error && entry.status !== "sent" && (
          <p className="rounded-lg bg-danger-soft p-3 text-sm text-danger">{entry.error}</p>
        )}

        <section className="flex flex-col gap-2">
          <h2 className="font-semibold text-primary flex justify-between">
            <span>{t.detail.barcodes(entry.barcodes.length)}</span>
            <span className="font-normal text-ink">{t.scan.total(total)}</span>
          </h2>
          <BarcodeList barcodes={entry.barcodes} />
        </section>

        <section className="flex flex-col gap-2">
          <h2 className="font-semibold text-primary">{t.detail.photos(entry.photoUrls.length)}</h2>
          {entry.photoUrls.length === 0 ? (
            <p className="text-sm text-muted">{t.detail.noPhotos}</p>
          ) : (
            <div className="grid grid-cols-2 gap-3">
              {entry.photoUrls.map((url, i) => (
                <a key={url} href={url} target="_blank" rel="noreferrer">
                  {/* eslint-disable-next-line @next/next/no-img-element -- signed Firebase URLs, not optimizable by next/image */}
                  <img
                    src={url}
                    alt={t.photos.photoAlt(i + 1)}
                    className="w-full aspect-square object-cover rounded-lg border border-line"
                  />
                </a>
              ))}
            </div>
          )}
        </section>
      </div>
    </Screen>
  );
}
