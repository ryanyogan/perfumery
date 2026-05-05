import { createFileRoute, Link } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { TopBar } from "../components/chrome/TopBar";
import { listBriefs } from "../server/briefs";
import { getRuntimeInfo } from "../server/runtime";

export const Route = createFileRoute("/library")({
  component: LibraryPage,
  loader: async ({ context }) => {
    await Promise.all([
      context.queryClient.ensureQueryData({
        queryKey: ["briefs"],
        queryFn: () => listBriefs(),
      }),
      context.queryClient.ensureQueryData({
        queryKey: ["runtime-info"],
        queryFn: () => getRuntimeInfo(),
      }),
    ]);
  },
  errorComponent: LibraryError,
});

function LibraryPage() {
  const { data: runtime } = useSuspenseQuery({
    queryKey: ["runtime-info"],
    queryFn: () => getRuntimeInfo(),
  });
  const { data: briefs } = useSuspenseQuery({
    queryKey: ["briefs"],
    queryFn: () => listBriefs(),
  });

  return (
    <div className="grid min-h-dvh grid-rows-[48px_1fr]">
      <TopBar isOffline={runtime.demoMode === "offline"} />
      <main className="overflow-y-auto px-12 py-12">
        <header className="mb-12 max-w-[640px]">
          <p className="font-mono text-[10px] tracking-caps text-[var(--color-paper-3)] uppercase">
            BAC · Library
          </p>
          <h1 className="mt-3 font-display text-[48px] leading-tight tracking-display italic">
            Saved briefs
          </h1>
          <p className="mt-3 font-display text-[16px] text-[var(--color-paper-2)] italic">
            Every brief that has been transmitted from this Atelier session.
          </p>
        </header>

        {briefs.length === 0 ? (
          <p className="font-display text-[18px] text-[var(--color-paper-3)] italic">
            Nothing here yet. Compose a brief and send it.
          </p>
        ) : (
          <ul className="divide-y divide-[var(--color-rule)]">
            {briefs.map((b) => (
              <li key={b.ref}>
                <Link
                  to="/brief/$ref"
                  params={{ ref: b.ref }}
                  className="grid grid-cols-[1fr_auto_180px] items-baseline gap-6 py-5 transition-colors duration-300 ease-quiet hover:bg-[var(--color-ink-2)]"
                >
                  <div>
                    <h2 className="font-display text-[28px] leading-tight tracking-display italic">
                      {b.name}
                    </h2>
                    <p className="mt-1 font-display text-[14px] text-[var(--color-paper-2)] italic">
                      {b.tagline}
                    </p>
                  </div>
                  <span
                    className={`font-mono text-[10px] tracking-caps uppercase ${
                      b.status === "transmitted"
                        ? "text-[var(--color-amber-glow)]"
                        : "text-[var(--color-paper-3)]"
                    }`}
                  >
                    {b.status}
                  </span>
                  <div className="text-right font-mono text-[10px] tracking-caps text-[var(--color-paper-3)] uppercase">
                    <div>{b.ref}</div>
                    <div className="mt-1 text-[var(--color-paper-3)]">
                      {b.application.replace("-", " ")}
                    </div>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </main>
    </div>
  );
}

function LibraryError({ error }: { error: Error }) {
  return (
    <div className="flex min-h-dvh items-center justify-center px-8">
      <div className="max-w-md">
        <p className="font-mono text-[10px] tracking-caps text-[var(--color-amber-2)] uppercase">
          Library error
        </p>
        <h1 className="mt-2 font-display text-[28px] tracking-display italic">
          Something interrupted the shelf check.
        </h1>
        <p className="mt-3 font-mono text-[12px] text-[var(--color-paper-2)]">{error.message}</p>
      </div>
    </div>
  );
}
