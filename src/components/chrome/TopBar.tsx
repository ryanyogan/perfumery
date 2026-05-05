import { Link } from "@tanstack/react-router";
import { OFFLINE_SCENARIOS } from "../../lib/offline";
import { useComposerStore } from "../../lib/store";

interface Props {
  isOffline: boolean;
}

export function TopBar({ isOffline }: Props) {
  const offlineScenarioId = useComposerStore((s) => s.offlineScenarioId);
  const setOfflineScenario = useComposerStore((s) => s.setOfflineScenario);
  const reset = useComposerStore((s) => s.reset);

  return (
    <header className="grid h-12 grid-cols-[1fr_auto_1fr] items-center border-b border-[var(--color-rule)] bg-[var(--color-ink)] px-6">
      <div className="flex items-baseline gap-3">
        <span className="font-display text-[18px] tracking-display italic">Belle Aire</span>
        <span className="font-mono text-[10px] tracking-caps text-[var(--color-paper-3)] uppercase">
          Atelier
        </span>
      </div>

      <nav className="flex items-center gap-6 font-mono text-[10px] tracking-caps text-[var(--color-paper-3)] uppercase">
        <Link
          to="/"
          className="transition-colors duration-300 ease-quiet hover:text-[var(--color-paper)] [&.active]:text-[var(--color-paper)]"
          activeOptions={{ exact: true }}
        >
          Compose
        </Link>
        <Link
          to="/library"
          className="transition-colors duration-300 ease-quiet hover:text-[var(--color-paper)] [&.active]:text-[var(--color-paper)]"
        >
          Library
        </Link>
      </nav>

      <div className="flex items-center justify-end gap-4">
        {isOffline && (
          <div className="flex items-center gap-2">
            <span className="font-mono text-[9px] tracking-caps text-[var(--color-paper-3)] uppercase">
              Demo
            </span>
            <select
              value={offlineScenarioId ?? ""}
              onChange={(e) => {
                const v = e.target.value;
                if (!v) {
                  setOfflineScenario(null);
                  reset();
                  return;
                }
                reset();
                setOfflineScenario(v as "storm" | "library" | "belle-aire-candle");
              }}
              className="border border-[var(--color-rule)] bg-transparent py-1 pr-3 pl-2 font-mono text-[10px] tracking-caps text-[var(--color-paper-2)] uppercase focus:outline-none"
              aria-label="Demo scenario"
            >
              <option value="">— select —</option>
              {OFFLINE_SCENARIOS.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.label}
                </option>
              ))}
            </select>
          </div>
        )}
        <button
          type="button"
          onClick={() => reset()}
          className="font-mono text-[10px] tracking-caps text-[var(--color-paper-3)] uppercase transition-colors duration-300 ease-quiet hover:text-[var(--color-paper)]"
        >
          New
        </button>
      </div>
    </header>
  );
}
