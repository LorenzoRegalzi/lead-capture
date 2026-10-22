import { useState } from "react";
import StatusBadge from "@/src/components/StatusBadge";
import Button from "@/src/components/ui/Button";
import { ConfirmDialog, Toast } from "@/src/components/ui/Feedback";
import Screen, { ScreenHeader } from "@/src/components/ui/Screen";
import { formatDisplayDate, loadHistory, saveHistoryEntry, type HistoryEntry } from "@/src/lib/history";
import { saveInventory } from "@/src/lib/inventory";
import { shareHistoryEntryCsv } from "@/src/lib/shareCsv";
import { t } from "@/src/lib/strings";

type HistoryProps = {
  onBack: () => void;
  onView: (id: string) => void;
};

type Notice = { message: string; variant: "success" | "error" };

export default function History({ onBack, onView }: HistoryProps) {
  const [history, setHistory] = useState<HistoryEntry[]>(() => loadHistory());
  const [resendingId, setResendingId] = useState<string | null>(null);
  const [confirming, setConfirming] = useState<HistoryEntry | null>(null);
  const [notice, setNotice] = useState<Notice | null>(null);

  async function resend(entry: HistoryEntry) {
    setResendingId(entry.id);
    try {
      await saveInventory(entry.store, entry.barcodes, entry.photoUrls, {
        submissionId: entry.id,
        submittedAt: entry.createdAt,
      });
      setHistory(saveHistoryEntry({ ...entry, status: "sent", error: undefined }));
      setNotice({ message: t.history.resendOk, variant: "success" });
    } catch (err) {
      console.error(err);
      setHistory(saveHistoryEntry({ ...entry, status: "failed", error: t.errors.historyResend }));
      setNotice({ message: t.history.resendFailed, variant: "error" });
    } finally {
      setResendingId(null);
    }
  }

  return (
    <Screen header={<ScreenHeader title={t.history.title} onBack={onBack} />}>
      <div className="flex flex-col gap-3 p-4">
        {history.length === 0 && <p className="text-center text-muted mt-8">{t.history.empty}</p>}

        {history.map((entry) => {
          const total = entry.barcodes.reduce((acc, b) => acc + b.quantity, 0);

          return (
            <article key={entry.id} className="rounded-lg border border-line p-3 flex flex-col gap-2">
              <div className="flex justify-between items-start gap-2">
                <div className="min-w-0">
                  <p className="font-semibold truncate">
                    {entry.store.name} #{entry.store.number}
                  </p>
                  <p className="text-sm text-muted">{formatDisplayDate(entry.createdAt)}</p>
                </div>
                <StatusBadge status={entry.status} />
              </div>

              <p className="text-sm">{t.history.summary(entry.barcodes.length, total, entry.photoUrls.length)}</p>
              {entry.error && entry.status !== "sent" && <p className="text-sm text-danger">{entry.error}</p>}

              <div className="grid grid-cols-3 gap-2 mt-1">
                <Button variant="secondary" size="sm" onClick={() => onView(entry.id)}>
                  {t.history.view}
                </Button>
                <Button variant="secondary" size="sm" onClick={() => shareHistoryEntryCsv(entry)}>
                  {t.common.shareCsv}
                </Button>
                <Button
                  size="sm"
                  onClick={() => (entry.status === "sent" ? setConfirming(entry) : resend(entry))}
                  disabled={resendingId !== null}
                >
                  {resendingId === entry.id ? t.history.resending : t.history.resend}
                </Button>
              </div>
            </article>
          );
        })}
      </div>

      {confirming && (
        <ConfirmDialog
          title={t.history.resendConfirmTitle}
          body={t.history.resendConfirmBody}
          confirmLabel={t.history.resendConfirm}
          cancelLabel={t.history.cancel}
          onCancel={() => setConfirming(null)}
          onConfirm={() => {
            const entry = confirming;
            setConfirming(null);
            resend(entry);
          }}
        />
      )}

      {notice && <Toast message={notice.message} variant={notice.variant} onDone={() => setNotice(null)} />}
    </Screen>
  );
}
