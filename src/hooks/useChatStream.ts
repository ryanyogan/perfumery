import { useCallback, useRef, useState } from "react";
import { chatStream } from "../server/chat";
import { useComposerStore } from "../lib/store";

export interface SendOptions {
  offlineScenario?: {
    id: "storm" | "library" | "belle-aire-candle";
    turnIndex: number;
  };
}

export const useChatStream = () => {
  const [isStreaming, setIsStreaming] = useState(false);
  const cancelledRef = useRef(false);

  const send = useCallback(async (content: string, opts?: SendOptions) => {
    const store = useComposerStore.getState();
    store.setError(null);
    store.appendUserMessage(content);
    cancelledRef.current = false;
    setIsStreaming(true);

    try {
      const messages = useComposerStore.getState().messages.map((m) => ({
        id: m.id,
        role: m.role,
        content: m.content,
      }));
      const composition = useComposerStore.getState().composition.map((c) => ({
        compoundId: c.compoundId,
        percent: c.percent,
      }));

      const stream = await chatStream({
        data: {
          messages,
          composition,
          offlineScenario: opts?.offlineScenario,
        },
      });

      for await (const event of stream) {
        if (cancelledRef.current) break;
        const s = useComposerStore.getState();
        switch (event.type) {
          case "message-start":
            s.startAssistantMessage(event.messageId);
            break;
          case "text-delta":
            s.appendAssistantDelta(event.messageId, event.delta);
            break;
          case "tool-input-delta":
            // No-op for now; could show a "thinking" indicator
            break;
          case "tool-result":
            s.attachProposal(event.messageId, event.input);
            s.applyProposal(event.input);
            s.highlightOnly(event.input.add.map((a) => a.compoundId));
            // Clear highlight after a beat
            setTimeout(() => useComposerStore.getState().clearHighlight(), 4500);
            break;
          case "message-finish":
            s.finalizeAssistantMessage(event.messageId, event.full);
            break;
          case "error":
            s.setError(event.message);
            break;
        }
      }
    } catch (err) {
      useComposerStore
        .getState()
        .setError(err instanceof Error ? err.message : "Chat stream failed.");
    } finally {
      setIsStreaming(false);
    }
  }, []);

  const cancel = useCallback(() => {
    cancelledRef.current = true;
    setIsStreaming(false);
  }, []);

  return { send, cancel, isStreaming };
};
