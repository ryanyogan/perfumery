import { useState, useMemo } from "react";
import { COMPOUNDS, compoundsByTier } from "../../lib/compounds";
import { useComposerStore } from "../../lib/store";
import { Vial } from "./Vial";
import { HoverCard } from "./HoverCard";
import { Flacon } from "./Flacon";

export function Organ() {
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const composition = useComposerStore((s) => s.composition);
  const highlighted = useComposerStore((s) => s.highlightedCompoundIds);
  const toggleCompound = useComposerStore((s) => s.toggleCompound);

  const compositionMap = useMemo(() => {
    const map = new Map<string, number>();
    for (const e of composition) map.set(e.compoundId, e.percent);
    return map;
  }, [composition]);

  const tiers = useMemo(
    () => [0, 1, 2].map((t) => compoundsByTier(t as 0 | 1 | 2)) as Array<typeof COMPOUNDS>,
    [],
  );
  const tierLabels = ["Top tier · 16 vials", "Heart tier · 28 vials", "Base tier · 20 vials"];

  return (
    <div className="relative flex h-full flex-col">
      {/* The organ — three tiers */}
      <div className="flex-1 overflow-auto px-8 pt-10 pb-6">
        <div className="space-y-10">
          {tiers.map((tierCompounds, tIdx) => (
            <section key={tIdx} aria-label={tierLabels[tIdx]}>
              <header className="mb-3 flex items-baseline justify-between border-b border-[var(--color-rule)] pb-2 font-mono text-[10px] tracking-caps text-[var(--color-paper-3)] uppercase">
                <span>{tierLabels[tIdx]}</span>
                <span aria-hidden="true">— · — · — · —</span>
              </header>
              <div className="flex flex-wrap gap-x-1.5 gap-y-3">
                {tierCompounds.map((c) => (
                  <Vial
                    key={c.id}
                    compound={c}
                    active={compositionMap.has(c.id)}
                    highlighted={highlighted.has(c.id)}
                    percent={compositionMap.get(c.id)}
                    onHover={setHoveredId}
                    onToggle={toggleCompound}
                  />
                ))}
              </div>
            </section>
          ))}
        </div>
      </div>

      {/* The flacon + hover card row — fixed height to match chat input wrapper, prevents reflow on hover */}
      <div className="grid h-[180px] shrink-0 grid-cols-[280px_1fr] items-start gap-6 overflow-hidden border-t border-[var(--color-rule)] bg-[var(--color-ink-2)]/40 px-8 py-5">
        <Flacon />
        <div className="h-full overflow-hidden">
          <HoverCard compoundId={hoveredId} />
        </div>
      </div>
    </div>
  );
}
