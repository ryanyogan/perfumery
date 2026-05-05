import { useState } from "react";
import { useComposerStore } from "../../lib/store";
import { compoundById } from "../../lib/compounds";
import { ROLE_LABEL } from "../../lib/families";
import { saveBrief, transmitBrief } from "../../server/briefs";
import { critiqueBrief } from "../../server/brief";
import type { BriefDraft, Critique } from "../../lib/brief-schema";

export function BriefSheet() {
  const draft = useComposerStore((s) => s.briefDraft);
  const ref = useComposerStore((s) => s.briefRef);
  const status = useComposerStore((s) => s.briefStatus);
  const critique = useComposerStore((s) => s.critique);
  const critiqueStatus = useComposerStore((s) => s.critiqueStatus);
  const messages = useComposerStore((s) => s.messages);
  const [savedRef, setSavedRef] = useState<string | null>(null);
  const [savingState, setSavingState] = useState<"idle" | "saving" | "transmitted" | "error">(
    "idle",
  );

  if (!draft) return null;

  const isStreaming = status === "streaming";
  const isReady = status === "ready" && ref !== null;

  const requestCritique = async () => {
    if (!draft || !ref) return;
    const s = useComposerStore.getState();
    s.setCritiqueStatus("pending");
    try {
      const conversationSummary = messages.map((m) => `${m.role}: ${m.content}`).join("\n");
      const result = await critiqueBrief({
        data: {
          brief: draft as BriefDraft,
          conversationSummary,
        },
      });
      if ("critique" in result) {
        s.setCritique(result.critique as Critique);
        s.setCritiqueStatus("ready");
      } else {
        s.setError(result.error);
        s.setCritiqueStatus("idle");
      }
    } catch (err) {
      s.setError(err instanceof Error ? err.message : "Critique failed.");
      s.setCritiqueStatus("idle");
    }
  };

  const handleSave = async () => {
    if (!draft || !ref || !isReady) return;
    setSavingState("saving");
    try {
      await saveBrief({
        data: {
          reference: ref,
          brief: draft as BriefDraft,
          status: "draft",
        },
      });
      setSavedRef(ref);
      setSavingState("idle");
    } catch (err) {
      setSavingState("error");
      useComposerStore.getState().setError(err instanceof Error ? err.message : "Save failed.");
    }
  };

  const handleTransmit = async () => {
    if (!draft || !ref || !isReady) return;
    if (!savedRef) {
      await handleSave();
    }
    setSavingState("saving");
    try {
      await transmitBrief({ data: { ref } });
      setSavingState("transmitted");
      useComposerStore.getState().markTransmitted();
    } catch (err) {
      setSavingState("error");
      useComposerStore.getState().setError(err instanceof Error ? err.message : "Transmit failed.");
    }
  };

  return (
    <div className="absolute inset-0 z-20 overflow-y-auto bg-[var(--color-ink)]/96 backdrop-blur-sm">
      <div className="mx-auto max-w-[640px] px-8 py-12">
        <SheetHeader ref_={ref} />

        <Title name={draft.name} tagline={draft.tagline} isStreaming={isStreaming} />

        {draft.story && (
          <Section label="Story">
            <p className="font-sans text-[14.5px] leading-[1.8] text-[var(--color-paper)] [text-wrap:pretty]">
              {draft.story}
            </p>
          </Section>
        )}

        {draft.targetConsumer && (
          <Section label="Target">
            <p className="text-[14px] leading-relaxed text-[var(--color-paper-2)]">
              {draft.targetConsumer}
            </p>
          </Section>
        )}

        {draft.occasion && (
          <Section label="Occasion">
            <p className="text-[14px] leading-relaxed text-[var(--color-paper-2)]">
              {draft.occasion}
            </p>
          </Section>
        )}

        {(draft.application ?? draft.recommendedConcentration) && (
          <Section label="Application">
            <p className="font-mono text-[12px] tracking-caps text-[var(--color-paper-2)] uppercase">
              {draft.application?.replace("-", " ")} · {draft.recommendedConcentration ?? "—"}
            </p>
          </Section>
        )}

        {draft.pyramid && <PyramidSection pyramid={draft.pyramid} />}

        {draft.marketingCopy && <MarketingSection copy={draft.marketingCopy} />}

        {draft.safetyProfile && <SafetySection sp={draft.safetyProfile} />}

        {draft.perfumerNotes && (
          <Section label="Perfumer's notes">
            <p className="font-display text-[15px] leading-relaxed text-[var(--color-paper-2)] italic">
              {draft.perfumerNotes}
              <span className="ml-2 font-mono text-[10px] not-italic tracking-caps text-[var(--color-paper-3)] uppercase">
                — m.b.
              </span>
            </p>
          </Section>
        )}

        {/* Critique */}
        {isReady && (
          <Section label="Senior Review">
            {critiqueStatus === "idle" && (
              <button
                type="button"
                onClick={requestCritique}
                className="font-mono text-[10px] tracking-caps text-[var(--color-amber-2)] uppercase transition-colors duration-300 ease-quiet hover:text-[var(--color-amber-glow)]"
              >
                Request senior critique →
              </button>
            )}
            {critiqueStatus === "pending" && (
              <span className="font-mono text-[10px] tracking-caps text-[var(--color-paper-3)] uppercase">
                Reviewing
                <span className="dot-pulse ml-2">
                  <span />
                  <span />
                  <span />
                </span>
              </span>
            )}
            {critiqueStatus === "ready" && critique && <CritiqueBlock c={critique} />}
          </Section>
        )}

        {/* Disclaimer */}
        <p className="mt-12 max-w-[44ch] border-t border-[var(--color-rule)] pt-4 font-mono text-[9px] leading-relaxed tracking-caps text-[var(--color-paper-3)] uppercase">
          Concept document. Not a regulated Safety Data Sheet. Compounds shown are representative;
          final formulation determined by Belle Aire R&amp;D.
        </p>

        {/* Actions */}
        <div className="mt-8 flex flex-wrap items-center gap-4 border-t border-[var(--color-rule)] pt-6">
          <button
            type="button"
            onClick={() => useComposerStore.setState({ phase: "COMPOSING" })}
            className="font-mono text-[10px] tracking-caps text-[var(--color-paper-3)] uppercase transition-colors duration-300 ease-quiet hover:text-[var(--color-paper)]"
          >
            ← Back to composing
          </button>
          {isReady && draft && ref && (
            <a
              href={`data:application/json,${encodeURIComponent(JSON.stringify({ ...draft, reference: ref }, null, 2))}`}
              download={`${ref}.json`}
              className="font-mono text-[10px] tracking-caps text-[var(--color-paper-3)] uppercase transition-colors duration-300 ease-quiet hover:text-[var(--color-paper)]"
            >
              Download JSON
            </a>
          )}
          <div className="flex-1" />
          {isReady && (
            <>
              <button
                type="button"
                onClick={handleSave}
                disabled={savingState === "saving"}
                className="font-mono text-[10px] tracking-caps text-[var(--color-paper-2)] uppercase transition-colors duration-300 ease-quiet hover:text-[var(--color-paper)] disabled:opacity-50"
              >
                {savingState === "saving" && !savedRef
                  ? "Saving…"
                  : savedRef
                    ? "Saved ✓"
                    : "Save draft"}
              </button>
              <button
                type="button"
                onClick={handleTransmit}
                disabled={savingState === "saving" || savingState === "transmitted"}
                className="rounded-sm border border-[var(--color-amber)] bg-[var(--color-amber)] px-4 py-1.5 font-mono text-[10px] tracking-caps text-[var(--color-ink)] uppercase transition-all duration-300 ease-quiet hover:bg-[var(--color-amber-2)] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {savingState === "transmitted"
                  ? `Transmitted ${ref}`
                  : savingState === "saving"
                    ? "Transmitting…"
                    : "Send to Belle Aire"}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function SheetHeader({ ref_ }: { ref_: string | null }) {
  const today = new Date();
  const pretty = today.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
  return (
    <header className="flex items-baseline justify-between border-b border-[var(--color-rule)] pb-2 font-mono text-[10px] tracking-caps text-[var(--color-paper-3)] uppercase">
      <span>BAC · Concept Brief</span>
      <span>
        Reference {ref_ ?? "—"} · {pretty}
      </span>
    </header>
  );
}

function Title({
  name,
  tagline,
  isStreaming,
}: {
  name?: string;
  tagline?: string;
  isStreaming: boolean;
}) {
  return (
    <div className="mt-12">
      <h1 className="font-display text-[64px] leading-none tracking-display italic [text-wrap:balance]">
        {name ?? <span className="text-[var(--color-paper-3)]">Composing…</span>}
        {isStreaming && !name && (
          <span className="dot-pulse ml-3 align-middle">
            <span />
            <span />
            <span />
          </span>
        )}
      </h1>
      {tagline && (
        <p className="mt-4 font-display text-[20px] leading-snug italic text-[var(--color-paper-2)]">
          {tagline}
        </p>
      )}
      <hr className="mt-8 w-12 border-[var(--color-rule)]" />
    </div>
  );
}

function Section({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <section className="mt-10">
      <h2 className="mb-3 font-mono text-[10px] tracking-caps text-[var(--color-paper-3)] uppercase">
        {label}
      </h2>
      {children}
    </section>
  );
}

function PyramidSection({ pyramid }: { pyramid: NonNullable<BriefDraft["pyramid"]> | undefined }) {
  if (!pyramid) return null;
  const tiers: Array<{ key: "top" | "heart" | "base"; entries: typeof pyramid.top }> = [
    { key: "top", entries: pyramid.top ?? [] },
    { key: "heart", entries: pyramid.heart ?? [] },
    { key: "base", entries: pyramid.base ?? [] },
  ];
  return (
    <Section label="Olfactory pyramid · composition">
      <table className="w-full border-collapse font-mono text-[12px]">
        <thead>
          <tr className="border-b border-[var(--color-rule)] text-[10px] tracking-caps text-[var(--color-paper-3)] uppercase">
            <th className="py-2 text-left font-normal">Role</th>
            <th className="py-2 text-left font-normal">Material</th>
            <th className="py-2 text-left font-normal">CAS</th>
            <th className="py-2 text-right font-normal">%</th>
          </tr>
        </thead>
        <tbody>
          {tiers.flatMap(({ key, entries }) =>
            entries
              .filter((e): e is { compoundId: string; percent: number } => Boolean(e?.compoundId))
              .map((e) => {
                const c = compoundById(e.compoundId);
                return (
                  <tr
                    key={`${key}-${e.compoundId}`}
                    className="border-b border-[var(--color-rule)]/60"
                  >
                    <td className="py-2 text-[10px] tracking-caps text-[var(--color-paper-3)] uppercase">
                      {ROLE_LABEL[key]}
                    </td>
                    <td className="py-2 font-sans text-[13px] text-[var(--color-paper)]">
                      {c?.name ?? e.compoundId}
                    </td>
                    <td className="py-2 text-[var(--color-paper-2)]">{c?.cas ?? "—"}</td>
                    <td className="py-2 text-right tabular-nums text-[var(--color-amber-2)]">
                      {e.percent.toFixed(1)}
                    </td>
                  </tr>
                );
              }),
          )}
        </tbody>
      </table>
    </Section>
  );
}

function MarketingSection({
  copy,
}: {
  copy: {
    shortDescription?: string;
    longDescription?: string;
    bottleHints?: string;
  };
}) {
  return (
    <Section label="Marketing copy">
      {copy.shortDescription && (
        <div>
          <h3 className="mb-1 font-mono text-[9px] tracking-caps text-[var(--color-paper-3)] uppercase">
            Short
          </h3>
          <p className="text-[13.5px] leading-relaxed text-[var(--color-paper-2)]">
            {copy.shortDescription}
          </p>
        </div>
      )}
      {copy.longDescription && (
        <div className="mt-4">
          <h3 className="mb-1 font-mono text-[9px] tracking-caps text-[var(--color-paper-3)] uppercase">
            Long
          </h3>
          <p className="text-[13.5px] leading-[1.75] text-[var(--color-paper-2)]">
            {copy.longDescription}
          </p>
        </div>
      )}
      {copy.bottleHints && (
        <div className="mt-4">
          <h3 className="mb-1 font-mono text-[9px] tracking-caps text-[var(--color-paper-3)] uppercase">
            Bottle hints
          </h3>
          <p className="text-[13.5px] leading-relaxed text-[var(--color-paper-2)]">
            {copy.bottleHints}
          </p>
        </div>
      )}
    </Section>
  );
}

function SafetySection({
  sp,
}: {
  sp: {
    physicalHazards?: string[];
    healthHazards?: string[];
    ifraSummary?: string;
    flashpoint?: string;
    storage?: string;
  };
}) {
  return (
    <Section label="Concept safety profile">
      <dl className="grid grid-cols-[140px_1fr] gap-x-4 gap-y-3 font-mono text-[11px] text-[var(--color-paper-2)]">
        {sp.physicalHazards && sp.physicalHazards.length > 0 && (
          <>
            <dt className="text-[var(--color-paper-3)] uppercase tracking-caps text-[10px]">
              Physical hazards
            </dt>
            <dd className="space-y-1">
              {sp.physicalHazards.map((h, i) => (
                <p key={i}>· {h}</p>
              ))}
            </dd>
          </>
        )}
        {sp.healthHazards && sp.healthHazards.length > 0 && (
          <>
            <dt className="text-[var(--color-paper-3)] uppercase tracking-caps text-[10px]">
              Health hazards
            </dt>
            <dd className="space-y-1">
              {sp.healthHazards.map((h, i) => (
                <p key={i}>· {h}</p>
              ))}
            </dd>
          </>
        )}
        {sp.flashpoint && (
          <>
            <dt className="text-[var(--color-paper-3)] uppercase tracking-caps text-[10px]">
              Flashpoint
            </dt>
            <dd>{sp.flashpoint}</dd>
          </>
        )}
        {sp.storage && (
          <>
            <dt className="text-[var(--color-paper-3)] uppercase tracking-caps text-[10px]">
              Storage
            </dt>
            <dd>{sp.storage}</dd>
          </>
        )}
        {sp.ifraSummary && (
          <>
            <dt className="text-[var(--color-paper-3)] uppercase tracking-caps text-[10px]">
              IFRA summary
            </dt>
            <dd>{sp.ifraSummary}</dd>
          </>
        )}
      </dl>
    </Section>
  );
}

function CritiqueBlock({ c }: { c: Critique }) {
  return (
    <div>
      <p className="mb-4 text-[13.5px] leading-relaxed text-[var(--color-paper-2)] italic">
        {c.overall}
      </p>
      <ul className="space-y-2">
        {c.issues.map((issue, i) => (
          <li
            key={i}
            className="border-l border-[var(--color-amber)] bg-[var(--color-ink-2)]/50 px-3 py-2"
          >
            <div className="font-mono text-[9px] tracking-caps uppercase">
              <span
                className={
                  issue.severity === "major"
                    ? "text-[var(--color-amber-glow)]"
                    : "text-[var(--color-paper-3)]"
                }
              >
                {issue.severity}
              </span>
              <span aria-hidden="true"> · </span>
              <span className="text-[var(--color-paper-2)]">{issue.section}</span>
            </div>
            <p className="mt-1 text-[13px] leading-relaxed text-[var(--color-paper-2)]">
              {issue.comment}
            </p>
          </li>
        ))}
      </ul>
    </div>
  );
}
