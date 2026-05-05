import { z } from "zod";

export const APPLICATION_VALUES = [
  "fine-fragrance",
  "candle",
  "personal-care",
  "home-care",
  "odor-management",
] as const;

export const briefPyramidEntrySchema = z.object({
  compoundId: z.string(),
  percent: z.number().min(0).max(100),
});

export const briefSchema = z.object({
  name: z.string().min(2).max(80).describe("The perfume name. French or English. No quotes."),
  tagline: z
    .string()
    .min(4)
    .max(80)
    .describe("A single line, lowercase or mixed case, ≤ 12 words."),
  story: z
    .string()
    .min(80)
    .max(800)
    .describe("80–140 words of marketing narrative in the voice of the chat."),
  targetConsumer: z.string().min(10).describe("One sentence describing who this is for."),
  occasion: z.string().min(10).describe("One sentence on when this is worn."),
  application: z.enum(APPLICATION_VALUES),
  recommendedConcentration: z
    .string()
    .describe('e.g. "Eau de Parfum, 18% concentration" or "Candle, 8% load."'),
  pyramid: z.object({
    top: z.array(briefPyramidEntrySchema),
    heart: z.array(briefPyramidEntrySchema),
    base: z.array(briefPyramidEntrySchema),
  }),
  marketingCopy: z.object({
    shortDescription: z
      .string()
      .min(10)
      .max(300)
      .describe("~30 words, suitable for a product page card."),
    longDescription: z
      .string()
      .min(50)
      .max(1500)
      .describe("~120 words, suitable for an editorial product page."),
    bottleHints: z
      .string()
      .min(10)
      .max(300)
      .describe("One sentence describing the bottle aesthetic that would suit this fragrance."),
  }),
  safetyProfile: z.object({
    physicalHazards: z.array(z.string()).min(1),
    healthHazards: z.array(z.string()).min(1),
    ifraSummary: z.string().min(10).max(400),
    flashpoint: z.string().describe('e.g. "21–24°C / 70–75°F (estimated)"'),
    storage: z.string().min(10).max(200),
  }),
  perfumerNotes: z
    .string()
    .min(40)
    .max(500)
    .describe(
      "M. Beaumont's working notes — 2–3 sentences explaining the structural choices, signed implicitly through tone.",
    ),
});

export type BriefDraft = z.infer<typeof briefSchema>;

export const critiqueIssueSchema = z.object({
  severity: z.enum(["minor", "major"]),
  section: z.enum([
    "name",
    "tagline",
    "story",
    "pyramid",
    "composition",
    "marketing",
    "safety",
    "perfumerNotes",
    "overall",
  ]),
  comment: z.string().min(10).max(300),
});

export const critiqueSchema = z.object({
  overall: z.string().min(20).max(400).describe("One paragraph summary of the brief's standing."),
  issues: z.array(critiqueIssueSchema).min(1).max(6),
  shouldRevise: z.boolean(),
});

export type Critique = z.infer<typeof critiqueSchema>;
