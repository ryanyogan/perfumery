import { createServerFn } from "@tanstack/react-start";
import { generateObject } from "ai";
import { z } from "zod";
import { CRITIQUE_SYSTEM_PROMPT } from "../lib/prompts";
import { critiqueSchema, type Critique } from "../lib/brief-schema";
import { getOpenAI, MODEL_CRITIQUE } from "./openai";

const critiqueInputSchema = z.object({
  brief: z.record(z.unknown()),
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
