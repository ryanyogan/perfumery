import { compoundById } from "../../lib/compounds";
import { FAMILIES, ROLE_LABEL } from "../../lib/families";

interface Props {
  compoundId: string | null;
}

export function HoverCard({ compoundId }: Props) {
  const c = compoundId ? compoundById(compoundId) : null;
  if (!c) {
    return (
      <div className="flex h-full flex-col justify-center font-mono text-[11px] tracking-caps text-[var(--color-paper-3)] uppercase">
        <span>Hover or click a vial.</span>
        <span className="mt-1 normal-case tracking-normal text-[var(--color-paper-3)]">
          <span className="font-display text-[14px] italic">
            64 materials. 16 top, 28 heart, 20 base.
          </span>
        </span>
      </div>
    );
  }
  const family = FAMILIES[c.family];
  return (
    <div className="grid h-full grid-cols-[1fr_auto] items-start gap-x-6 gap-y-1">
      <div className="min-w-0">
        <div className="font-display text-[22px] leading-tight tracking-display italic [text-wrap:balance]">
          {c.name}
        </div>
        <div className="mt-1 font-mono text-[10px] tracking-caps uppercase">
          <span className="font-medium" style={{ color: family.hex }}>
            {family.label}
          </span>
          <span aria-hidden="true" className="mx-1.5 text-[var(--color-paper-3)]">
            ·
          </span>
          <span className="text-[var(--color-paper-2)]">{ROLE_LABEL[c.role]}</span>
          <span aria-hidden="true" className="mx-1.5 text-[var(--color-paper-3)]">
            ·
          </span>
          <span className="text-[var(--color-paper-3)]">CAS {c.cas}</span>
        </div>
      </div>
      <div className="text-right font-mono text-[10px] leading-snug tracking-caps text-[var(--color-paper-3)] uppercase">
        Vol <span className="text-[var(--color-paper-2)]">{c.volatility.toFixed(2)}</span>
        <br />
        Default <span className="text-[var(--color-paper-2)]">{c.defaultPercent}%</span>
      </div>
      <p className="col-span-2 mt-1 line-clamp-3 max-w-[60ch] text-[12.5px] leading-[1.55] text-[var(--color-paper-2)]">
        {c.description}
      </p>
      {c.ifraCategoryFlags.length > 0 && (
        <div className="col-span-2 mt-auto border-l-2 border-[var(--color-amber)] pl-2 font-mono text-[10px] leading-snug text-[var(--color-amber-2)]">
          IFRA · {c.ifraCategoryFlags.join(" · ")}
        </div>
      )}
    </div>
  );
}
