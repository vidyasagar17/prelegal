"use client";

import { useState } from "react";
import { api, ApiError, User } from "@/lib/api";

/** Sign in / sign up card shown until the user has a session. */
export default function AuthForm({ onAuthed }: { onAuthed: (user: User) => void }) {
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const isSignup = mode === "signup";

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const user = isSignup
        ? await api.signup(email, password)
        : await api.signin(email, password);
      onAuthed(user);
    } catch (err) {
      setError(
        err instanceof ApiError ? err.message : "Something went wrong. Please try again.",
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex min-h-dvh items-center justify-center px-4 py-10">
      <div className="w-full max-w-sm overflow-hidden rounded-2xl border border-paper-edge bg-paper shadow-[0_1px_2px_rgba(3,33,71,0.04),0_12px_40px_-12px_rgba(3,33,71,0.25)]">
        {/* Engraved letterhead: serif wordmark over a fine seal-gold rule. */}
        <div className="px-8 pt-8">
          <span className="text-[11px] font-medium uppercase tracking-[0.35em] text-brand-blue">
            Est. drafting desk
          </span>
          <h1 className="font-display mt-2 text-4xl font-semibold tracking-tight text-brand-navy">
            Prelegal
          </h1>
          <div className="mt-3 h-px w-16 bg-seal" />
          <p className="font-display mt-4 text-base italic text-ink/70">
            {isSignup
              ? "Open an account to start drafting."
              : "Sign in to return to your drafts."}
          </p>
        </div>

        <form className="space-y-4 px-8 pb-8 pt-6" onSubmit={handleSubmit}>
          <label className="block">
            <span className="block text-xs font-semibold uppercase tracking-wider text-ink/60">
              Email
            </span>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1.5 block w-full rounded-lg border border-paper-edge bg-white px-3 py-2 text-sm text-ink shadow-sm outline-none transition focus:border-brand-blue focus:ring-2 focus:ring-brand-blue/25"
              placeholder="you@company.com"
            />
          </label>
          <label className="block">
            <span className="block text-xs font-semibold uppercase tracking-wider text-ink/60">
              Password
            </span>
            <input
              type="password"
              required
              minLength={8}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1.5 block w-full rounded-lg border border-paper-edge bg-white px-3 py-2 text-sm text-ink shadow-sm outline-none transition focus:border-brand-blue focus:ring-2 focus:ring-brand-blue/25"
              placeholder={isSignup ? "At least 8 characters" : "Your password"}
            />
          </label>

          {error && <p className="text-sm text-red-600">{error}</p>}

          <button
            type="submit"
            disabled={busy}
            className="w-full rounded-lg bg-brand-purple px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-brand-purple/90 focus:outline-none focus:ring-2 focus:ring-brand-purple/40 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {busy ? "Please wait…" : isSignup ? "Create account" : "Sign in"}
          </button>
        </form>

        <div className="border-t border-paper-edge bg-white/60 px-8 py-4 text-center text-sm text-ink/60">
          {isSignup ? "Already have an account?" : "Need an account?"}{" "}
          <button
            type="button"
            onClick={() => {
              setMode(isSignup ? "signin" : "signup");
              setError(null);
            }}
            className="font-semibold text-brand-blue hover:underline"
          >
            {isSignup ? "Sign in" : "Sign up"}
          </button>
        </div>
      </div>
    </div>
  );
}
