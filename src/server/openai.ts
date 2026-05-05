import { createOpenAI } from "@ai-sdk/openai";
import { env } from "cloudflare:workers";

let cached: ReturnType<typeof createOpenAI> | null = null;

export const getOpenAI = () => {
  if (cached) return cached;
  const apiKey = (env as unknown as { OPENAI_API_KEY?: string }).OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error(
      "OPENAI_API_KEY is not set. Add it to .dev.vars for local dev or as a Cloudflare secret in production.",
    );
  }
  cached = createOpenAI({ apiKey });
  return cached;
};

export const isOfflineMode = (): boolean => {
  const mode = (env as unknown as { DEMO_MODE?: string }).DEMO_MODE;
  return mode === "offline";
};

export const MODEL_CHAT = "gpt-5-mini";
export const MODEL_BRIEF = "gpt-5";
export const MODEL_CRITIQUE = "gpt-5-mini";
