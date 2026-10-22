import { useState } from 'react';
import {
  historyEntryFilename,
  historyEntryToCsv,
  loadHistory,
  saveHistoryEntry,
  type HistoryEntry,
  type HistoryStatus,
} from '@/app/lib/history';
import { saveLead } from '@/app/lib/lead';
import { shareFile } from '@/app/lib/shareFile';

const STATUS_LABEL: Record<HistoryStatus, { text: string; className: string }> = {
  sent: { text: 'Sent', className: 'bg-green-100 text-green-800' },
  failed: { text: 'Failed', className: 'bg-red-100 text-red-800' },
  pending: { text: 'Not confirmed', className: 'bg-yellow-100 text-yellow-800' },
};

function formatDate(iso: string) {
  return new Date(iso).toLocaleString(undefined, { dateStyle: 'short', timeStyle: 'short' });
}

export default function History({ onBack }: { onBack: () => void }) {
  const [history, setHistory] = useState<HistoryEntry[]>(() => loadHistory());
  const [resendingId, setResendingId] = useState<string | null>(null);

  async function handleShare(entry: HistoryEntry) {
    // BOM so Excel opens the UTF-8 file correctly
    const csv = '﻿' + historyEntryToCsv(entry);
    await shareFile(new File([csv], historyEntryFilename(entry), { type: 'text/csv' }));
  }

  async function handleResend(entry: HistoryEntry) {
    if (entry.status === 'sent' && !confirm('This lead was already sent. Send it again? It may create a duplicate.')) {
      return;
    }

    setResendingId(entry.id);
    try {
      await saveLead(entry.store, entry.barcodes, entry.photoUrls, {
        submissionId: entry.id,
        submittedAt: entry.createdAt,
      });
      setHistory(saveHistoryEntry({ ...entry, status: 'sent', error: undefined }));
    } catch (err) {
      console.error(err);
      setHistory(saveHistoryEntry({ ...entry, status: 'failed', error: 'Resend failed' }));
      alert('Resend failed. Check your connection and try again.');
    } finally {
      setResendingId(null);
    }
  }

  return (
    <main className="h-dvh w-screen flex flex-col bg-white">
      <header className="flex items-center justify-between p-4 border-b border-gray-200">
        <button className="text-blue-950 font-semibold" onClick={onBack}>
          ← Back
        </button>
        <h1 className="text-xl font-bold text-blue-950">History</h1>
        <span className="w-12" />
      </header>

      <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-3">
        {history.length === 0 && <p className="text-center text-gray-500 mt-8">No submissions yet.</p>}

        {history.map((entry) => {
          const status = STATUS_LABEL[entry.status];
          const total = entry.barcodes.reduce((acc, b) => acc + b.quantity, 0);
          const resending = resendingId === entry.id;

          return (
            <article key={entry.id} className="border border-gray-200 rounded-lg p-3 text-black">
              <div className="flex justify-between items-start gap-2">
                <div>
                  <p className="font-semibold">
                    {entry.store.name} #{entry.store.number}
                  </p>
                  <p className="text-sm text-gray-600">{formatDate(entry.createdAt)}</p>
                </div>
                <span className={`text-xs font-semibold px-2 py-1 rounded ${status.className}`}>{status.text}</span>
              </div>

              <p className="text-sm mt-2">
                {entry.barcodes.length} barcodes · {total} items · {entry.photoUrls.length} photos
              </p>
              {entry.error && entry.status !== 'sent' && <p className="text-sm text-red-700">{entry.error}</p>}

              <div className="flex gap-2 mt-3">
                <button
                  className="flex-1 border border-blue-950 text-blue-950 px-3 py-2 rounded"
                  onClick={() => handleShare(entry)}
                >
                  Share CSV
                </button>
                <button
                  className="flex-1 bg-blue-950 text-white px-3 py-2 rounded disabled:opacity-50"
                  onClick={() => handleResend(entry)}
                  disabled={resendingId !== null}
                >
                  {resending ? 'Sending...' : 'Resend'}
                </button>
              </div>
            </article>
          );
        })}
      </div>
    </main>
  );
}
