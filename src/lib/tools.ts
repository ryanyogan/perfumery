import { tool } from "ai";
import { z } from "zod";
import { COMPOUNDS_BY_ID } from "./compounds";

const ROLES = ["top", "heart", "base"] as const;

export const composePropertySchema = z.object({
  compoundId: z
    .string()
    .describe(
      "The exact id of a compound from the AVAILABLE_PALETTE. Must be one of the listed ids.",
    ),
  percent: z
    .number()
    .min(0.1)
    .max(40)
    .describe("Suggested percentage of this compound in the composition (0.1–40)."),
  role: z
    .enum(ROLES)
    .describe(
      "Whether this compound is functioning as a top, heart, or base in this composition. Usually but not always matches the compound's primary role.",
    ),
});

export const proposeCompositionInputSchema = z.object({
  rationale: z
    .string()
    .min(10)
    .describe("One sentence on the overall structural intent — what this composition is doing."),
  add: z
    .array(composePropertySchema)
    .describe(
      "Compounds to add to (or update in) the composition. The same compoundId provided twice is invalid.",
    ),
  remove: z
    .array(z.string())
    .default([])
    .describe("Compound ids to remove from the current composition."),
});

export type ProposeCompositionInput = z.infer<typeof proposeCompositionInputSchema>;

export const proposeCompositionTool = tool({
  description:
    "Update the composition on the perfume organ. The user sees this rendered as bottles lighting up and pouring into the central flacon. Always include 4–8 compounds via the `add` array unless explicitly refining. Do not list compound ids in your prose — call this tool instead.",
  inputSchema: proposeCompositionInputSchema,
});

export const validateProposal = (
  input: ProposeCompositionInput,
): { valid: true } | { valid: false; reason: string } => {
  const seen = new Set<string>();
  for (const item of input.add) {
    if (!COMPOUNDS_BY_ID[item.compoundId]) {
      return { valid: false, reason: `Unknown compound id: ${item.compoundId}` };
    }
    if (seen.has(item.compoundId)) {
      return { valid: false, reason: `Duplicate compound: ${item.compoundId}` };
    }
    seen.add(item.compoundId);
  }
  for (const id of input.remove) {
    if (!COMPOUNDS_BY_ID[id]) {
      return { valid: false, reason: `Unknown compound id in remove: ${id}` };
    }
  }
  return { valid: true };
};
