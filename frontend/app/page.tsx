"use client";

import { useEffect, useRef, useState } from "react";
import AuthForm from "@/components/AuthForm";
import DocumentChat from "@/components/DocumentChat";
import DocumentsPanel from "@/components/DocumentsPanel";
import GenericPreview from "@/components/GenericPreview";
import NdaPreview from "@/components/NdaPreview";
import {
  api,
  ChatMessage,
  DocumentSummary,
  DocumentType,
  mapToFields,
  User,
} from "@/lib/api";
import { ndaDataFromFields } from "@/lib/documentFields";

const NDA_ID = "mutual-nda";

export default function Home() {
  const [user, setUser] = useState<User | null>(null);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    api
      .me()
      .then(setUser)
      .catch(() => setUser(null))
      .finally(() => setChecking(false));
  }, []);

  if (checking) {
    return (
      <div className="flex min-h-dvh items-center justify-center text-sm text-ink/50">
        <span className="font-display text-lg italic text-brand-navy">Prelegal</span>
      </div>
    );
  }

  if (!user) return <AuthForm onAuthed={setUser} />;

  return <CreatorApp user={user} onSignedOut={() => setUser(null)} />;
}

type SaveState = "idle" | "saving" | "saved" | "error";

/** Build a readable document title from its type and first filled-in field. */
function makeTitle(doc: DocumentType, fields: Record<string, string>): string {
  const first = doc.fields.map((f) => fields[f.key]).find((v) => v?.trim());
  return first ? `${doc.name} — ${first.trim()}` : doc.name;
}

