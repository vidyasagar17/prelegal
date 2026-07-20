"use client";

import { useEffect, useState } from "react";
import AuthForm from "@/components/AuthForm";
import NdaChat from "@/components/NdaChat";
import NdaPreview from "@/components/NdaPreview";
import { api, User } from "@/lib/api";
import { defaultNdaData, ndaFileName, NdaData } from "@/lib/nda";

export default function Home() {
  const [user, setUser] = useState<User | null>(null);
  const [checking, setChecking] = useState(true);

  // Check for an existing session on load.
  useEffect(() => {
    api
      .me()
      .then(setUser)
      .catch(() => setUser(null))
      .finally(() => setChecking(false));
  }, []);

  if (checking) {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-slate-100 text-sm text-slate-500">
        Loading…
      </div>
    );
  }

  if (!user) return <AuthForm onAuthed={setUser} />;

  return <CreatorApp user={user} onSignedOut={() => setUser(null)} />;
}

function CreatorApp({ user, onSignedOut }: { user: User; onSignedOut: () => void }) {
  const [data, setData] = useState<NdaData>(defaultNdaData);
  const [complete, setComplete] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSignOut() {
    try {
      await api.signout();
    } finally {
      onSignedOut();
    }
  }

  async function handleDownload() {
    setGenerating(true);
    setError(null);
    try {
      // Loaded on demand so the PDF engine never runs during SSR.
      const { generateNdaPdfBlob } = await import("@/lib/ndaPdf");
      const blob = await generateNdaPdfBlob(data);
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${ndaFileName(data)}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error(err);
      setError("Something went wrong generating the PDF. Please try again.");
    } finally {
      setGenerating(false);
    }
  }

  return (
    <div className="flex min-h-dvh flex-col bg-slate-100 text-slate-900 lg:h-dvh">
      <header className="z-10 flex-none border-b border-slate-200 bg-white/90 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
          <div>
            <h1 className="text-base font-semibold tracking-tight text-brand-navy sm:text-lg">
              Mutual NDA Creator
            </h1>
            <p className="hidden text-xs text-slate-500 sm:block">
              Chat with the assistant to fill in your agreement, then download it as a PDF.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={handleDownload}
              disabled={generating || !complete}
              title={complete ? "Download PDF" : "Available once all details are gathered"}
              className="inline-flex items-center gap-2 rounded-lg bg-brand-purple px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-brand-purple/90 focus:outline-none focus:ring-2 focus:ring-brand-purple/40 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {generating ? (
                <>
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                  Generating…
                </>
              ) : (
                <>
                  <DownloadIcon />
                  Download PDF
                </>
              )}
            </button>
            <div className="hidden text-right sm:block">
              <div className="text-xs font-medium text-slate-700">{user.email}</div>
              <button
                type="button"
                onClick={handleSignOut}
                className="text-xs text-brand-blue hover:underline"
              >
                Sign out
              </button>
            </div>
          </div>
        </div>
        {error && (
          <div className="border-t border-red-200 bg-red-50 px-4 py-2 text-center text-xs text-red-700 sm:px-6">
            {error}
          </div>
        )}
      </header>

      <main className="mx-auto grid w-full max-w-7xl flex-1 grid-cols-1 gap-6 px-4 py-6 sm:px-6 lg:min-h-0 lg:grid-cols-[minmax(0,440px)_1fr] lg:overflow-hidden">
        <section className="flex flex-col lg:min-h-0">
          <h2 className="mb-3 flex-none text-sm font-semibold uppercase tracking-wider text-slate-500">
            Assistant
          </h2>
          <div className="min-h-[24rem] lg:min-h-0 lg:flex-1">
            <NdaChat
              fields={data}
              onExtract={(fields, isComplete) => {
                setData(fields);
                setComplete(isComplete);
              }}
            />
          </div>
        </section>

        <section className="flex flex-col lg:min-h-0">
          <h2 className="mb-3 flex-none text-sm font-semibold uppercase tracking-wider text-slate-500">
            Live preview
          </h2>
          <div className="rounded-2xl border border-slate-200 bg-white shadow-sm ring-1 ring-black/5 lg:min-h-0 lg:flex-1 lg:overflow-y-auto">
            <NdaPreview data={data} />
          </div>
        </section>
      </main>

      <footer className="mx-auto max-w-7xl flex-none px-4 pb-4 pt-2 text-center text-xs text-slate-400 sm:px-6">
        Based on the Common Paper Mutual NDA (Version 1.0), free to use under{" "}
        <a
          href="https://creativecommons.org/licenses/by/4.0/"
          className="underline hover:text-slate-600"
          target="_blank"
          rel="noopener noreferrer"
        >
          CC BY 4.0
        </a>
        . This tool is a prototype and does not constitute legal advice.
      </footer>
    </div>
  );
}

function DownloadIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <polyline points="7 10 12 15 17 10" />
      <line x1="12" y1="15" x2="12" y2="3" />
    </svg>
  );
}
