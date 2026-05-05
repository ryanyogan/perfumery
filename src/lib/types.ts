import type { ProposeCompositionInput } from "./tools";

export type ChatRole = "user" | "assistant";

export interface ChatMessage {
  id: string;
  role: ChatRole;
  content: string;
  proposal?: ProposeCompositionInput;
  createdAt: number;
}

export interface CompositionEntry {
  compoundId: string;
  percent: number;
  role: "top" | "heart" | "base";
}

export type ChatStreamEvent =
  | { type: "message-start"; messageId: string }
  | { type: "text-delta"; messageId: string; delta: string }
  | { type: "tool-input-delta"; messageId: string }
  | {
      type: "tool-result";
      messageId: string;
      toolName: "propose_composition";
      input: ProposeCompositionInput;
    }
  | { type: "message-finish"; messageId: string; full: string }
  | { type: "error"; message: string };
