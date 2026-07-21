import { DocumentType } from "@/lib/api";

/**
 * Cover-page style preview for any document type: title, description, and the
 * gathered field values. Used for every document except the Mutual NDA, which
 * has its own rich preview.
 */
export default function GenericPreview({
  doc,
  fields,
}: {
  doc: DocumentType;
  fields: Record<string, string>;
}) {
  return (
    <article className="mx-auto max-w-2xl bg-white px-8 py-10 font-serif text-[15px] leading-relaxed text-slate-800 sm:px-12">
      <header className="mb-8 border-b border-slate-200 pb-6">
        <h1 className="text-2xl font-bold tracking-tight text-brand-navy">{doc.name}</h1>
        <p className="mt-2 text-sm text-slate-500">{doc.description}</p>
      </header>

      <dl className="space-y-4">
        {doc.fields.map((spec) => {
          const value = (fields[spec.key] ?? "").trim();
          return (
            <div key={spec.key}>
              <dt className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                {spec.label}
              </dt>
              <dd className="mt-1 whitespace-pre-wrap text-slate-800">
                {value || (
                  <span className="italic text-slate-400">Not provided yet</span>
                )}
              </dd>
            </div>
          );
        })}
      </dl>

      <footer className="mt-10 border-t border-slate-200 pt-4 text-xs text-slate-400">
        Based on the Common Paper {doc.name} template, free to use under CC BY 4.0.
        This tool is a prototype and does not constitute legal advice.
      </footer>
    </article>
  );
}
