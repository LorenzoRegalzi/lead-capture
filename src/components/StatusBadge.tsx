import type { HistoryStatus } from "@/src/lib/history";
import { t } from "@/src/lib/strings";

const STATUS_STYLE: Record<HistoryStatus, string> = {
  sent: "bg-success text-white",
  failed: "bg-danger-soft text-danger",
  pending: "bg-warning-soft text-ink",
};

export default function StatusBadge({ status }: { status: HistoryStatus }) {
  return (
    <span className={`shrink-0 text-xs font-semibold px-2 py-1 rounded ${STATUS_STYLE[status]}`}>{t.status[status]}</span>
  );
}
