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
      <div className="flex min-h-dvh items-center justify-center bg-slate-100 text-sm text-slate-500">
        Loading…
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
    setSaveState("idle");
    setChatKey((k) => k + 1);
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

    const spec = catalog.find((d) => d.id === type);
    if (!type || !spec) return; // Nothing worth saving until a type is chosen.

    const payload = {
      title: makeTitle(spec, newFields),
      documentType: type,
      fields: mapToFields(newFields),
      transcript: messages,
      complete: isComplete,
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

  async function handleLoad(id: number) {
    if (id === currentIdRef.current) return;
    try {
      const saved = await api.documents.get(id);
      setCurrent(saved.id);
      setDocumentType(saved.documentType);
      setFields(Object.fromEntries(saved.fields.map((f) => [f.key, f.value])));
      setComplete(saved.complete);
      setTranscript(saved.transcript);
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
    <div className="flex min-h-dvh flex-col bg-slate-100 text-slate-900 lg:h-dvh">
      <header className="z-10 flex-none border-b border-slate-200 bg-white/90 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
          <div>
            <h1 className="text-base font-semibold tracking-tight text-brand-navy sm:text-lg">
              Prelegal
            </h1>
            <p className="hidden text-xs text-slate-500 sm:block">
              Chat with the assistant to draft your agreement, then download it as a PDF.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <SaveIndicator state={saveState} />
            <button
              type="button"
              onClick={handleDownload}
              disabled={generating || !complete || !doc}
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
        <div className="border-t border-amber-200 bg-amber-50 px-4 py-2 text-center text-xs text-amber-800 sm:px-6">
          Draft only. Documents generated here are not legal advice and should be
          reviewed by a qualified attorney before use.
        </div>
        {error && (
          <div className="border-t border-red-200 bg-red-50 px-4 py-2 text-center text-xs text-red-700 sm:px-6">
            {error}
          </div>
        )}
      </header>

      <main className="mx-auto grid w-full max-w-7xl flex-1 grid-cols-1 gap-6 px-4 py-6 sm:px-6 lg:min-h-0 lg:grid-cols-[220px_minmax(0,420px)_1fr] lg:overflow-hidden">
        <section className="flex flex-col lg:min-h-0">
          <h2 className="mb-3 flex-none text-sm font-semibold uppercase tracking-wider text-slate-500">
            My documents
          </h2>
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
          <h2 className="mb-3 flex-none text-sm font-semibold uppercase tracking-wider text-slate-500">
            Assistant
          </h2>
          <div className="min-h-[24rem] lg:min-h-0 lg:flex-1">
            <DocumentChat
              key={chatKey}
              documentType={documentType}
              fields={fields}
              initialMessages={transcript}
              onResult={handleResult}
            />
          </div>
        </section>

        <section className="flex flex-col lg:min-h-0">
          <h2 className="mb-3 flex-none text-sm font-semibold uppercase tracking-wider text-slate-500">
            Live preview
          </h2>
          <div className="rounded-2xl border border-slate-200 bg-white shadow-sm ring-1 ring-black/5 lg:min-h-0 lg:flex-1 lg:overflow-y-auto">
            {doc ? (
              doc.id === NDA_ID ? (
                <NdaPreview data={ndaDataFromFields(fields)} />
              ) : (
                <GenericPreview doc={doc} fields={fields} />
              )
            ) : (
              <div className="flex h-full items-center justify-center p-10 text-center text-sm text-slate-400">
                Tell the assistant which document you&apos;d like to create and it
                will appear here.
              </div>
            )}
          </div>
        </section>
      </main>

      <footer className="mx-auto max-w-7xl flex-none px-4 pb-4 pt-2 text-center text-xs text-slate-400 sm:px-6">
        Based on Common Paper templates, free to use under{" "}
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

function SaveIndicator({ state }: { state: SaveState }) {
  if (state === "idle") return null;
  const label =
    state === "saving" ? "Saving…" : state === "saved" ? "Saved" : "Not saved";
  const color =
    state === "error" ? "text-red-600" : "text-slate-400";
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
