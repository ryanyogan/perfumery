import { useEffect, useRef } from "react";
import { useComposerStore } from "../../lib/store";
import { ChatTurn } from "./ChatTurn";
import { ChatInput } from "./ChatInput";
import { useChatStream } from "../../hooks/useChatStream";
import { OFFLINE_SCENARIOS } from "../../lib/offline";

export function ChatPanel() {
  const messages = useComposerStore((s) => s.messages);
  const phase = useComposerStore((s) => s.phase);
  const errorMessage = useComposerStore((s) => s.errorMessage);
  const pendingId = useComposerStore((s) => s.pendingAssistantId);
  const offlineScenarioId = useComposerStore((s) => s.offlineScenarioId);
  const offlineTurnIndex = useComposerStore((s) => s.offlineTurnIndex);

  const { send, isStreaming } = useChatStream();
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
  }, [messages.length, pendingId, messages.at(-1)?.content.length]);

  const handleSubmit = async (value: string) => {
    if (offlineScenarioId) {
      const scenario = OFFLINE_SCENARIOS.find((s) => s.id === offlineScenarioId);
      const turn = scenario?.turns[offlineTurnIndex];
      if (turn) {
        await send(value, {
          offlineScenario: { id: offlineScenarioId, turnIndex: offlineTurnIndex },
        });
        useComposerStore.setState({ offlineTurnIndex: offlineTurnIndex + 1 });
        return;
      }
    }
    await send(value);
  };

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div
        ref={scrollRef}
        className="min-h-0 flex-1 overflow-y-auto px-8 pt-10"
        role="log"
        aria-live="polite"
        aria-label="Conversation with M. Beaumont"
      >
        {phase === "INITIAL" && (
          <div className="space-y-6">
            <p className="font-display text-[28px] leading-snug italic text-[var(--color-paper)]">
              Tell me what you want it to feel like.
            </p>
            <p className="max-w-[44ch] font-sans text-[14px] leading-relaxed text-[var(--color-paper-2)]">
              I'm M. Beaumont. Describe a feeling, a memory, or a target consumer in plain
              language — I'll compose a fragrance on the organ and walk you through the choices.
              Or click vials directly to compose by hand.
            </p>
          </div>
        )}

        {messages.map((m) => (
          <ChatTurn key={m.id} message={m} isStreaming={isStreaming && m.id === pendingId} />
        ))}

        {errorMessage && (
          <div className="mt-4 border-l border-[var(--color-amber)] bg-[var(--color-ink-2)] px-4 py-3">
            <div className="font-mono text-[10px] tracking-caps text-[var(--color-amber-2)] uppercase">
              Issue
            </div>
            <p className="mt-1 font-mono text-[12px] text-[var(--color-paper-2)]">{errorMessage}</p>
          </div>
        )}
      </div>

      <div className="flex h-[180px] shrink-0 items-center border-t border-[var(--color-rule)] bg-[var(--color-ink)] px-8">
        <div className="w-full">
          <ChatInput
            disabled={isStreaming}
            placeholder={
              phase === "INITIAL"
                ? "A feeling, a memory, a target consumer…"
                : "Refine, ask, push back."
            }
            onSubmit={handleSubmit}
          />
        </div>
      </div>
    </div>
  );
}
