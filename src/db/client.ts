import { drizzle } from "drizzle-orm/d1";
import { env } from "cloudflare:workers";
import * as schema from "./schema";

export const getDb = () => drizzle(env.DB, { schema });
export type DbClient = ReturnType<typeof getDb>;
