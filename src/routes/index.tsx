import { createFileRoute } from "@tanstack/react-router";
import { useEffect } from "react";
import { TopBar } from "../components/chrome/TopBar";
import { StatusStrip } from "../components/chrome/StatusStrip";
import { Organ } from "../components/palette/Organ";
import { ChatPanel } from "../components/chat/ChatPanel";
import { BriefSheet } from "../components/brief/BriefSheet";
import { useChatStream } from "../hooks/useChatStream";
import { useBriefStream } from "../hooks/useBriefStream";
import { useComposerStore } from "../lib/store";

export const Route = createFileRoute("/")({
  component: Composer,
});

function Composer() {
  const phase = useComposerStore((s) => s.phase);
  const briefStatus = useComposerStore((s) => s.briefStatus);
  const reset = useComposerStore((s) => s.reset);

  const { isStreaming } = useChatStream();
  const { start: startBrief, isStreaming: briefStreaming } = useBriefStream();

  // Reset on initial mount to avoid leaking state across HMR
  useEffect(() => {
    reset();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const showBrief =
    phase === "BRIEF_PENDING" || phase === "BRIEF_OPEN" || briefStatus === "streaming";

  return (
    <div className="grid h-dvh grid-rows-[48px_1fr_auto]">
      <TopBar />
      <main className="relative grid grid-cols-[62%_38%] overflow-hidden border-y border-[var(--color-rule)]">
        <section
          className="min-h-0 overflow-hidden border-r border-[var(--color-rule)] bg-[var(--color-ink)]"
          aria-label="Perfume organ"
        >
          <Organ />
        </section>
        <section
          className="min-h-0 overflow-hidden bg-[var(--color-ink)]"
          aria-label="Conversation with M. Beaumont"
        >
          <ChatPanel />
        </section>
        {showBrief && <BriefSheet />}
      </main>
      <StatusStrip isStreaming={isStreaming || briefStreaming} onGenerateBrief={startBrief} />
    </div>
  );
}
