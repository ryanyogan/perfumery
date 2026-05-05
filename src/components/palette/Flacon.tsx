import { useMemo } from "react";
import { useComposerStore } from "../../lib/store";
import { compoundById } from "../../lib/compounds";
import { FAMILIES } from "../../lib/families";

const blendColors = (entries: { hex: string; weight: number }[]): string => {
  if (entries.length === 0) return "#26221E";
  const total = entries.reduce((sum, e) => sum + e.weight, 0) || 1;
  let r = 0,
    g = 0,
    b = 0;
  for (const { hex, weight } of entries) {
    const [rr, gg, bb] = hexToRgb(hex);
    r += (rr * weight) / total;
    g += (gg * weight) / total;
    b += (bb * weight) / total;
  }
  return rgbToHex(r, g, b);
};

const hexToRgb = (hex: string): [number, number, number] => {
  const m = hex.replace("#", "");
  return [parseInt(m.slice(0, 2), 16), parseInt(m.slice(2, 4), 16), parseInt(m.slice(4, 6), 16)];
};
const rgbToHex = (r: number, g: number, b: number): string => {
  const toHex = (n: number) =>
    Math.round(Math.max(0, Math.min(255, n)))
      .toString(16)
      .padStart(2, "0");
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
};

export function Flacon() {
  const composition = useComposerStore((s) => s.composition);

  const { color, totals } = useMemo(() => {
    const entries = composition
      .map((c) => {
        const cmpd = compoundById(c.compoundId);
        return cmpd ? { hex: cmpd.hexColor, weight: c.percent } : null;
      })
      .filter((x): x is { hex: string; weight: number } => x !== null);
    const totals = composition.reduce(
      (acc, e) => {
        acc[e.role] += e.percent;
        return acc;
      },
      { top: 0, heart: 0, base: 0 } as Record<"top" | "heart" | "base", number>,
    );
    return { color: blendColors(entries), totals };
  }, [composition]);

  const grandTotal = totals.top + totals.heart + totals.base;

  return (
    <div className="flex items-end gap-4">
      <div
        className="relative h-[72px] w-[44px] overflow-hidden rounded-t-sm rounded-b-md border border-[var(--color-paper-3)]/40"
        style={{ background: "linear-gradient(180deg, #1c1916 0%, #0f0d0b 100%)" }}
      >
        <div
          className="absolute right-[3px] bottom-[3px] left-[3px] rounded-b-sm transition-all duration-700 ease-quiet"
          style={{
            backgroundColor: color,
            height: composition.length > 0 ? "78%" : "20%",
            opacity: composition.length > 0 ? 0.95 : 0.4,
            boxShadow: `inset 0 0 14px ${color}, 0 0 24px ${color}55`,
          }}
        />
        <div className="absolute top-0 right-0 left-0 h-[10px] border-b border-[var(--color-rule)] bg-gradient-to-b from-[#A8854A] to-[#5E4626]" />
        {/* Hairline label */}
        <div className="absolute right-2 left-2 top-1/2 h-px bg-white/10" />
      </div>

      <div className="flex-1">
        <div className="font-mono text-[9px] tracking-caps text-[var(--color-paper-3)] uppercase">
          Composition · {composition.length} materials · {grandTotal.toFixed(1)}%
        </div>
        <div className="mt-2 grid grid-cols-3 gap-2 font-mono text-[10px] tracking-caps">
          {(["top", "heart", "base"] as const).map((role) => {
            const filtered = composition.filter((c) => c.role === role);
            const families = Array.from(
              new Set(
                filtered
                  .map((c) => compoundById(c.compoundId)?.family)
                  .filter((x): x is keyof typeof FAMILIES => Boolean(x)),
              ),
            );
            return (
              <div key={role} className="border-l border-[var(--color-rule)] pl-2">
                <div className="text-[var(--color-paper-3)] uppercase">{role}</div>
                <div className="mt-0.5 text-[var(--color-paper-2)]">{totals[role].toFixed(1)}%</div>
                <div className="mt-1 flex gap-1">
                  {families.map((f) => (
                    <span
                      key={f}
                      className="block h-1 w-3"
                      style={{ backgroundColor: FAMILIES[f].hex }}
                      aria-label={FAMILIES[f].label}
                    />
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
