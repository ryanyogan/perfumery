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
import { getOpenAI, MODEL_CHAT, isOfflineMode } from "./openai";
import { offlineChatEvents } from "../lib/offline";

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
  // Optional offline scenario to drive a deterministic response
  offlineScenario: z
    .object({
      id: z.enum(["storm", "library", "belle-aire-candle"]),
      turnIndex: z.number().int().min(0),
    })
    .optional(),
});

export const chatStream = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => chatInputSchema.parse(data))
  .handler(async function* ({ data }): AsyncGenerator<ChatStreamEvent> {
    const messageId = crypto.randomUUID();

    if (isOfflineMode() && data.offlineScenario) {
      yield* offlineChatEvents(data.offlineScenario.id, data.offlineScenario.turnIndex, messageId);
      return;
    }

    let openai;
    try {
      openai = getOpenAI();
    } catch (err) {
      yield {
        type: "error",
        message: err instanceof Error ? err.message : "OpenAI is not configured.",
      };
      return;
    }

    yield { type: "message-start", messageId };

    const paletteBlock = buildPaletteBlock();
    const compositionBlock = buildCompositionBlock(data.composition);

    // Inject palette + composition as a leading system context before user history
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
      ...data.messages.map((m) => ({
        role: m.role,
        content: m.content,
      })),
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
            // AI SDK 6 calls the field `text` on text-delta parts
            const delta = (part as { text?: string }).text ?? "";
            accumulated += delta;
            yield { type: "text-delta", messageId, delta };
            break;
          }
          case "tool-input-start":
          case "tool-input-delta":
            yield { type: "tool-input-delta", messageId };
            break;
          case "tool-call": {
            const input = part.input as unknown;
            const parsed = proposeCompositionInputSchema.safeParse(input);
            if (!parsed.success) {
              yield {
                type: "error",
                message: "Invalid tool input shape from model.",
              };
              break;
            }
            const validation = validateProposal(parsed.data);
            if (!validation.valid) {
              yield {
                type: "error",
                message: `Composition proposal rejected: ${validation.reason}`,
              };
              break;
            }
            yield {
              type: "tool-result",
              messageId,
              toolName: "propose_composition",
              input: parsed.data,
            };
            break;
          }
          case "error": {
            yield {
              type: "error",
              message:
                part.error instanceof Error ? part.error.message : "Stream error from upstream.",
            };
            break;
          }
          default:
            break;
        }
      }
    } catch (err) {
      yield {
        type: "error",
        message: err instanceof Error ? err.message : "Unknown chat stream error.",
      };
      return;
    }

    yield { type: "message-finish", messageId, full: accumulated };
  });
