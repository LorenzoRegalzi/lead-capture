import type { BarcodeEntry } from "@/src/lib/inventory";
import { t } from "@/src/lib/strings";

type BarcodeListProps = {
  barcodes: BarcodeEntry[];
  // without these the list is read-only (e.g. history detail)
  onIncrement?: (barcode: string) => void;
  onDecrement?: (barcode: string) => void;
  // highlight the last added barcode (shown first)
  highlightLatest?: boolean;
};

const roundButton = "h-11 w-11 rounded-full flex items-center justify-center text-2xl font-bold";

export default function BarcodeList({ barcodes, onIncrement, onDecrement, highlightLatest = false }: BarcodeListProps) {
  const editable = onIncrement && onDecrement;

  return (
    <ul className="flex flex-col gap-2">
      {[...barcodes].reverse().map((item, i) => (
        <li
          key={item.barcode}
          className={`flex items-center justify-between gap-2 rounded-lg border bg-white px-3 min-h-14 ${
            highlightLatest && i === 0 ? "border-2 border-primary" : "border-line"
          }`}
        >
          <span className="font-mono text-ink break-all">{item.barcode}</span>
          {editable ? (
            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                className={`${roundButton} bg-primary-soft text-primary`}
                onClick={() => onDecrement(item.barcode)}
                aria-label={t.scan.decrement}
              >
                −
              </button>
              <span className="min-w-10 text-center text-lg font-semibold">x{item.quantity}</span>
              <button
                type="button"
                className={`${roundButton} bg-primary text-white`}
                onClick={() => onIncrement(item.barcode)}
                aria-label={t.scan.increment}
              >
                +
              </button>
            </div>
          ) : (
            <span className="shrink-0 text-lg font-semibold">x{item.quantity}</span>
          )}
        </li>
      ))}
    </ul>
  );
}
