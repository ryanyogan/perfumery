import { createServerFn } from "@tanstack/react-start";
import { env } from "cloudflare:workers";

export const getRuntimeInfo = createServerFn({ method: "GET" }).handler(
  async (): Promise<{ hasOpenAI: boolean }> => {
    const e = env as unknown as { OPENAI_API_KEY?: string };
    return { hasOpenAI: Boolean(e.OPENAI_API_KEY) };
  },
);
