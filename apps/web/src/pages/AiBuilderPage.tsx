import { useEffect, useId, useRef, useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import { api } from "../api/client";

type ChatMessage = {
  id: string;
  role: "user" | "assistant";
  content: string;
  formId?: string;
  formTitle?: string;
  fieldCount?: number;
};

const SUGGESTIONS = [
  "Contact form with name, email, and message",
  "Job application with resume URL and experience",
  "Event RSVP with meal preference and guest count",
  "Customer feedback with 1–5 rating and comments",
];

export function AiBuilderPage() {
  const inputId = useId();
  const bottomRef = useRef<HTMLDivElement>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "welcome",
      role: "assistant",
      content:
        "Describe the form you need. I’ll draft the fields and save it to your account so you can edit or publish.",
    },
  ]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, busy]);

  async function send(text: string) {
    const trimmed = text.trim();
    if (!trimmed || busy) return;

    setError(null);
    setInput("");
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

      const result = await api.aiCreateForm(trimmed, history.slice(0, -1));

      if (result.kind === "clarify") {
        setMessages((prev) => [
          ...prev,
          {
            id: crypto.randomUUID(),
            role: "assistant",
            content: result.reply,
          },
        ]);
      } else {
        setMessages((prev) => [
          ...prev,
          {
            id: crypto.randomUUID(),
            role: "assistant",
            content: result.reply,
            formId: result.form.id,
            formTitle: result.form.title,
            fieldCount: result.fieldCount,
          },
        ]);
      }
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

  return (
    <div className="mx-auto flex h-[calc(100vh-0px)] max-w-3xl flex-col px-4 py-6 sm:px-6">
      <header className="mb-5 shrink-0">
        <p className="text-xs font-semibold tracking-wide text-[#2563EB] uppercase">
          AI builder
        </p>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight text-[#0B1F44]">
          Create a form by chatting
        </h1>
        <p className="mt-1.5 text-sm text-[#64748B]">
          Drafts are saved to My Forms. You can refine fields in the editor before publishing.
        </p>
      </header>

      <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-2xl border border-[#E5E7EB] bg-white shadow-sm">
        <div className="flex-1 space-y-4 overflow-y-auto px-4 py-5 sm:px-5">
          {messages.map((m) => (
            <div
              key={m.id}
              className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed ${
                  m.role === "user"
                    ? "bg-[#2563EB] text-white"
                    : "bg-[#F8FAFC] text-[#0B1F44] ring-1 ring-[#E5E7EB]"
                }`}
              >
                <p className="whitespace-pre-wrap">{m.content}</p>
                {m.formId ? (
                  <div className="mt-3 rounded-xl border border-[#BFDBFE] bg-[#EFF6FF] p-3 text-[#0B1F44]">
                    <p className="text-xs font-medium text-[#1D4ED8]">Draft ready</p>
                    <p className="mt-0.5 font-medium">{m.formTitle}</p>
                    {m.fieldCount != null ? (
                      <p className="text-xs text-[#64748B]">{m.fieldCount} fields</p>
                    ) : null}
                    <Link
                      to={`/forms/${m.formId}`}
                      className="mt-2 inline-flex text-sm font-medium text-[#2563EB] no-underline hover:underline"
                    >
                      Open in editor →
                    </Link>
                  </div>
                ) : null}
              </div>
            </div>
          ))}
          {busy ? (
            <p className="text-sm text-[#94A3B8]" aria-live="polite">
              Thinking…
            </p>
          ) : null}
          <div ref={bottomRef} />
        </div>

        {messages.length <= 1 ? (
          <div className="flex flex-wrap gap-2 border-t border-[#E5E7EB] px-4 py-3 sm:px-5">
            {SUGGESTIONS.map((s) => (
              <button
                key={s}
                type="button"
                disabled={busy}
                onClick={() => void send(s)}
                className="rounded-full border border-[#E5E7EB] bg-white px-3 py-1.5 text-left text-xs text-[#64748B] hover:border-[#2563EB]/40 hover:text-[#0B1F44] disabled:opacity-50"
              >
                {s}
              </button>
            ))}
          </div>
        ) : null}

        <form
          onSubmit={onSubmit}
          className="border-t border-[#E5E7EB] bg-[#F8FAFC] px-4 py-3 sm:px-5"
        >
          {error ? <p className="mb-2 text-sm text-[#DC2626]">{error}</p> : null}
          <label className="sr-only" htmlFor={inputId}>
            Message
          </label>
          <div className="flex gap-2">
            <input
              id={inputId}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              disabled={busy}
              placeholder="e.g. Newsletter signup with name and email…"
              className="min-w-0 flex-1 rounded-xl border border-[#E5E7EB] bg-white px-3.5 py-2.5 text-sm text-[#0B1F44] outline-none focus:border-[#2563EB] focus:ring-2 focus:ring-[#2563EB]/20 disabled:opacity-60"
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
    </div>
  );
}
