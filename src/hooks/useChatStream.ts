import { useCallback, useRef, useState } from "react";
import { chatStream } from "../server/chat";
import { useComposerStore } from "../lib/store";
import { ndjsonStream } from "../lib/ndjson-stream";
import type { ChatStreamEvent } from "../lib/types";

export const useChatStream = () => {
  const [isStreaming, setIsStreaming] = useState(false);
  const cancelledRef = useRef(false);

  const send = useCallback(async (content: string) => {
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

      const rawStream = await chatStream({ data: { messages, composition } });

      for await (const event of ndjsonStream<ChatStreamEvent>(
        rawStream as unknown as ReadableStream<Uint8Array>,
      )) {
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
            break;
          case "tool-result":
            s.attachProposal(event.messageId, event.input);
            s.applyProposal(event.input);
            s.highlightOnly(event.input.add.map((a) => a.compoundId));
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
