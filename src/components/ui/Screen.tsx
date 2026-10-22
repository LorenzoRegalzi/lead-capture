import type { ReactNode } from "react";
import { t } from "@/src/lib/strings";

type HeaderButton = { label: string; onClick: () => void };

type ScreenHeaderProps = {
  title: string;
  // left slot: Back, or another action (e.g. History on the first screen)
  onBack?: () => void;
  backDisabled?: boolean;
  leftAction?: HeaderButton;
  // right slot: short read-only context, e.g. the store being inventoried
  info?: { primary: string; secondary?: string };
  step?: { current: number; total: number };
};

// Side slots fill their whole column, top to bottom: the entire corner is tappable
const sideButton =
  "h-full w-full flex items-center px-3 font-semibold text-primary active:bg-primary-soft disabled:opacity-40";

// Same header on every screen, always the same height: Back/action on the left, title + step dots
// in the middle, optional context on the right
export function ScreenHeader({ title, onBack, backDisabled, leftAction, info, step }: ScreenHeaderProps) {
  return (
    <header className="shrink-0 border-b border-line bg-white pt-[env(safe-area-inset-top)]">
      <div className="grid grid-cols-[6rem_1fr_6rem] items-stretch h-16">
        <div>
          {onBack ? (
            <button type="button" onClick={onBack} disabled={backDisabled} className={`${sideButton} justify-start`}>
              ← {t.common.back}
            </button>
          ) : (
            leftAction && (
              <button type="button" onClick={leftAction.onClick} className={`${sideButton} justify-start`}>
                {/* bordered so it reads as a button; the tap area is still the whole corner */}
                <span className="rounded-lg border border-primary px-3 py-1.5">{leftAction.label}</span>
              </button>
            )
          )}
        </div>

        <div className="flex flex-col items-center justify-center min-w-0 text-center">
          <h1 className="text-lg font-bold text-primary truncate max-w-full">{title}</h1>
          {step && <StepDots current={step.current} total={step.total} />}
        </div>

        <div className="min-w-0">
          {info && (
            <div
              className="h-full flex flex-col items-end justify-center px-3 text-right"
              aria-label={[info.primary, info.secondary].filter(Boolean).join(" ")}
              title={[info.primary, info.secondary].filter(Boolean).join(" ")}
            >
              <p className="text-sm font-semibold text-ink truncate max-w-full">{info.primary}</p>
              {info.secondary && <p className="text-sm text-muted truncate max-w-full">{info.secondary}</p>}
            </div>
          )}
        </div>
      </div>
    </header>
  );
}

// Compact progress: one dot per step, filled up to the current one
function StepDots({ current, total }: { current: number; total: number }) {
  const label = t.common.step(current, total);
  return (
    <div className="mt-1.5 flex gap-1.5" role="img" aria-label={label} title={label}>
      {Array.from({ length: total }, (_, i) => (
        <span
          key={i}
          className={`h-2 rounded-full transition-all ${
            i + 1 === current ? "w-4 bg-primary" : i < current ? "w-2 bg-primary" : "w-2 bg-line"
          }`}
        />
      ))}
    </div>
  );
}

type ScreenProps = {
  header: ReactNode;
  children: ReactNode;
  // main action(s), always pinned at the bottom where the thumb is
  footer?: ReactNode;
  // false when the screen manages its own scrolling (e.g. scanner on top of a list)
  scroll?: boolean;
};

export default function Screen({ header, children, footer, scroll = true }: ScreenProps) {
  return (
    <div className="h-dvh w-full flex flex-col bg-white text-ink">
      {header}
      <main className={`flex-1 min-h-0 flex flex-col ${scroll ? "overflow-y-auto" : ""}`}>{children}</main>
      {footer && (
        <footer className="shrink-0 border-t border-line bg-white px-4 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] flex flex-col gap-2">
          {footer}
        </footer>
      )}
    </div>
  );
}

// Explains why the main action is disabled, right above it
export function Hint({ children }: { children: ReactNode }) {
  return <p className="text-sm text-muted text-center">{children}</p>;
}
