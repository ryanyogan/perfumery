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
import { getOpenAI, MODEL_BRIEF, MODEL_CRITIQUE, isOfflineMode } from "./openai";
import { OFFLINE_SCENARIOS } from "../lib/offline";
import { generateRef } from "../lib/ref";

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
  offlineScenario: z.enum(["storm", "library", "belle-aire-candle"]).optional(),
});

export const generateBrief = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => briefInputSchema.parse(data))
  .handler(async function* ({
    data,
  }): AsyncGenerator<
    | { type: "partial"; brief: Partial<BriefDraft> }
    | { type: "finished"; brief: BriefDraft; reference: string }
    | { type: "error"; message: string }
  > {
    if (isOfflineMode() && data.offlineScenario) {
      const scenario = OFFLINE_SCENARIOS.find((s) => s.id === data.offlineScenario);
      if (!scenario) {
        yield { type: "error", message: "Unknown scenario." };
        return;
      }
      // Fake-stream the offline brief section by section for visual effect
      const partial: Partial<BriefDraft> = {};
      const sections: (keyof BriefDraft)[] = [
        "name",
        "tagline",
        "application",
        "recommendedConcentration",
        "targetConsumer",
        "occasion",
        "pyramid",
        "story",
        "marketingCopy",
        "safetyProfile",
        "perfumerNotes",
      ];
      for (const key of sections) {
        // @ts-expect-error sequenced assignment is fine here
        partial[key] = scenario.brief[key];
        yield { type: "partial", brief: { ...partial } };
        await new Promise((r) => setTimeout(r, 220));
      }
      yield { type: "finished", brief: scenario.brief, reference: generateRef() };
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
        yield { type: "partial", brief: partial as Partial<BriefDraft> };
      }

      const final = await result.object;
      yield { type: "finished", brief: final, reference: generateRef() };
    } catch (err) {
      yield {
        type: "error",
        message: err instanceof Error ? err.message : "Brief generation failed.",
      };
    }
  });

const critiqueInputSchema = z.object({
  brief: briefSchema,
  conversationSummary: z.string(),
  offlineScenario: z.enum(["storm", "library", "belle-aire-candle"]).optional(),
});

export const critiqueBrief = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => critiqueInputSchema.parse(data))
  .handler(async ({ data }): Promise<{ critique: Critique } | { error: string }> => {
    if (isOfflineMode() && data.offlineScenario) {
      const scenario = OFFLINE_SCENARIOS.find((s) => s.id === data.offlineScenario);
      if (!scenario) return { error: "Unknown scenario." };
      return { critique: scenario.critique };
    }

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
