import { createServerFn } from "@tanstack/react-start";
import { generateObject, streamObject } from "ai";
import { z } from "zod";
import {
  BRIEF_SYSTEM_PROMPT,
  CRITIQUE_SYSTEM_PROMPT,
  buildPaletteBlock,
  buildCompositionBlock,
} from "../lib/prompts";
import { briefSchema, critiqueSchema, type Critique, type BriefDraft } from "../lib/brief-schema";
import { getOpenAI, MODEL_BRIEF, MODEL_CRITIQUE } from "./openai";
import { generateRef } from "../lib/ref";
import { RawStream } from "@tanstack/router-core";

const briefInputSchema = z.object({
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

export const generateBrief = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => briefInputSchema.parse(data))
  .handler(({ data }): ReadableStream<Uint8Array> => {
    const encoder = new TextEncoder();

    const nativeStream = new ReadableStream<Uint8Array>({
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
            message: err instanceof Error ? err.message : "OpenAI is not configured.",
          });
          controller.close();
          return;
        }

        const paletteBlock = buildPaletteBlock();
        const compositionBlock = buildCompositionBlock(data.composition);

        try {
          const result = streamObject({
            model: openai(MODEL_BRIEF),
            system: BRIEF_SYSTEM_PROMPT,
            schema: briefSchema,
            messages: [
              {
                role: "user",
                content: `${paletteBlock}\n\n${compositionBlock}\n\nCONVERSATION:\n${data.messages
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

    return new RawStream(nativeStream) as unknown as ReadableStream<Uint8Array>;
  });

const critiqueInputSchema = z.object({
  brief: briefSchema,
  conversationSummary: z.string(),
});

export const critiqueBrief = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => critiqueInputSchema.parse(data))
  .handler(async ({ data }): Promise<{ critique: Critique } | { error: string }> => {
    let openai;
    try {
      openai = getOpenAI();
    } catch (err) {
      return {
        error: err instanceof Error ? err.message : "OpenAI is not configured.",
      };
    }

    try {
      const { object } = await generateObject({
        model: openai(MODEL_CRITIQUE),
        system: CRITIQUE_SYSTEM_PROMPT,
        schema: critiqueSchema,
        messages: [
          {
            role: "user",
            content: `BRIEF:\n${JSON.stringify(data.brief, null, 2)}\n\nORIGINAL CONVERSATION CONTEXT:\n${data.conversationSummary}\n\nReturn a critical, useful review.`,
          },
        ],
      });
      return { critique: object };
    } catch (err) {
      return {
        error: err instanceof Error ? err.message : "Critique generation failed.",
      };
    }
  });
