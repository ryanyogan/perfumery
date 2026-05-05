import { useMutation } from "@tanstack/react-query";
import { useComposerStore } from "../lib/store";
import { ndjsonStream } from "../lib/ndjson-stream";
import type { BriefDraft } from "../lib/brief-schema";

type BriefStreamEvent =
  | { type: "partial"; brief: Partial<BriefDraft> }
  | { type: "finished"; brief: BriefDraft; reference: string }
  | { type: "error"; message: string };

export const useBriefStream = () => {
  const mutation = useMutation({
    mutationFn: async () => {
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

      const response = await fetch("/api/brief", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages, composition }),
      });

      if (!response.ok || !response.body) {
        throw new Error(`HTTP ${response.status}`);
      }

      for await (const event of ndjsonStream<BriefStreamEvent>(response.body)) {
        const s = useComposerStore.getState();
        if (event.type === "partial") {
          s.patchBrief(event.brief);
        } else if (event.type === "finished") {
          s.finalizeBrief(event.brief, event.reference);
        } else if (event.type === "error") {
          s.setError(event.message);
          s.setBriefStatus("idle");
          throw new Error(event.message);
        }
      }
    },
    onError(err) {
      const s = useComposerStore.getState();
      s.setError(err instanceof Error ? err.message : "Brief generation failed.");
      s.setBriefStatus("idle");
    },
  });

  return {
    start: mutation.mutate,
    isStreaming: mutation.isPending,
  };
};
