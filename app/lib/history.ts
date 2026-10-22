import type { BarcodeEntry, Store } from '@/app/lib/lead';

const HISTORY_KEY = 'lead-capture:history:v1';

// "pending" means the send started but never finished (e.g. the tab was killed)
export type HistoryStatus = 'pending' | 'sent' | 'failed';

export type HistoryEntry = {
  id: string;
  createdAt: string;
  store: Store;
  barcodes: BarcodeEntry[];
  photoUrls: string[];
  status: HistoryStatus;
  error?: string;
};

export function loadHistory(): HistoryEntry[] {
  try {
    const raw = localStorage.getItem(HISTORY_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

// Inserts a new entry at the top, or updates the one with the same id (keeping its original date)
export function saveHistoryEntry(entry: HistoryEntry): HistoryEntry[] {
  const history = loadHistory();
  const idx = history.findIndex((e) => e.id === entry.id);
  if (idx === -1) {
    history.unshift(entry);
  } else {
    history[idx] = { ...entry, createdAt: history[idx].createdAt };
  }

  try {
    localStorage.setItem(HISTORY_KEY, JSON.stringify(history));
  } catch (err) {
    console.error('Failed to save history:', err);
  }
  return history;
}

const pad = (n: number) => String(n).padStart(2, '0');

// Local time of the device, e.g. "2026-10-21 06:30"
export function formatLocalDate(iso: string) {
  const d = new Date(iso);
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function csvCell(value: string | number) {
  const s = String(value);
  return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

const CSV_HEADER = [
  'submission_id', 'date', 'store_name', 'store_number', 'barcode', 'quantity',
  'photo_1', 'photo_2', 'photo_3', 'photo_4', 'status',
];

export function historyEntryToCsv(entry: HistoryEntry): string {
  const rows = entry.barcodes.map((b, i) => [
    entry.id,
    formatLocalDate(entry.createdAt),
    entry.store.name,
    entry.store.number,
    b.barcode,
    b.quantity,
    ...[0, 1, 2, 3].map((p) => (i === 0 ? entry.photoUrls[p] ?? '' : '')),
    entry.status,
  ]);
  return [CSV_HEADER, ...rows].map((row) => row.map(csvCell).join(',')).join('\r\n');
}

export function historyEntryFilename(entry: HistoryEntry): string {
  const date = formatLocalDate(entry.createdAt).replace(/[: ]/g, '-');
  const store = entry.store.name.replace(/[^a-z0-9]+/gi, '_');
  return `lead_${store}_${entry.store.number}_${date}.csv`;
}
