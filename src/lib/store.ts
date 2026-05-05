import { create } from "zustand";
import type { ChatMessage, CompositionEntry } from "./types";
import type { ProposeCompositionInput } from "./tools";
import type { BriefDraft, Critique } from "./brief-schema";
import { compoundById } from "./compounds";

export type Phase = "INITIAL" | "ENGAGED" | "COMPOSING" | "BRIEF_PENDING" | "BRIEF_OPEN";

interface ComposerState {
  phase: Phase;
  messages: ChatMessage[];
  composition: CompositionEntry[];
  highlightedCompoundIds: Set<string>;
  pendingAssistantId: string | null;
  errorMessage: string | null;

  // Brief state
  briefDraft: Partial<BriefDraft> | null;
  briefRef: string | null;
  briefStatus: "idle" | "streaming" | "ready" | "transmitted";
  critique: Critique | null;
  critiqueStatus: "idle" | "pending" | "ready";

  // Actions
  setPhase: (phase: Phase) => void;
  appendUserMessage: (content: string) => string;
  startAssistantMessage: (id: string) => void;
  appendAssistantDelta: (id: string, delta: string) => void;
  finalizeAssistantMessage: (id: string, full: string) => void;
  attachProposal: (id: string, proposal: ProposeCompositionInput) => void;
  applyProposal: (proposal: ProposeCompositionInput) => void;
  toggleCompound: (compoundId: string) => void;
  highlightOnly: (ids: string[]) => void;
  clearHighlight: () => void;
  setError: (msg: string | null) => void;
  reset: () => void;

  // Brief
  setBriefStatus: (s: ComposerState["briefStatus"]) => void;
  patchBrief: (partial: Partial<BriefDraft>) => void;
  finalizeBrief: (brief: BriefDraft, ref: string) => void;
  setCritique: (c: Critique | null) => void;
  setCritiqueStatus: (s: ComposerState["critiqueStatus"]) => void;
  markTransmitted: () => void;
}

const initialState = (): Pick<
  ComposerState,
  | "phase"
  | "messages"
  | "composition"
  | "highlightedCompoundIds"
  | "pendingAssistantId"
  | "errorMessage"
  | "briefDraft"
  | "briefRef"
  | "briefStatus"
  | "critique"
  | "critiqueStatus"
> => ({
  phase: "INITIAL",
  messages: [],
  composition: [],
  highlightedCompoundIds: new Set(),
  pendingAssistantId: null,
  errorMessage: null,
  briefDraft: null,
  briefRef: null,
  briefStatus: "idle",
  critique: null,
  critiqueStatus: "idle",
});

export const useComposerStore = create<ComposerState>((set, get) => ({
  ...initialState(),

  setPhase: (phase) => set({ phase }),

  appendUserMessage: (content) => {
    const id = crypto.randomUUID();
    const msg: ChatMessage = {
      id,
      role: "user",
      content,
      createdAt: Date.now(),
    };
    set((state) => ({
      messages: [...state.messages, msg],
      phase: state.phase === "INITIAL" ? "ENGAGED" : state.phase,
      errorMessage: null,
    }));
    return id;
  },

  startAssistantMessage: (id) =>
    set((state) => ({
      pendingAssistantId: id,
      messages: [...state.messages, { id, role: "assistant", content: "", createdAt: Date.now() }],
    })),

  appendAssistantDelta: (id, delta) =>
    set((state) => ({
      messages: state.messages.map((m) => (m.id === id ? { ...m, content: m.content + delta } : m)),
    })),

  finalizeAssistantMessage: (id, full) =>
    set((state) => ({
      pendingAssistantId: null,
      messages: state.messages.map((m) => (m.id === id ? { ...m, content: full } : m)),
      phase: state.phase === "ENGAGED" || state.phase === "INITIAL" ? "COMPOSING" : state.phase,
    })),

  attachProposal: (id, proposal) =>
    set((state) => ({
      messages: state.messages.map((m) => (m.id === id ? { ...m, proposal } : m)),
    })),

  applyProposal: (proposal) => {
    const map = new Map<string, CompositionEntry>();
    for (const existing of get().composition) {
      map.set(existing.compoundId, existing);
    }
    for (const id of proposal.remove) map.delete(id);
    for (const item of proposal.add) {
      map.set(item.compoundId, {
        compoundId: item.compoundId,
        percent: item.percent,
        role: item.role,
      });
    }
    set({ composition: Array.from(map.values()) });
  },

  toggleCompound: (compoundId) => {
    const composition = get().composition;
    const has = composition.some((c) => c.compoundId === compoundId);
    if (has) {
      set({ composition: composition.filter((c) => c.compoundId !== compoundId) });
    } else {
      const c = compoundById(compoundId);
      if (!c) return;
      set({
        composition: [...composition, { compoundId, percent: c.defaultPercent, role: c.role }],
      });
    }
    // Auto-promote phase if user is composing manually before chatting
    const state = get();
    if (state.phase === "INITIAL") {
      set({ phase: "COMPOSING" });
    }
  },

  highlightOnly: (ids) => set({ highlightedCompoundIds: new Set(ids) }),
  clearHighlight: () => set({ highlightedCompoundIds: new Set() }),

  setError: (msg) => set({ errorMessage: msg }),

  reset: () => set(initialState()),

  setBriefStatus: (s) => set({ briefStatus: s }),
  patchBrief: (partial) => set((state) => ({ briefDraft: { ...state.briefDraft, ...partial } })),
  finalizeBrief: (brief, ref) =>
    set({ briefDraft: brief, briefRef: ref, briefStatus: "ready", phase: "BRIEF_OPEN" }),
  setCritique: (c) => set({ critique: c }),
  setCritiqueStatus: (s) => set({ critiqueStatus: s }),
  markTransmitted: () => set({ briefStatus: "transmitted" }),
}));
