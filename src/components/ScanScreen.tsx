import BarcodeList from "@/src/components/BarcodeList";
import QrScanner from "@/src/components/QrScanner";
import Button from "@/src/components/ui/Button";
import Screen, { Hint, ScreenHeader } from "@/src/components/ui/Screen";
import type { BarcodeEntry, Store } from "@/src/lib/inventory";
import { t } from "@/src/lib/strings";

type ScanScreenProps = {
  store: Store;
  barcodes: BarcodeEntry[];
  onScan: (code: string) => void;
  onIncrement: (barcode: string) => void;
  onDecrement: (barcode: string) => void;
  onOpenManual: () => void;
  onNext: () => void;
  onBack: () => void;
};

export default function ScanScreen({
  store,
  barcodes,
  onScan,
  onIncrement,
  onDecrement,
  onOpenManual,
  onNext,
  onBack,
}: ScanScreenProps) {
  const total = barcodes.reduce((acc, b) => acc + b.quantity, 0);
  const hasBarcodes = barcodes.length > 0;

  return (
    <Screen
      scroll={false}
      header={
        <ScreenHeader
          title={t.scan.title}
          info={{ primary: store.name, secondary: `#${store.number}` }}
          onBack={onBack}
          step={{ current: 2, total: 3 }}
        />
      }
      footer={
        <>
          {!hasBarcodes && <Hint>{t.scan.needBarcode}</Hint>}
          <Button fullWidth onClick={onNext} disabled={!hasBarcodes}>
            {t.common.next}
          </Button>
        </>
      }
    >
      <div className="shrink-0 bg-black">
        <QrScanner onScan={onScan} />
      </div>

      <section className="flex-1 min-h-0 overflow-y-auto bg-surface p-4 flex flex-col gap-3">
        <div className="flex items-center justify-between gap-2">
          <p className="font-semibold text-ink">{t.scan.total(total)}</p>
          <Button variant="secondary" size="sm" onClick={onOpenManual}>
            {t.scan.addManually}
          </Button>
        </div>

        {hasBarcodes ? (
          <BarcodeList barcodes={barcodes} onIncrement={onIncrement} onDecrement={onDecrement} highlightLatest />
        ) : (
          <p className="text-center text-muted py-6">{t.scan.empty}</p>
        )}
      </section>
    </Screen>
  );
}
