import { createServerFn } from "@tanstack/react-start";
import { streamText } from "ai";
import { z } from "zod";
import { PERFUMER_SYSTEM_PROMPT, buildPaletteBlock, buildCompositionBlock } from "../lib/prompts";
import {
  proposeCompositionTool,
  proposeCompositionInputSchema,
  validateProposal,
} from "../lib/tools";
import type { ChatStreamEvent } from "../lib/types";
import { getOpenAI, MODEL_CHAT } from "./openai";
import { RawStream } from "@tanstack/router-core";

const messageSchema = z.object({
  id: z.string(),
  role: z.enum(["user", "assistant"]),
  content: z.string(),
});

const chatInputSchema = z.object({
  messages: z.array(messageSchema).min(1),
  composition: z.array(
    z.object({
      compoundId: z.string(),
      percent: z.number(),
    }),
  ),
});

export const chatStream = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => chatInputSchema.parse(data))
  .handler(({ data }): ReadableStream<Uint8Array> => {
    const encoder = new TextEncoder();
    const messageId = crypto.randomUUID();

    const nativeStream = new ReadableStream<Uint8Array>({
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
            message: err instanceof Error ? err.message : "OpenAI is not configured.",
          });
          controller.close();
          return;
        }

        emit({ type: "message-start", messageId });

        const paletteBlock = buildPaletteBlock();
        const compositionBlock = buildCompositionBlock(data.composition);

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
          ...data.messages.map((m) => ({ role: m.role, content: m.content })),
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
                const parsed = proposeCompositionInputSchema.safeParse(input);
                if (!parsed.success) {
                  emit({ type: "error", message: "Invalid tool input shape from model." });
                  break;
                }
                const validation = validateProposal(parsed.data);
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
                  input: parsed.data,
                });
                break;
              }
              case "error": {
                emit({
                  type: "error",
                  message:
                    part.error instanceof Error
                      ? part.error.message
                      : "Stream error from upstream.",
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
            message: err instanceof Error ? err.message : "Unknown chat stream error.",
          });
          controller.close();
          return;
        }

        emit({ type: "message-finish", messageId, full: accumulated });
        controller.close();
      },
    });

    return new RawStream(nativeStream) as unknown as ReadableStream<Uint8Array>;
  });
