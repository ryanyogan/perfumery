import { useMemo } from "react";
import { useComposerStore } from "../../lib/store";
import { compoundById } from "../../lib/compounds";
import { FAMILIES } from "../../lib/families";

interface Props {
  isStreaming: boolean;
  onGenerateBrief: () => void;
}

export function StatusStrip({ isStreaming, onGenerateBrief }: Props) {
  const composition = useComposerStore((s) => s.composition);
  const phase = useComposerStore((s) => s.phase);

  const summary = useMemo(() => {
    const out: Record<"top" | "heart" | "base", string[]> = {
      top: [],
      heart: [],
      base: [],
    };
    const seen: Record<"top" | "heart" | "base", Set<string>> = {
      top: new Set(),
      heart: new Set(),
      base: new Set(),
    };
    for (const e of composition) {
      const c = compoundById(e.compoundId);
      if (!c) continue;
      if (seen[e.role].has(c.family)) continue;
      seen[e.role].add(c.family);
      out[e.role].push(FAMILIES[c.family].shortLabel);
    }
    return out;
  }, [composition]);

  const ifraFlags = useMemo(() => {
    const flagged = composition
      .map((e) => compoundById(e.compoundId))
      .filter(Boolean)
      .filter((c) => (c?.ifraCategoryFlags.length ?? 0) > 0);
    return flagged.length;
  }, [composition]);

  const canGenerate = composition.length >= 4 && phase !== "BRIEF_OPEN" && !isStreaming;

  return (
    <footer className="flex items-center justify-between gap-6 border-t border-[var(--color-rule)] bg-[var(--color-ink)] px-8 py-3">
      {/* Left: accord summary */}
      <div className="flex items-center gap-5">
        {(["top", "heart", "base"] as const).map((role) => (
          <div key={role} className="flex items-baseline gap-2">
            <span className="font-mono text-[10px] tracking-caps text-[var(--color-paper-3)] uppercase">
              {role}
            </span>
            <span className="font-mono text-[12px] tracking-caps text-[var(--color-paper)] uppercase">
              {summary[role].length > 0 ? summary[role].join(" / ") : "—"}
            </span>
          </div>
        ))}
      </div>

      {/* Center: IFRA */}
      <div className="flex items-center gap-2.5">
        <span
          className={`block h-2 w-2 rounded-full ${
            ifraFlags > 0 ? "bg-[var(--color-amber-2)]" : "bg-[var(--color-note-green)]"
          }`}
          aria-hidden="true"
        />
        <span className="font-mono text-[12px] tracking-caps text-[var(--color-paper)] uppercase">
          IFRA
        </span>
        <span
          className={`font-mono text-[12px] tracking-caps uppercase ${
            ifraFlags > 0 ? "text-[var(--color-amber-2)]" : "text-[var(--color-paper-2)]"
          }`}
        >
          {ifraFlags > 0 ? `${ifraFlags} flag${ifraFlags > 1 ? "s" : ""}` : "OK"}
        </span>
      </div>

      {/* Right: persona + CTA */}
      <div className="flex items-center gap-5">
        <div className="flex items-center gap-2.5">
          <span
            className={`block h-2 w-2 rounded-full bg-[var(--color-amber-2)] ${
              isStreaming ? "amber-ping" : ""
            }`}
            aria-hidden="true"
          />
          <span className="font-mono text-[11px] tracking-caps text-[var(--color-paper-2)] uppercase">
            M. Beaumont · {isStreaming ? "composing" : "online"}
          </span>
        </div>
        <button
          type="button"
          onClick={onGenerateBrief}
          disabled={!canGenerate}
          className={`rounded-sm border px-4 py-2 font-mono text-[11px] tracking-caps uppercase transition-all duration-300 ease-quiet ${
            canGenerate
              ? "amber-ping border-[var(--color-amber)] bg-[var(--color-amber)] text-[var(--color-ink)] hover:bg-[var(--color-amber-2)]"
              : "cursor-not-allowed border-[var(--color-rule)] bg-transparent text-[var(--color-paper-3)]"
          }`}
        >
          {composition.length === 0
            ? "Compose to brief"
            : composition.length < 4
              ? `${4 - composition.length} more · brief`
              : "Generate Brief →"}
        </button>
      </div>
    </footer>
  );
}