function CreatorApp({ user, onSignedOut }: { user: User; onSignedOut: () => void }) {
  const [catalog, setCatalog] = useState<DocumentType[]>([]);
  const [documents, setDocuments] = useState<DocumentSummary[]>([]);
  const [currentId, setCurrentId] = useState<number | null>(null);
  const [documentType, setDocumentType] = useState("");
  const [fields, setFields] = useState<Record<string, string>>({});
  const [complete, setComplete] = useState(false);
  const [transcript, setTranscript] = useState<ChatMessage[]>([]);
  const [notes, setNotes] = useState("");
  const [chatKey, setChatKey] = useState(0);
  const [saveState, setSaveState] = useState<SaveState>("idle");
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // A ref mirrors currentId so back-to-back saves target the same row instead
  // of creating duplicates before the state update lands.
  const currentIdRef = useRef<number | null>(null);
  const setCurrent = (id: number | null) => {
    currentIdRef.current = id;
    setCurrentId(id);
  };

  useEffect(() => {
    api.catalog().then(setCatalog).catch(() => setError("Could not load document types."));
    api.documents.list().then(setDocuments).catch(() => {});
  }, []);

  const doc = catalog.find((d) => d.id === documentType);

  function resetToNew() {
    setCurrent(null);
    setDocumentType("");
    setFields({});
    setComplete(false);
    setTranscript([]);
    setNotes("");
    setSaveState("idle");
    setChatKey((k) => k + 1);
  }

  // Create-or-update the current draft. Used by both the per-turn autosave and
  // the explicit Save button, so notes edits (which don't trigger a chat turn)
  // still get persisted.
  async function persist(draft: {
    type: string;
    fields: Record<string, string>;
    complete: boolean;
    transcript: ChatMessage[];
    notes: string;
  }) {
    const spec = catalog.find((d) => d.id === draft.type);
    if (!draft.type || !spec) return; // Nothing worth saving until a type is chosen.

    const payload = {
      title: makeTitle(spec, draft.fields),
      documentType: draft.type,
      fields: mapToFields(draft.fields),
      transcript: draft.transcript,
      notes: draft.notes,
      complete: draft.complete,
    };
    setSaveState("saving");
    try {
      if (currentIdRef.current == null) {
        const created = await api.documents.create(payload);
        setCurrent(created.id);
      } else {
        await api.documents.update(currentIdRef.current, payload);
      }
      setDocuments(await api.documents.list());
      setSaveState("saved");
    } catch {
      setSaveState("error");
    }
  }

  async function handleResult(
    type: string,
    newFields: Record<string, string>,
    isComplete: boolean,
    messages: ChatMessage[],
  ) {
    setDocumentType(type);
    setFields(newFields);
    setComplete(isComplete);
    setTranscript(messages);
    await persist({ type, fields: newFields, complete: isComplete, transcript: messages, notes });
  }

  async function handleSave() {
    await persist({ type: documentType, fields, complete, transcript, notes });
  }

  async function handleLoad(id: number) {
    if (id === currentIdRef.current) return;
    try {
      const saved = await api.documents.get(id);
      setCurrent(saved.id);
      setDocumentType(saved.documentType);
      setFields(Object.fromEntries(saved.fields.map((f) => [f.key, f.value])));
      setComplete(saved.complete);
      setTranscript(saved.transcript);
      setNotes(saved.notes);
      setSaveState("saved");
      setChatKey((k) => k + 1); // Remount the chat with the restored transcript.
    } catch {
      setError("Could not open that document.");
    }
  }

  async function handleDelete(id: number) {
    try {
      await api.documents.remove(id);
      setDocuments((docs) => docs.filter((d) => d.id !== id));
      if (id === currentIdRef.current) resetToNew();
    } catch {
      setError("Could not delete that document.");
    }
  }

  async function handleSignOut() {
    try {
      await api.signout();
    } finally {
      onSignedOut();
    }
  }

  async function handleDownload() {
    if (!doc) return;
    setGenerating(true);
    setError(null);
    try {
      // PDF engines are loaded on demand so they never run during SSR.
      if (doc.id === NDA_ID) {
        const { generateNdaPdfBlob } = await import("@/lib/ndaPdf");
        const { ndaFileName } = await import("@/lib/nda");
        const data = ndaDataFromFields(fields);
        await downloadBlob(await generateNdaPdfBlob(data), `${ndaFileName(data)}.pdf`);
      } else {
        const { generateDocumentPdfBlob, documentFileName } = await import("@/lib/genericPdf");
        await downloadBlob(
          await generateDocumentPdfBlob(doc, fields),
          `${documentFileName(doc, fields)}.pdf`,
        );
      }
    } catch (err) {
      console.error(err);
      setError("Something went wrong generating the PDF. Please try again.");
    } finally {
      setGenerating(false);
    }
  }

  return (
    <div className="flex min-h-dvh flex-col text-ink lg:h-dvh">
      <header className="z-10 flex-none">
        {/* Letterhead: serif wordmark on ink, closed by a seal-gold rule. */}
        <div className="bg-brand-navy text-white">
          <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
            <div className="flex items-baseline gap-3">
              <h1 className="font-display text-2xl font-semibold tracking-tight text-white">
                Prelegal
              </h1>
              <span className="hidden text-[10px] font-medium uppercase tracking-[0.3em] text-seal sm:inline">
                Drafting desk
              </span>
            </div>
            <div className="flex items-center gap-3 sm:gap-4">
              <SaveIndicator state={saveState} />
              <button
                type="button"
                onClick={handleDownload}
                disabled={generating || !complete || !doc}
                title={complete ? "Download PDF" : "Available once all details are gathered"}
                className="inline-flex items-center gap-2 rounded-lg bg-brand-purple px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-brand-purple/90 focus:outline-none focus:ring-2 focus:ring-brand-purple/50 disabled:cursor-not-allowed disabled:opacity-50"
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
                <div className="text-xs font-medium text-white/80">{user.email}</div>
                <button
                  type="button"
                  onClick={handleSignOut}
                  className="text-xs text-white/60 underline-offset-2 transition hover:text-white hover:underline"
                >
                  Sign out
                </button>
              </div>
            </div>
          </div>
          <div className="h-0.5 w-full bg-seal" />
        </div>
        {/* Standing notice — legally important, kept calm and readable. */}
        <div className="border-b border-paper-edge bg-paper px-4 py-2 text-center text-xs text-ink/70 sm:px-6">
          <span className="font-semibold text-brand-navy">Draft.</span>{" "}
          Not legal advice — have a qualified attorney review before use.
        </div>
        {error && (
          <div className="border-b border-red-200 bg-red-50 px-4 py-2 text-center text-xs text-red-700 sm:px-6">
            {error}
          </div>
        )}
      </header>

      <main className="mx-auto grid w-full max-w-7xl flex-1 grid-cols-1 gap-6 px-4 py-6 sm:px-6 lg:min-h-0 lg:grid-cols-[220px_minmax(0,420px)_1fr] lg:overflow-hidden">
        <section className="flex flex-col lg:min-h-0">
          <SectionLabel>My documents</SectionLabel>
          <div className="min-h-[16rem] lg:min-h-0 lg:flex-1">
            <DocumentsPanel
              documents={documents}
              currentId={currentId}
              onNew={resetToNew}
              onLoad={handleLoad}
              onDelete={handleDelete}
            />
          </div>
        </section>

        <section className="flex flex-col lg:min-h-0">
          <SectionLabel>Assistant</SectionLabel>
          <div className="min-h-[24rem] lg:min-h-0 lg:flex-1">
            <DocumentChat
              key={chatKey}
              documentType={documentType}
              fields={fields}
              initialMessages={transcript}
              onResult={handleResult}
            />
          </div>
          <div className="mt-3 flex-none rounded-2xl border border-paper-edge bg-paper p-3 shadow-sm">
            <div className="mb-2 flex items-center justify-between">
              <label htmlFor="doc-notes" className="text-xs font-semibold uppercase tracking-[0.15em] text-ink/45">
                Notes
              </label>
              <button
                type="button"
                onClick={handleSave}
                disabled={!documentType || saveState === "saving"}
                className="rounded-lg bg-brand-purple px-3 py-1.5 text-xs font-semibold text-white shadow-sm transition hover:bg-brand-purple/90 focus:outline-none focus:ring-2 focus:ring-brand-purple/40 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {saveState === "saving" ? "Saving…" : "Save"}
              </button>
            </div>
            <textarea
              id="doc-notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Private notes for this document — reminders, review items, who to follow up with…"
              rows={3}
              className="block w-full resize-y rounded-lg border border-paper-edge bg-white px-3 py-2 text-sm text-ink shadow-sm outline-none transition focus:border-brand-blue focus:ring-2 focus:ring-brand-blue/25"
            />
          </div>
        </section>

        <section className="flex flex-col lg:min-h-0">
          <SectionLabel>Live preview</SectionLabel>
          <div className="rounded-2xl border border-paper-edge bg-paper shadow-sm lg:min-h-0 lg:flex-1 lg:overflow-y-auto">
            {doc ? (
              doc.id === NDA_ID ? (
                <NdaPreview data={ndaDataFromFields(fields)} />
              ) : (
                <GenericPreview doc={doc} fields={fields} />
              )
            ) : (
              <div className="flex h-full flex-col items-center justify-center gap-3 p-10 text-center">
                <SheetIcon />
                <p className="max-w-xs text-sm text-ink/45">
                  Tell the assistant which document you&apos;d like and a live draft
                  appears here.
                </p>
              </div>
            )}
          </div>
        </section>
      </main>

      <footer className="mx-auto max-w-7xl flex-none px-4 pb-4 pt-2 text-center text-xs text-ink/40 sm:px-6">
        Based on Common Paper templates, free to use under{" "}
        <a
          href="https://creativecommons.org/licenses/by/4.0/"
          className="text-brand-blue underline-offset-2 hover:underline"
          target="_blank"
          rel="noopener noreferrer"
        >
          CC BY 4.0
        </a>
        . A prototype — not legal advice.
      </footer>
    </div>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="mb-3 flex flex-none items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-ink/45">
      <span className="h-px w-4 bg-seal" />
      {children}
    </h2>
  );
}

function SheetIcon() {
  return (
    <svg
      width="34"
      height="34"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className="text-ink/25"
    >
      <path d="M14 3v4a1 1 0 0 0 1 1h4" />
      <path d="M17 21H7a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h7l5 5v11a2 2 0 0 1-2 2z" />
      <line x1="9" y1="13" x2="15" y2="13" />
      <line x1="9" y1="17" x2="13" y2="17" />
    </svg>
  );
}

function SaveIndicator({ state }: { state: SaveState }) {
  if (state === "idle") return null;
  const label =
    state === "saving" ? "Saving…" : state === "saved" ? "Saved" : "Not saved";
  const color = state === "error" ? "text-red-300" : "text-white/60";
  return <span className={`hidden text-xs sm:block ${color}`}>{label}</span>;
}

async function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
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
