import type { ChatMessage } from "../../lib/types";
import { compoundById } from "../../lib/compounds";

interface Props {
  message: ChatMessage;
  isStreaming: boolean;
}

const formatTime = (ts: number) => {
  const d = new Date(ts);
  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
};

export function ChatTurn({ message, isStreaming }: Props) {
  const isUser = message.role === "user";
  const speaker = isUser ? "BRAND PARTNER" : "M. BEAUMONT";

  return (
    <article className="border-b border-[var(--color-rule)] py-6" aria-label={`${speaker} message`}>
      <header className="mb-3 flex items-baseline gap-3 font-mono text-[10px] tracking-caps text-[var(--color-paper-3)] uppercase">
        <span>{speaker}</span>
        <span aria-hidden="true">·</span>
        <time dateTime={new Date(message.createdAt).toISOString()}>
          {formatTime(message.createdAt)}
        </time>
      </header>

      <div
        className={
          isUser
            ? "font-display text-[17px] leading-relaxed text-[var(--color-paper-2)] italic"
            : "font-sans text-[16px] leading-[1.7] text-[var(--color-paper)]"
        }
      >
        {message.content}
        {isStreaming && (
          <span className="dot-pulse ml-2 align-middle">
            <span />
            <span />
            <span />
          </span>
        )}
      </div>

      {message.proposal && message.proposal.add.length > 0 && (
        <ProposalCard proposal={message.proposal} />
      )}
    </article>
  );
}

function ProposalCard({ proposal }: { proposal: NonNullable<ChatMessage["proposal"]> }) {
  return (
    <div className="mt-4 border-l border-[var(--color-amber)] bg-[var(--color-ink-2)]/60 pl-4">
      <div className="font-mono text-[9px] tracking-caps text-[var(--color-amber-2)] uppercase">
        Composition · proposed
      </div>
      <ul className="mt-2 space-y-1">
        {proposal.add.map((item) => {
          const c = compoundById(item.compoundId);
          if (!c) return null;
          return (
            <li
              key={item.compoundId}
              className="flex items-baseline gap-2 font-mono text-[11px] text-[var(--color-paper-2)]"
            >
              <span className="text-[var(--color-paper-3)] uppercase">{item.role}</span>
              <span className="font-sans text-[13px] text-[var(--color-paper)]">{c.name}</span>
              <span className="ml-auto tabular-nums text-[var(--color-amber-2)]">
                {item.percent.toFixed(1)}%
              </span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
