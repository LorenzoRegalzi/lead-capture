import { useEffect, useRef, type ReactNode } from "react";
import Button from "@/src/components/ui/Button";
import { t } from "@/src/lib/strings";

// Full-screen result that waits for a tap (scan result, inventory sent)
export function FeedbackOverlay({
  variant,
  title,
  message,
  onClose,
}: {
  variant: "success" | "error";
  title: string;
  message?: string;
  onClose: () => void;
}) {
  return (
    <div
      role="alert"
      onClick={onClose}
      className={`fixed inset-0 z-50 flex flex-col items-center justify-center gap-3 px-6 text-center text-white cursor-pointer ${
        variant === "success" ? "bg-success" : "bg-danger"
      }`}
    >
      <span className="text-6xl leading-none" aria-hidden>
        {variant === "success" ? "✓" : "✕"}
      </span>
      <p className="text-3xl font-bold">{title}</p>
      {message && <p className="text-xl">{message}</p>}
      <p className="mt-6 text-base opacity-90">{t.common.tapToContinue}</p>
    </div>
  );
}

export function Spinner({ label }: { label: string }) {
  return (
    <div role="status" className="fixed inset-0 z-50 flex flex-col items-center justify-center gap-4 bg-black/80">
      <span className="h-14 w-14 rounded-full border-[6px] border-white/30 border-t-white animate-spin" aria-hidden />
      <p className="text-xl font-semibold text-white">{label}</p>
    </div>
  );
}

export function ConfirmDialog({
  title,
  body,
  confirmLabel,
  cancelLabel,
  onConfirm,
  onCancel,
}: {
  title: string;
  body: ReactNode;
  confirmLabel: string;
  cancelLabel: string;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 p-4" onClick={onCancel}>
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className="w-full max-w-sm rounded-xl bg-white p-4 flex flex-col gap-3"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-lg font-bold text-ink">{title}</h2>
        <p className="text-muted">{body}</p>
        <div className="flex gap-2 mt-2">
          <Button variant="secondary" fullWidth onClick={onCancel}>
            {cancelLabel}
          </Button>
          <Button fullWidth onClick={onConfirm}>
            {confirmLabel}
          </Button>
        </div>
      </div>
    </div>
  );
}

// Short message at the bottom of the screen that disappears on its own
export function Toast({ message, variant, onDone }: { message: string; variant: "success" | "error"; onDone: () => void }) {
  // keep the latest callback without restarting the timer on every render
  const onDoneRef = useRef(onDone);
  useEffect(() => {
    onDoneRef.current = onDone;
  }, [onDone]);

  useEffect(() => {
    const id = setTimeout(() => onDoneRef.current(), 3500);
    return () => clearTimeout(id);
  }, [message]);

  return (
    <div
      role="status"
      className={`fixed left-4 right-4 bottom-[max(1rem,env(safe-area-inset-bottom))] z-50 rounded-lg px-4 py-3 text-white font-semibold text-center shadow-lg ${
        variant === "success" ? "bg-success" : "bg-danger"
      }`}
    >
      {message}
    </div>
  );
}
