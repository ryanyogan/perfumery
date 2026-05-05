import { createFileRoute } from "@tanstack/react-router";
import { streamText } from "ai";
import { z } from "zod";
import {
  PERFUMER_SYSTEM_PROMPT,
  buildPaletteBlock,
  buildCompositionBlock,
} from "../../lib/prompts";
import {
  proposeCompositionTool,
  proposeCompositionInputSchema,
  validateProposal,
} from "../../lib/tools";
import { getOpenAI, MODEL_CHAT } from "../../server/openai";
import type { ChatStreamEvent } from "../../lib/types";

const bodySchema = z.object({
  messages: z
    .array(
      z.object({
        id: z.string(),
        role: z.enum(["user", "assistant"]),
        content: z.string(),
      }),
    )
    .min(1),
  composition: z.array(
    z.object({
      compoundId: z.string(),
      percent: z.number(),
    }),
  ),
});

export const Route = createFileRoute("/api/chat")({
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
        const messageId = crypto.randomUUID();

        const stream = new ReadableStream<Uint8Array>({
          async start(controller) {
            const emit = (event: ChatStreamEvent) => {
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

            emit({ type: "message-start", messageId });

            const paletteBlock = buildPaletteBlock();
            const compositionBlock = buildCompositionBlock(composition);

            const aiMessages = [
              {
                role: "user" as const,
                content: `${paletteBlock}\n\n${compositionBlock}`,
              },
              {
                role: "assistant" as const,
                content:
                  "Understood. I will only propose compounds whose ids appear in the palette, and I will call the propose_composition tool whenever I name compounds.",
              },
              ...messages.map((m) => ({ role: m.role, content: m.content })),
            ];

            let accumulated = "";

            try {
              const result = streamText({
                model: openai(MODEL_CHAT),
                system: PERFUMER_SYSTEM_PROMPT,
                messages: aiMessages,
                tools: { propose_composition: proposeCompositionTool },
                toolChoice: "auto",
              });

              for await (const part of result.fullStream) {
                switch (part.type) {
                  case "text-delta": {
                    const delta = (part as { text?: string }).text ?? "";
                    accumulated += delta;
                    emit({ type: "text-delta", messageId, delta });
                    break;
                  }
                  case "tool-input-start":
                  case "tool-input-delta":
                    emit({ type: "tool-input-delta", messageId });
                    break;
                  case "tool-call": {
                    const input = part.input as unknown;
                    const parsedInput = proposeCompositionInputSchema.safeParse(input);
                    if (!parsedInput.success) {
                      emit({ type: "error", message: "Invalid tool input shape from model." });
                      break;
                    }
                    const validation = validateProposal(parsedInput.data);
                    if (!validation.valid) {
                      emit({
                        type: "error",
                        message: `Composition proposal rejected: ${validation.reason}`,
                      });
                      break;
                    }
                    emit({
                      type: "tool-result",
                      messageId,
                      toolName: "propose_composition",
                      input: parsedInput.data,
                    });
                    break;
                  }
                  case "error": {
                    emit({
                      type: "error",
                      message: part.error instanceof Error ? part.error.message : "Stream error.",
                    });
                    break;
                  }
                  default:
                    break;
                }
              }
            } catch (err) {
              emit({
                type: "error",
                message: err instanceof Error ? err.message : "Chat stream error.",
              });
              controller.close();
              return;
            }

            emit({ type: "message-finish", messageId, full: accumulated });
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
