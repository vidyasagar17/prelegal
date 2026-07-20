"use client";

import { useEffect, useRef, useState } from "react";
import { api, ApiError, ChatMessage } from "@/lib/api";
import { NdaData } from "@/lib/nda";

interface Props {
  fields: NdaData;
  onExtract: (fields: NdaData, complete: boolean) => void;
}

/**
 * Freeform chat that gathers the NDA details. Each turn sends the transcript
 * plus the current fields to the backend and lifts the model's extracted
 * fields back up so the live preview stays in sync.
 */
export default function NdaChat({ fields, onExtract }: Props) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const inputRef = useRef<HTMLInputElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  // Fetch the opening message once.
  useEffect(() => {
    api
      .greeting()
      .then((g) => setMessages([{ role: "assistant", content: g.message }]))
      .catch(() => setError("Could not start the chat. Please refresh."));
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
      const result = await api.chat(next, fields);
      setMessages([...next, { role: "assistant", content: result.reply }]);
      onExtract(result.fields, result.complete);
    } catch (err) {
      setError(
        err instanceof ApiError ? err.message : "Something went wrong. Please try again.",
      );
    } finally {
      setBusy(false);
      inputRef.current?.focus();
    }
  }

  return (
    <div className="flex h-full min-h-0 flex-col rounded-2xl border border-slate-200 bg-white shadow-sm">
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

      <form onSubmit={send} className="flex gap-2 border-t border-slate-200 p-3">
        <input
          ref={inputRef}
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Type your answer…"
          className="min-w-0 flex-1 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm outline-none transition focus:border-brand-blue focus:ring-2 focus:ring-brand-blue/30"
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
            ? "bg-brand-blue text-white"
            : "bg-slate-100 text-slate-800")
        }
      >
        {content}
      </div>
    </div>
  );
}
