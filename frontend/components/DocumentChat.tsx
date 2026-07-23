"use client";

import { useEffect, useRef, useState } from "react";
import { api, ApiError, ChatMessage, fieldsToMap, mapToFields } from "@/lib/api";

interface Props {
  documentType: string;
  fields: Record<string, string>;
  initialMessages?: ChatMessage[];
  onResult: (
    documentType: string,
    fields: Record<string, string>,
    complete: boolean,
    messages: ChatMessage[],
  ) => void | Promise<void>;
}

/**
 * Freeform chat that figures out which document the user wants and gathers its
 * fields. Each turn sends the transcript plus the current document type and
 * fields; the model's updated values and the transcript are lifted up so the
 * live preview stays in sync and the parent can persist the draft.
 *
 * When initialMessages is given (loading a saved document) the chat resumes
 * from that transcript instead of the greeting.
 */
export default function DocumentChat({
  documentType,
  fields,
  initialMessages,
  onResult,
}: Props) {
  const [messages, setMessages] = useState<ChatMessage[]>(initialMessages ?? []);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const inputRef = useRef<HTMLInputElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (initialMessages && initialMessages.length > 0) return;
    api
      .greeting()
      .then((g) => setMessages([{ role: "assistant", content: g.message }]))
      .catch(() => setError("Could not start the chat. Please refresh."));
    // Runs once on mount; a saved document is loaded by remounting with a key.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, busy]);

  async function send(e: React.FormEvent) {
    e.preventDefault();
    const text = input.trim();
    if (!text || busy) return;

    const next = [...messages, { role: "user" as const, content: text }];
    setMessages(next);
    setInput("");
    setBusy(true);
    setError(null);
    try {
      const result = await api.chat(next, documentType, mapToFields(fields));
      const withReply = [...next, { role: "assistant" as const, content: result.reply }];
      setMessages(withReply);
      // Awaited so the input stays disabled until the draft is persisted, which
      // keeps a fast follow-up from creating a duplicate saved document.
      await onResult(result.documentType, fieldsToMap(result.fields), result.complete, withReply);
    } catch (err) {
      setError(
        err instanceof ApiError ? err.message : "Something went wrong. Please try again.",
      );
    } finally {
      setBusy(false);
      // Return focus to the input so the user can keep typing.
      inputRef.current?.focus();
    }
  }

  return (
    <div className="flex h-full min-h-0 flex-col rounded-2xl border border-paper-edge bg-paper shadow-sm">
      <div className="min-h-0 flex-1 space-y-4 overflow-y-auto p-4">
        {messages.map((m, i) => (
          <Bubble key={i} role={m.role} content={m.content} />
        ))}
        {busy && <Bubble role="assistant" content="…" />}
        <div ref={bottomRef} />
      </div>

      {error && (
        <div className="border-t border-red-200 bg-red-50 px-4 py-2 text-xs text-red-700">
          {error}
        </div>
      )}

      <form onSubmit={send} className="flex gap-2 border-t border-paper-edge p-3">
        <input
          ref={inputRef}
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Type your answer…"
          className="min-w-0 flex-1 rounded-lg border border-paper-edge bg-white px-3 py-2 text-sm text-ink shadow-sm outline-none transition focus:border-brand-blue focus:ring-2 focus:ring-brand-blue/25"
        />
        <button
          type="submit"
          disabled={busy || !input.trim()}
          className="rounded-lg bg-brand-purple px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-brand-purple/90 focus:outline-none focus:ring-2 focus:ring-brand-purple/40 disabled:cursor-not-allowed disabled:opacity-60"
        >
          Send
        </button>
      </form>
    </div>
  );
}

function Bubble({ role, content }: { role: "user" | "assistant"; content: string }) {
  const isUser = role === "user";
  return (
    <div className={isUser ? "flex justify-end" : "flex justify-start"}>
      <div
        className={
          "max-w-[85%] whitespace-pre-wrap rounded-2xl px-4 py-2 text-sm " +
          (isUser
            ? "rounded-br-sm bg-brand-navy text-white"
            : "rounded-bl-sm border border-paper-edge bg-white text-ink")
        }
      >
        {content}
      </div>
    </div>
  );
}
