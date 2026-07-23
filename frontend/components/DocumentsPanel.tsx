"use client";

import { DocumentSummary } from "@/lib/api";

interface Props {
  documents: DocumentSummary[];
  currentId: number | null;
  onNew: () => void;
  onLoad: (id: number) => void;
  onDelete: (id: number) => void;
}

/** The My Documents list: start a new draft, reopen a saved one, or delete it. */
export default function DocumentsPanel({
  documents,
  currentId,
  onNew,
  onLoad,
  onDelete,
}: Props) {
  return (
    <div className="flex h-full min-h-0 flex-col rounded-2xl border border-paper-edge bg-paper shadow-sm">
      <div className="flex-none border-b border-paper-edge p-3">
        <button
          type="button"
          onClick={onNew}
          className="w-full rounded-lg bg-brand-blue px-3 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-brand-blue/90 focus:outline-none focus:ring-2 focus:ring-brand-blue/40"
        >
          + New document
        </button>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto p-2">
        {documents.length === 0 ? (
          <p className="p-4 text-center text-xs text-ink/40">
            Your saved documents will appear here as you chat.
          </p>
        ) : (
          <ul className="space-y-1">
            {documents.map((doc) => (
              <li key={doc.id}>
                <div
                  className={
                    "group flex items-center gap-2 rounded-lg px-3 py-2 text-sm transition " +
                    (doc.id === currentId
                      ? "bg-white ring-1 ring-brand-blue/40"
                      : "hover:bg-white/70")
                  }
                >
                  <button
                    type="button"
                    onClick={() => onLoad(doc.id)}
                    className="min-w-0 flex-1 text-left"
                  >
                    <span className="block truncate font-medium text-ink">
                      {doc.title}
                    </span>
                    <span className="mt-0.5 flex items-center gap-2 text-xs text-ink/40">
                      <span
                        className={
                          "inline-block rounded-full px-1.5 py-0.5 text-[10px] font-semibold " +
                          (doc.complete
                            ? "bg-emerald-100 text-emerald-700"
                            : "bg-amber-100 text-amber-700")
                        }
                      >
                        {doc.complete ? "Complete" : "Draft"}
                      </span>
                      {doc.updatedAt.slice(0, 10)}
                    </span>
                  </button>
                  <button
                    type="button"
                    onClick={() => onDelete(doc.id)}
                    title="Delete document"
                    aria-label={`Delete ${doc.title}`}
                    className="flex-none rounded p-1 text-ink/25 opacity-0 transition hover:bg-red-50 hover:text-red-600 focus:opacity-100 group-hover:opacity-100"
                  >
                    <TrashIcon />
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

function TrashIcon() {
  return (
    <svg
      width="15"
      height="15"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <polyline points="3 6 5 6 21 6" />
      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
    </svg>
  );
}
