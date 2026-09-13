import type { FormDefinition } from "@webform/form-schema";
import { useEffect, useId, useRef, useState, type FormEvent } from "react";
import { api } from "../api/client";

type ChatMessage = {
  id: string;
  role: "user" | "assistant";
  content: string;
};

type Props = {
  formId: string;
  definition: FormDefinition;
  onApplyDefinition: (definition: FormDefinition) => void;
};

const SUGGESTIONS = [
  "Add a phone number field",
  "Make email required",
  "Add a dropdown for country",
  "Rename the title to Customer feedback",
];

const HOVER_FEATURES = [
  { label: "Add fields", hint: "phone, date, dropdown…" },
  { label: "Edit labels", hint: "rename or reword questions" },
  { label: "Required rules", hint: "mark fields required" },
  { label: "Remove fields", hint: "clean up the draft" },
];

export function EditorCopilot({ formId, definition, onApplyDefinition }: Props) {
  const inputId = useId();
  const bottomRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [hovering, setHovering] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "welcome",
      role: "assistant",
      content:
        "I can edit this form for you with AI. Try: add a field, change a label, make something required, or remove a question.",
    },
  ]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, busy, open]);

  async function send(text: string) {
    const trimmed = text.trim();
    if (!trimmed || busy) return;

    setError(null);
    setInput("");
    setOpen(true);
    setHovering(false);
    const userMsg: ChatMessage = {
      id: crypto.randomUUID(),
      role: "user",
      content: trimmed,
    };
    setMessages((prev) => [...prev, userMsg]);
    setBusy(true);

    try {
      const history = messages
        .filter((m) => m.id !== "welcome")
        .concat(userMsg)
        .map((m) => ({ role: m.role, content: m.content }));

      const result = await api.aiEditForm(formId, {
        message: trimmed,
        history: history.slice(0, -1),
        definition,
      });

      if (result.kind === "update") {
        onApplyDefinition(result.definition);
      }

      setMessages((prev) => [
        ...prev,
        {
          id: crypto.randomUUID(),
          role: "assistant",
          content: result.reply,
        },
      ]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "AI request failed");
    } finally {
      setBusy(false);
    }
  }

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    void send(input);
  }

  const showHoverCard = !open && hovering;

  return (
    <div
      className="fixed right-5 bottom-20 z-50 flex max-h-[calc(100dvh-5.5rem)] flex-col items-end gap-3 lg:right-8 lg:bottom-24"
      onMouseEnter={() => setHovering(true)}
      onMouseLeave={() => setHovering(false)}
    >
      {open ? (
        <div className="flex h-[min(30rem,calc(100dvh-12.5rem))] max-h-[calc(100dvh-12.5rem)] w-[min(26rem,calc(100vw-2.5rem))] flex-col overflow-hidden rounded-2xl border border-[#E5E7EB] bg-white shadow-2xl shadow-[#0B1F44]/15">
          <div className="flex shrink-0 items-center justify-between border-b border-[#E5E7EB] bg-gradient-to-r from-[#EFF6FF] to-[#F5F3FF] px-4 py-3">
            <div className="flex min-w-0 items-center gap-2.5">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[#2563EB] to-[#7C3AED] text-xs font-bold text-white shadow-sm">
                AI
              </span>
              <div className="min-w-0">
                <p className="text-sm font-semibold text-[#0B1F44]">Ask Copilot</p>
                <p className="truncate text-xs text-[#64748B]">
                  Edit this form with AI — changes apply to your draft
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="shrink-0 rounded-lg p-1.5 text-[#94A3B8] hover:bg-white hover:text-[#0B1F44]"
              aria-label="Close copilot"
            >
              <svg viewBox="0 0 20 20" className="h-4 w-4" fill="none" aria-hidden="true">
                <path d="M5 5l10 10M15 5 5 15" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
              </svg>
            </button>
          </div>

          <div className="shrink-0 border-b border-[#DBEAFE] bg-[#EFF6FF]/70 px-4 py-2 text-xs text-[#1D4ED8]">
            Tip: describe the change in plain English. Save the draft when you’re happy.
          </div>

          <div className="flex-1 space-y-3 overflow-y-auto px-4 py-3.5">
            {messages.map((m) => (
              <div
                key={m.id}
                className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[92%] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed ${
                    m.role === "user"
                      ? "bg-[#2563EB] text-white"
                      : "bg-[#F8FAFC] text-[#0B1F44] ring-1 ring-[#E5E7EB]"
                  }`}
                >
                  <p className="whitespace-pre-wrap">{m.content}</p>
                </div>
              </div>
            ))}
            {busy ? <p className="text-xs text-[#94A3B8]">Updating form…</p> : null}
            <div ref={bottomRef} />
          </div>

          {messages.length <= 1 ? (
            <div className="flex flex-wrap gap-1.5 border-t border-[#E5E7EB] px-4 py-2.5">
              {SUGGESTIONS.map((s) => (
                <button
                  key={s}
                  type="button"
                  disabled={busy}
                  onClick={() => void send(s)}
                  className="rounded-full border border-[#E5E7EB] bg-white px-3 py-1.5 text-xs text-[#64748B] hover:border-[#2563EB]/40 hover:bg-[#EFF6FF] hover:text-[#0B1F44] disabled:opacity-50"
                >
                  {s}
                </button>
              ))}
            </div>
          ) : null}

          <form onSubmit={onSubmit} className="border-t border-[#E5E7EB] bg-[#F8FAFC] px-4 py-3">
            {error ? <p className="mb-2 text-xs text-[#DC2626]">{error}</p> : null}
            <label className="sr-only" htmlFor={inputId}>
              Message
            </label>
            <div className="flex gap-2">
              <input
                id={inputId}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                disabled={busy}
                placeholder="e.g. Add a comments textarea…"
                className="min-w-0 flex-1 rounded-xl border border-[#E5E7EB] bg-white px-3.5 py-2.5 text-sm outline-none focus:border-[#2563EB] focus:ring-2 focus:ring-[#2563EB]/15 disabled:opacity-60"
              />
              <button
                type="submit"
                disabled={busy || !input.trim()}
                className="rounded-xl bg-[#2563EB] px-4 py-2.5 text-sm font-medium text-white hover:bg-[#1D4ED8] disabled:opacity-50"
              >
                Send
              </button>
            </div>
          </form>
        </div>
      ) : null}

      {showHoverCard ? (
        <div
          className="w-[min(20rem,calc(100vw-2.5rem))] rounded-2xl border border-[#E5E7EB] bg-white p-3.5 shadow-xl shadow-[#0B1F44]/12"
          role="tooltip"
        >
          <p className="text-sm font-semibold text-[#0B1F44]">Edit this form with AI</p>
          <p className="mt-1 text-xs leading-relaxed text-[#64748B]">
            Hover tips — click the button to open chat and change fields in plain English.
          </p>
          <ul className="mt-3 space-y-2">
            {HOVER_FEATURES.map((f) => (
              <li key={f.label} className="flex items-start gap-2 text-xs">
                <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#EFF6FF] text-[10px] font-bold text-[#2563EB]">
                  ✓
                </span>
                <span>
                  <span className="font-medium text-[#0B1F44]">{f.label}</span>
                  <span className="text-[#64748B]"> — {f.hint}</span>
                </span>
              </li>
            ))}
          </ul>
          <button
            type="button"
            onClick={() => {
              setOpen(true);
              setHovering(false);
            }}
            className="mt-3 w-full rounded-xl bg-[#2563EB] px-3 py-2 text-xs font-medium text-white hover:bg-[#1D4ED8]"
          >
            Start chatting
          </button>
        </div>
      ) : null}

      <button
        type="button"
        onClick={() => {
          setOpen((v) => !v);
          setHovering(false);
        }}
        className="group inline-flex items-center gap-2 rounded-full bg-[#0B1F44] px-4 py-2.5 text-sm font-medium text-white shadow-lg shadow-[#0B1F44]/25 transition hover:scale-[1.02] hover:bg-[#152a52]"
        aria-expanded={open}
        aria-label={open ? "Close Ask Copilot" : "Open Ask Copilot — edit this form with AI"}
        title="Edit this form with AI"
      >
        <span className="flex h-7 w-7 items-center justify-center rounded-full bg-gradient-to-br from-[#60A5FA] via-[#A78BFA] to-[#F472B6] text-[10px] font-bold ring-2 ring-white/20 transition group-hover:ring-white/40">
          AI
        </span>
        <span className="flex flex-col items-start leading-tight">
          <span>Ask Copilot</span>
          <span className="text-[10px] font-normal text-white/70">Edit form with AI</span>
        </span>
      </button>
    </div>
  );
}
