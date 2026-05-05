import { useCallback, useState } from "react";
import { generateBrief } from "../server/brief";
import { useComposerStore } from "../lib/store";
import { ndjsonStream } from "../lib/ndjson-stream";
import type { BriefDraft } from "../lib/brief-schema";

type BriefStreamEvent =
  | { type: "partial"; brief: Partial<BriefDraft> }
  | { type: "finished"; brief: BriefDraft; reference: string }
  | { type: "error"; message: string };

export const useBriefStream = () => {
  const [isStreaming, setIsStreaming] = useState(false);

  const start = useCallback(async () => {
    const store = useComposerStore.getState();
    const composition = store.composition;
    const messages = store.messages.map((m) => ({
      role: m.role,
      content: m.content,
    }));
    if (composition.length === 0) return;

    store.setBriefStatus("streaming");
    store.patchBrief({});
    useComposerStore.setState({ phase: "BRIEF_PENDING" });
    setIsStreaming(true);

    try {
      const rawStream = await generateBrief({ data: { messages, composition } });

      for await (const event of ndjsonStream<BriefStreamEvent>(
        rawStream as unknown as ReadableStream<Uint8Array>,
      )) {
        const s = useComposerStore.getState();
        if (event.type === "partial") {
          s.patchBrief(event.brief);
        } else if (event.type === "finished") {
          s.finalizeBrief(event.brief, event.reference);
        } else if (event.type === "error") {
          s.setError(event.message);
          s.setBriefStatus("idle");
        }
      }
    } catch (err) {
      const s = useComposerStore.getState();
      s.setError(err instanceof Error ? err.message : "Brief generation failed.");
      s.setBriefStatus("idle");
    } finally {
      setIsStreaming(false);
    }
  }, []);

  return { start, isStreaming };
};
