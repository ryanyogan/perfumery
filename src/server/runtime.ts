import { createServerFn } from "@tanstack/react-start";
import { env } from "cloudflare:workers";

export const getRuntimeInfo = createServerFn({ method: "GET" }).handler(
  async (): Promise<{ hasOpenAI: boolean; demoMode: "live" | "offline" }> => {
    const e = env as unknown as { OPENAI_API_KEY?: string; DEMO_MODE?: string };
    const hasOpenAI = Boolean(e.OPENAI_API_KEY);
    const demoMode = e.DEMO_MODE === "offline" || !hasOpenAI ? "offline" : "live";
    return { hasOpenAI, demoMode };
  },
);
