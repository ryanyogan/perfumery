import type { Compound } from "../../lib/compounds";

interface Props {
  compound: Compound;
  active: boolean;
  highlighted: boolean;
  percent?: number;
  onHover: (compoundId: string | null) => void;
  onToggle: (compoundId: string) => void;
}

export function Vial({ compound, active, highlighted, percent, onHover, onToggle }: Props) {
  const liquidHeight = active && percent !== undefined ? Math.min(85, 30 + percent * 1.5) : 60;

  const ringClass = highlighted
    ? "ring-1 ring-[var(--color-amber-glow)]"
    : active
      ? "ring-1 ring-[var(--color-amber)]/60"
      : "ring-0";

  return (
    <button
      type="button"
      className={`group relative flex w-[58px] flex-col items-center gap-2 rounded-sm bg-transparent px-1 py-2 transition-all duration-300 ease-quiet hover:scale-[1.04] ${
        highlighted ? "scale-[1.06]" : ""
      }`}
      onClick={() => onToggle(compound.id)}
      onMouseEnter={() => onHover(compound.id)}
      onMouseLeave={() => onHover(null)}
      onFocus={() => onHover(compound.id)}
      onBlur={() => onHover(null)}
      aria-label={`${active ? "Remove " : "Add "}${compound.name} — ${compound.role} note · CAS ${compound.cas}`}
      aria-pressed={active}
    >
      <div
        className={`relative h-[58px] w-[26px] overflow-hidden rounded-t-[3px] rounded-b-[6px] border border-[var(--color-rule)] transition-shadow duration-500 ease-quiet ${ringClass}`}
        style={{ background: "linear-gradient(180deg, #1c1916 0%, #14110f 100%)" }}
      >
        {/* Liquid */}
        <div
          className="absolute right-[2px] bottom-[2px] left-[2px] rounded-b-[5px] transition-all duration-700 ease-quiet"
          style={{
            backgroundColor: compound.hexColor,
            height: `${liquidHeight}%`,
            opacity: active ? 0.95 : 0.55,
            boxShadow: highlighted
              ? `inset 0 0 12px ${compound.hexColor}, 0 0 16px ${compound.hexColor}66`
              : "inset 0 0 6px rgba(0,0,0,0.5)",
          }}
        />
        {/* Liquid meniscus */}
        <div
          className="absolute right-[2px] left-[2px] h-px bg-white/30 transition-all duration-700 ease-quiet"
          style={{ bottom: `${liquidHeight + 2}%` }}
        />
        {/* Cap */}
        <div className="absolute top-0 right-0 left-0 h-[10px] border-b border-[var(--color-rule)] bg-gradient-to-b from-[#8B6F3D] via-[#6E5630] to-[#4D3D24]" />
      </div>
      <span className="font-mono text-[8px] leading-none tracking-caps text-[var(--color-paper-3)] uppercase transition-colors duration-300 ease-quiet group-hover:text-[var(--color-paper-2)]">
        {compound.commonName.length > 9
          ? compound.commonName.slice(0, 8) + "·"
          : compound.commonName}
      </span>
    </button>
  );
}
