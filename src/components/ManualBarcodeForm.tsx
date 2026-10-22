import { useId, useState } from "react";
import Button from "@/src/components/ui/Button";
import Screen, { ScreenHeader } from "@/src/components/ui/Screen";
import TextField from "@/src/components/ui/TextField";
import { t } from "@/src/lib/strings";

type ManualBarcodeFormProps = {
  onAdd: (barcode: string, quantity: number) => void;
  onBack: () => void;
};

export default function ManualBarcodeForm({ onAdd, onBack }: ManualBarcodeFormProps) {
  const formId = useId();
  const [barcode, setBarcode] = useState("");
  const [quantity, setQuantity] = useState(1);
  const valid = barcode.trim() !== "" && quantity >= 1;

  return (
    <Screen
      header={<ScreenHeader title={t.manual.title} onBack={onBack} step={{ current: 2, total: 3 }} />}
      footer={
        <Button type="submit" form={formId} fullWidth disabled={!valid}>
          {t.manual.add}
        </Button>
      }
    >
      <form
        id={formId}
        className="flex flex-col gap-4 p-4"
        onSubmit={(e) => {
          e.preventDefault();
          if (valid) onAdd(barcode, quantity);
        }}
      >
        <TextField
          label={t.manual.barcode}
          value={barcode}
          onChange={(e) => setBarcode(e.target.value)}
          autoComplete="off"
          autoFocus
        />
        <TextField
          label={t.manual.quantity}
          type="number"
          min={1}
          value={quantity}
          onChange={(e) => setQuantity(Number(e.target.value))}
          inputMode="numeric"
        />
      </form>
    </Screen>
  );
}
