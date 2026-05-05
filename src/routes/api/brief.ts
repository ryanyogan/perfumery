import { createFileRoute } from "@tanstack/react-router";
import { streamObject } from "ai";
import { z } from "zod";
import { BRIEF_SYSTEM_PROMPT, buildPaletteBlock, buildCompositionBlock } from "../../lib/prompts";
import { briefSchema, type BriefDraft } from "../../lib/brief-schema";
import { getOpenAI, MODEL_BRIEF } from "../../server/openai";
import { generateRef } from "../../lib/ref";

const bodySchema = z.object({
  messages: z.array(
    z.object({
      role: z.enum(["user", "assistant"]),
      content: z.string(),
    }),
  ),
  composition: z.array(
    z.object({
      compoundId: z.string(),
      percent: z.number(),
      role: z.enum(["top", "heart", "base"]),
    }),
  ),
});

type BriefStreamEvent =
  | { type: "partial"; brief: Partial<BriefDraft> }
  | { type: "finished"; brief: BriefDraft; reference: string }
  | { type: "error"; message: string };

export const Route = createFileRoute("/api/brief")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const parsed = bodySchema.safeParse(await request.json());
        if (!parsed.success) {
          return new Response(JSON.stringify({ error: parsed.error.message }), {
            status: 400,
            headers: { "Content-Type": "application/json" },
          });
        }
        const { messages, composition } = parsed.data;

        const encoder = new TextEncoder();

        const stream = new ReadableStream<Uint8Array>({
          async start(controller) {
            const emit = (event: BriefStreamEvent) => {
              controller.enqueue(encoder.encode(JSON.stringify(event) + "\n"));
            };

            let openai;
            try {
              openai = getOpenAI();
            } catch (err) {
              emit({
                type: "error",
                message: err instanceof Error ? err.message : "OpenAI not configured.",
              });
              controller.close();
              return;
            }

            const paletteBlock = buildPaletteBlock();
            const compositionBlock = buildCompositionBlock(composition);

            try {
              const result = streamObject({
                model: openai(MODEL_BRIEF),
                system: BRIEF_SYSTEM_PROMPT,
                schema: briefSchema,
                messages: [
                  {
                    role: "user",
                    content: `${paletteBlock}\n\n${compositionBlock}\n\nCONVERSATION:\n${messages
                      .map((m) => `${m.role.toUpperCase()}: ${m.content}`)
                      .join("\n")}\n\nGenerate the partner-ready brief.`,
                  },
                ],
              });

              for await (const partial of result.partialObjectStream) {
                emit({ type: "partial", brief: partial as Partial<BriefDraft> });
              }

              const final = await result.object;
              emit({ type: "finished", brief: final, reference: generateRef() });
            } catch (err) {
              emit({
                type: "error",
                message: err instanceof Error ? err.message : "Brief generation failed.",
              });
            }

            controller.close();
          },
        });

        return new Response(stream, {
          headers: {
            "Content-Type": "application/x-ndjson",
            "Cache-Control": "no-cache",
            "X-Accel-Buffering": "no",
          },
        });
      },
    },
  },
});
