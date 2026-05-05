import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";

export const briefs = sqliteTable("briefs", {
  ref: text("ref").primaryKey(),
  name: text("name").notNull(),
  tagline: text("tagline").notNull(),
  application: text("application").notNull(),
  payload: text("payload", { mode: "json" }).notNull().$type<BriefPayload>(),
  createdAt: integer("created_at", { mode: "timestamp_ms" }).notNull(),
  status: text("status", { enum: ["draft", "transmitted"] })
    .notNull()
    .default("draft"),
});

export type BriefRow = typeof briefs.$inferSelect;
export type BriefInsert = typeof briefs.$inferInsert;

export interface BriefPayload {
  name: string;
  tagline: string;
  story: string;
  targetConsumer: string;
  occasion: string;
  application: "fine-fragrance" | "candle" | "personal-care" | "home-care" | "odor-management";
  recommendedConcentration: string;
  pyramid: {
    top: { compoundId: string; percent: number }[];
    heart: { compoundId: string; percent: number }[];
    base: { compoundId: string; percent: number }[];
  };
  marketingCopy: {
    shortDescription: string;
    longDescription: string;
    bottleHints: string;
  };
  safetyProfile: {
    physicalHazards: string[];
    healthHazards: string[];
    ifraSummary: string;
    flashpoint: string;
    storage: string;
  };
  perfumerNotes: string;
  reference: string;
  createdAt: string;
}
