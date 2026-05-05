import { useState, useRef, useEffect } from "react";

interface Props {
  disabled: boolean;
  placeholder?: string;
  onSubmit: (value: string) => void;
}

export function ChatInput({ disabled, placeholder, onSubmit }: Props) {
  const [value, setValue] = useState("");
  const ref = useRef<HTMLTextAreaElement>(null);

  // Auto-grow
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = Math.min(el.scrollHeight, 200) + "px";
  }, [value]);

  const submit = () => {
    const trimmed = value.trim();
    if (!trimmed || disabled) return;
    onSubmit(trimmed);
    setValue("");
  };

  return (
    <div className="space-y-2">
      <div className="flex items-baseline justify-between font-mono text-[10px] tracking-caps text-[var(--color-paper-3)] uppercase">
        <span>You</span>
        <span aria-hidden="true">⏎ to send · shift+⏎ for newline</span>
      </div>
      <div className="flex items-end gap-3 rounded-sm border border-[var(--color-rule)] bg-[var(--color-ink-2)] px-4 py-3 transition-colors duration-300 ease-quiet focus-within:border-[var(--color-amber)]">
        <textarea
          ref={ref}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              submit();
            }
          }}
          placeholder={placeholder ?? "Tell M. Beaumont what you want it to feel like."}
          disabled={disabled}
          rows={1}
          className="min-h-[24px] flex-1 resize-none bg-transparent font-display text-[17px] leading-snug text-[var(--color-paper)] placeholder:font-display placeholder:italic placeholder:text-[var(--color-paper-3)]/80 focus:outline-none disabled:opacity-50"
          aria-label="Message to M. Beaumont"
          autoFocus
        />
        <button
          type="button"
          onClick={submit}
          disabled={disabled || !value.trim()}
          className="font-mono text-[11px] tracking-caps text-[var(--color-amber-2)] uppercase transition-colors duration-300 ease-quiet hover:text-[var(--color-amber-glow)] disabled:cursor-not-allowed disabled:text-[var(--color-paper-3)]"
        >
          Send →
        </button>
      </div>
    </div>
  );
}
