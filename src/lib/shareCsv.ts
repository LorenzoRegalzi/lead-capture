import { historyEntryFilename, historyEntryToCsv, type HistoryEntry } from "@/src/lib/history";
import { shareFile } from "@/src/lib/shareFile";

// Same CSV everywhere (history, sent screen, send error)
export function shareHistoryEntryCsv(entry: HistoryEntry) {
  // BOM so Excel opens the UTF-8 file correctly
  const csv = "\uFEFF" + historyEntryToCsv(entry);
  return shareFile(new File([csv], historyEntryFilename(entry), { type: "text/csv" }));
}
