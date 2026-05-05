import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { TopBar } from "../components/chrome/TopBar";
import { getBrief } from "../server/briefs";
import { getRuntimeInfo } from "../server/runtime";
import { compoundById } from "../lib/compounds";
import { ROLE_LABEL } from "../lib/families";

export const Route = createFileRoute("/brief/$ref")({
  component: BriefDetail,
  loader: async ({ context, params }) => {
    await context.queryClient.ensureQueryData({
      queryKey: ["runtime-info"],
      queryFn: () => getRuntimeInfo(),
    });
    const brief = await context.queryClient.ensureQueryData({
      queryKey: ["brief", params.ref],
      queryFn: () => getBrief({ data: { ref: params.ref } }),
    });
    if ("notFound" in brief) throw notFound();
  },
  errorComponent: BriefError,
  notFoundComponent: BriefNotFound,
});

function BriefDetail() {
  const { ref } = Route.useParams();
  const { data: runtime } = useSuspenseQuery({
    queryKey: ["runtime-info"],
    queryFn: () => getRuntimeInfo(),
  });
  const { data: result } = useSuspenseQuery({
    queryKey: ["brief", ref],
    queryFn: () => getBrief({ data: { ref } }),
  });

  if ("notFound" in result) {
    return <BriefNotFound />;
  }

  const brief = result.brief;
  const created = new Date(result.createdAt);

  return (
    <div className="grid min-h-dvh grid-rows-[48px_1fr]">
      <TopBar isOffline={runtime.demoMode === "offline"} />
      <main className="overflow-y-auto px-8 py-12">
        <div className="mx-auto max-w-[640px]">
          <header className="flex items-baseline justify-between border-b border-[var(--color-rule)] pb-2 font-mono text-[10px] tracking-caps text-[var(--color-paper-3)] uppercase">
            <span>BAC · Concept Brief</span>
            <span>
              Reference {ref} ·{" "}
              {created.toLocaleDateString("en-GB", {
                day: "numeric",
                month: "long",
                year: "numeric",
              })}
              {result.status === "transmitted" && (
                <span className="ml-3 text-[var(--color-amber-glow)]">· Transmitted</span>
              )}
            </span>
          </header>

          <h1 className="mt-12 font-display text-[64px] leading-none tracking-display italic [text-wrap:balance]">
            {brief.name}
          </h1>
          <p className="mt-4 font-display text-[20px] leading-snug italic text-[var(--color-paper-2)]">
            {brief.tagline}
          </p>
          <hr className="mt-8 w-12 border-[var(--color-rule)]" />

          <Section label="Story">
            <p className="font-sans text-[14.5px] leading-[1.8] text-[var(--color-paper)] [text-wrap:pretty]">
              {brief.story}
            </p>
          </Section>

          <Section label="Target">
            <p className="text-[14px] leading-relaxed text-[var(--color-paper-2)]">
              {brief.targetConsumer}
            </p>
          </Section>

          <Section label="Occasion">
            <p className="text-[14px] leading-relaxed text-[var(--color-paper-2)]">
              {brief.occasion}
            </p>
          </Section>

          <Section label="Application">
            <p className="font-mono text-[12px] tracking-caps text-[var(--color-paper-2)] uppercase">
              {brief.application.replace("-", " ")} · {brief.recommendedConcentration}
            </p>
          </Section>

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
                {(["top", "heart", "base"] as const).flatMap((role) =>
                  brief.pyramid[role].map((e) => {
                    const c = compoundById(e.compoundId);
                    return (
                      <tr
                        key={`${role}-${e.compoundId}`}
                        className="border-b border-[var(--color-rule)]/60"
                      >
                        <td className="py-2 text-[10px] tracking-caps text-[var(--color-paper-3)] uppercase">
                          {ROLE_LABEL[role]}
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

          <Section label="Marketing copy · short">
            <p className="text-[13.5px] leading-relaxed text-[var(--color-paper-2)]">
              {brief.marketingCopy.shortDescription}
            </p>
          </Section>

          <Section label="Marketing copy · long">
            <p className="text-[13.5px] leading-[1.75] text-[var(--color-paper-2)]">
              {brief.marketingCopy.longDescription}
            </p>
          </Section>

          <Section label="Bottle hints">
            <p className="text-[13.5px] leading-relaxed text-[var(--color-paper-2)]">
              {brief.marketingCopy.bottleHints}
            </p>
          </Section>

          <Section label="Concept safety profile">
            <dl className="grid grid-cols-[140px_1fr] gap-x-4 gap-y-3 font-mono text-[11px] text-[var(--color-paper-2)]">
              <dt className="text-[var(--color-paper-3)] uppercase tracking-caps text-[10px]">
                Physical
              </dt>
              <dd className="space-y-1">
                {brief.safetyProfile.physicalHazards.map((h, i) => (
                  <p key={i}>· {h}</p>
                ))}
              </dd>
              <dt className="text-[var(--color-paper-3)] uppercase tracking-caps text-[10px]">
                Health
              </dt>
              <dd className="space-y-1">
                {brief.safetyProfile.healthHazards.map((h, i) => (
                  <p key={i}>· {h}</p>
                ))}
              </dd>
              <dt className="text-[var(--color-paper-3)] uppercase tracking-caps text-[10px]">
                Flashpoint
              </dt>
              <dd>{brief.safetyProfile.flashpoint}</dd>
              <dt className="text-[var(--color-paper-3)] uppercase tracking-caps text-[10px]">
                Storage
              </dt>
              <dd>{brief.safetyProfile.storage}</dd>
              <dt className="text-[var(--color-paper-3)] uppercase tracking-caps text-[10px]">
                IFRA
              </dt>
              <dd>{brief.safetyProfile.ifraSummary}</dd>
            </dl>
          </Section>

          <Section label="Perfumer's notes">
            <p className="font-display text-[15px] leading-relaxed text-[var(--color-paper-2)] italic">
              {brief.perfumerNotes}
              <span className="ml-2 font-mono text-[10px] not-italic tracking-caps text-[var(--color-paper-3)] uppercase">
                — m.b.
              </span>
            </p>
          </Section>

          <p className="mt-12 max-w-[44ch] border-t border-[var(--color-rule)] pt-4 font-mono text-[9px] leading-relaxed tracking-caps text-[var(--color-paper-3)] uppercase">
            Concept document. Not a regulated Safety Data Sheet. Compounds shown are representative;
            final formulation determined by Belle Aire R&amp;D.
          </p>

          <div className="mt-8 flex items-center gap-4 border-t border-[var(--color-rule)] pt-6">
            <Link
              to="/library"
              className="font-mono text-[10px] tracking-caps text-[var(--color-paper-3)] uppercase transition-colors duration-300 ease-quiet hover:text-[var(--color-paper)]"
            >
              ← All briefs
            </Link>
            <a
              href={`data:application/json,${encodeURIComponent(JSON.stringify(brief, null, 2))}`}
              download={`${ref}.json`}
              className="font-mono text-[10px] tracking-caps text-[var(--color-paper-3)] uppercase transition-colors duration-300 ease-quiet hover:text-[var(--color-paper)]"
            >
              Download JSON
            </a>
          </div>
        </div>
      </main>
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

function BriefError({ error }: { error: Error }) {
  return (
    <div className="flex min-h-dvh items-center justify-center px-8">
      <div className="max-w-md">
        <p className="font-mono text-[10px] tracking-caps text-[var(--color-amber-2)] uppercase">
          Brief error
        </p>
        <h1 className="mt-2 font-display text-[28px] tracking-display italic">
          That document is not where it should be.
        </h1>
        <p className="mt-3 font-mono text-[12px] text-[var(--color-paper-2)]">{error.message}</p>
        <Link
          to="/library"
          className="mt-6 inline-block font-mono text-[10px] tracking-caps text-[var(--color-amber-2)] uppercase transition-colors duration-300 ease-quiet hover:text-[var(--color-amber-glow)]"
        >
          ← Library
        </Link>
      </div>
    </div>
  );
}

function BriefNotFound() {
  return (
    <div className="flex min-h-dvh items-center justify-center px-8">
      <div className="max-w-md text-center">
        <p className="font-mono text-[10px] tracking-caps text-[var(--color-paper-3)] uppercase">
          BAC · 404
        </p>
        <h1 className="mt-2 font-display text-[36px] tracking-display italic">
          No brief by that reference.
        </h1>
        <Link
          to="/library"
          className="mt-6 inline-block font-mono text-[10px] tracking-caps text-[var(--color-amber-2)] uppercase transition-colors duration-300 ease-quiet hover:text-[var(--color-amber-glow)]"
        >
          ← Library
        </Link>
      </div>
    </div>
  );
}
