import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { eq, desc } from "drizzle-orm";
import { getDb } from "../db/client";
import { briefs, type BriefPayload } from "../db/schema";
import { briefSchema } from "../lib/brief-schema";

const saveInputSchema = z.object({
  reference: z.string().regex(/^BAC-\d{6}-[A-Z0-9]{4}$/),
  brief: briefSchema,
  status: z.enum(["draft", "transmitted"]).default("draft"),
});

export const saveBrief = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => saveInputSchema.parse(data))
  .handler(async ({ data }): Promise<{ ref: string }> => {
    const db = getDb();
    const payload: BriefPayload = {
      ...data.brief,
      reference: data.reference,
      createdAt: new Date().toISOString(),
    };
    await db
      .insert(briefs)
      .values({
        ref: data.reference,
        name: data.brief.name,
        tagline: data.brief.tagline,
        application: data.brief.application,
        payload,
        status: data.status,
        createdAt: new Date(),
      })
      .onConflictDoUpdate({
        target: briefs.ref,
        set: {
          name: data.brief.name,
          tagline: data.brief.tagline,
          application: data.brief.application,
          payload,
          status: data.status,
        },
      });
    return { ref: data.reference };
  });

const refSchema = z.object({ ref: z.string() });

export const getBrief = createServerFn({ method: "GET" })
  .inputValidator((data: unknown) => refSchema.parse(data))
  .handler(
    async ({
      data,
    }): Promise<
      | {
          brief: BriefPayload;
          status: "draft" | "transmitted";
          createdAt: number;
        }
      | { notFound: true }
    > => {
      const db = getDb();
      const rows = await db.select().from(briefs).where(eq(briefs.ref, data.ref)).limit(1);
      const row = rows[0];
      if (!row) return { notFound: true };
      return {
        brief: row.payload,
        status: row.status,
        createdAt: row.createdAt.getTime(),
      };
    },
  );

export const listBriefs = createServerFn({ method: "GET" }).handler(
  async (): Promise<
    Array<{
      ref: string;
      name: string;
      tagline: string;
      application: string;
      status: "draft" | "transmitted";
      createdAt: number;
    }>
  > => {
    const db = getDb();
    const rows = await db
      .select({
        ref: briefs.ref,
        name: briefs.name,
        tagline: briefs.tagline,
        application: briefs.application,
        status: briefs.status,
        createdAt: briefs.createdAt,
      })
      .from(briefs)
      .orderBy(desc(briefs.createdAt))
      .limit(100);
    return rows.map((r) => ({
      ref: r.ref,
      name: r.name,
      tagline: r.tagline,
      application: r.application,
      status: r.status,
      createdAt: r.createdAt.getTime(),
    }));
  },
);

export const transmitBrief = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => refSchema.parse(data))
  .handler(async ({ data }): Promise<{ ref: string; status: "transmitted" }> => {
    const db = getDb();
    await db.update(briefs).set({ status: "transmitted" }).where(eq(briefs.ref, data.ref));
    return { ref: data.ref, status: "transmitted" };
  });
