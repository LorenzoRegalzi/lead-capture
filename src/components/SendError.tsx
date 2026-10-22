import Button from "@/src/components/ui/Button";
import Screen, { ScreenHeader } from "@/src/components/ui/Screen";
import { t } from "@/src/lib/strings";

type SendErrorProps = {
  message: string;
  onRetry: () => void;
  // the inventory can still leave the phone as a CSV when sending keeps failing
  onShare?: () => void;
  onBack: () => void;
};

export default function SendError({ message, onRetry, onShare, onBack }: SendErrorProps) {
  return (
    <Screen
      header={<ScreenHeader title={t.photos.title} onBack={onBack} step={{ current: 3, total: 3 }} />}
      footer={
        <>
          <Button fullWidth onClick={onRetry}>
            {t.photos.retry}
          </Button>
          {onShare && (
            <Button variant="secondary" fullWidth onClick={onShare}>
              {t.common.shareCsv}
            </Button>
          )}
          <Button variant="ghost" fullWidth onClick={onBack}>
            {t.common.back}
          </Button>
        </>
      }
    >
      <div role="alert" className="m-4 rounded-lg bg-danger-soft p-4 text-center">
        <p className="font-bold text-danger">{t.photos.sendFailedTitle}</p>
        <p className="mt-1 text-ink">{message}</p>
      </div>
    </Screen>
  );
}
