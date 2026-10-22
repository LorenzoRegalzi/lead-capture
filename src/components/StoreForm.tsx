import { useId, useState } from "react";
import Image from "next/image";
import Button from "@/src/components/ui/Button";
import Screen, { ScreenHeader } from "@/src/components/ui/Screen";
import TextField from "@/src/components/ui/TextField";
import { t } from "@/src/lib/strings";

type StoreFormProps = {
  initialName?: string;
  initialNumber?: string;
  onSubmit: (storeName: string, storeNumber: string) => void;
  onOpenHistory: () => void;
};

export default function StoreForm({ initialName = "", initialNumber = "", onSubmit, onOpenHistory }: StoreFormProps) {
  const formId = useId();
  const [storeName, setStoreName] = useState(initialName);
  const [storeNumber, setStoreNumber] = useState(initialNumber);
  const valid = storeName.trim() !== "" && storeNumber.trim() !== "";

  return (
    <Screen
      header={
        <ScreenHeader
          title={t.store.title}
          step={{ current: 1, total: 3 }}
          leftAction={{ label: t.store.history, onClick: onOpenHistory }}
        />
      }
      footer={
        <Button type="submit" form={formId} fullWidth disabled={!valid}>
          {t.common.next}
        </Button>
      }
    >
      <form
        id={formId}
        className="flex flex-col gap-4 p-4"
        onSubmit={(e) => {
          e.preventDefault();
          if (valid) onSubmit(storeName.trim(), storeNumber.trim());
        }}
      >
        <Image src="/logo.png" alt={t.store.logoAlt} width={166} height={40} priority className="mx-auto my-10" />
        <p className="text-muted">{t.store.intro}</p>
        <TextField label={t.store.name} value={storeName} onChange={(e) => setStoreName(e.target.value)} autoComplete="off" />
        <TextField
          label={t.store.number}
          value={storeNumber}
          onChange={(e) => setStoreNumber(e.target.value)}
          autoComplete="off"
        />
      </form>
    </Screen>
  );
}
