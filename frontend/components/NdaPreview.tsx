import {
  NdaData,
  confidentialityTermText,
  formatEffectiveDate,
  governingLawText,
  jurisdictionText,
  mndaTermText,
  standardTerms,
} from "@/lib/nda";

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="mb-4">
      <h3 className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
        {label}
      </h3>
      <div className="mt-1 text-slate-800">{children}</div>
    </div>
  );
}

/** A value that shows a muted placeholder when the user hasn't filled it in. */
function Value({ value, placeholder }: { value: string; placeholder: string }) {
  const v = value.trim();
  return v ? <>{v}</> : <span className="text-slate-400 italic">{placeholder}</span>;
}

function PartyColumn({ party, label }: { party: NdaData["party1"]; label: string }) {
  const rows: [string, string, string][] = [
    ["Signature", "", "—"],
    ["Print Name", party.signerName, "[Name]"],
    ["Title", party.signerTitle, "[Title]"],
    ["Company", party.company, "[Company]"],
    ["Notice Address", party.noticeAddress, "[Email or postal address]"],
    ["Date", "", "—"],
  ];
  return (
    <div className="flex-1">
      <div className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
        {label}
      </div>
      <dl className="space-y-1.5">
        {rows.map(([k, val, ph]) => (
          <div key={k} className="grid grid-cols-[110px_1fr] gap-2 border-b border-slate-200 pb-1.5 text-sm">
            <dt className="text-slate-500">{k}</dt>
            <dd className="text-slate-800">
              {k === "Signature" || k === "Date" ? (
                <span className="text-slate-300">________________</span>
              ) : (
                <Value value={val} placeholder={ph} />
              )}
            </dd>
          </div>
        ))}
      </dl>
    </div>
  );
}

/**
 * Renders the completed Mutual NDA (Cover Page + Standard Terms) as styled
 * HTML that reads like the printed document. This is the live preview; the
 * downloaded PDF mirrors this content.
 */
export default function NdaPreview({ data }: { data: NdaData }) {
  const terms = standardTerms(data);

  return (
    <article className="mx-auto max-w-2xl bg-white px-8 py-10 font-serif text-[15px] leading-relaxed text-slate-800 sm:px-12">
      {/* Cover Page */}
      <header className="mb-8 border-b border-slate-200 pb-6">
        <h1 className="text-2xl font-bold tracking-tight text-brand-navy">
          Mutual Non-Disclosure Agreement
        </h1>
        <p className="mt-2 text-sm text-slate-500">
          Cover Page — incorporating the Common Paper Mutual NDA Standard Terms
          (Version 1.0)
        </p>
      </header>

      <Field label="Purpose">
        <Value
          value={data.purpose}
          placeholder="How Confidential Information may be used"
        />
      </Field>

      <Field label="Effective Date">{formatEffectiveDate(data.effectiveDate)}</Field>

      <Field label="MNDA Term">{mndaTermText(data)}</Field>

      <Field label="Term of Confidentiality">{confidentialityTermText(data)}</Field>

      <Field label="Governing Law & Jurisdiction">
        <p>
          Governing Law:{" "}
          <Value value={data.governingLaw} placeholder="[Fill in state]" />
        </p>
        <p>
          Jurisdiction:{" "}
          <Value
            value={data.jurisdiction}
            placeholder="[Fill in city or county and state]"
          />
        </p>
      </Field>

      {data.modifications.trim() && (
        <Field label="MNDA Modifications">
          <p className="whitespace-pre-wrap">{data.modifications}</p>
        </Field>
      )}

      <p className="mt-6 text-sm text-slate-600">
        By signing this Cover Page, each party agrees to enter into this MNDA as
        of the Effective Date.
      </p>

      <div className="mt-5 flex flex-col gap-6 sm:flex-row sm:gap-10">
        <PartyColumn party={data.party1} label="Party 1" />
        <PartyColumn party={data.party2} label="Party 2" />
      </div>

      {/* Page divider — Standard Terms start on page 2 of the downloaded PDF. */}
      <div className="my-10 flex items-center gap-3" aria-hidden="true">
        <span className="h-px flex-1 bg-slate-200" />
        <span className="whitespace-nowrap text-[10px] font-semibold uppercase tracking-widest text-slate-400">
          Page 2 · Standard Terms
        </span>
        <span className="h-px flex-1 bg-slate-200" />
      </div>

      {/* Standard Terms */}
      <section>
        <h2 className="mb-1 text-lg font-bold text-brand-navy">Standard Terms</h2>
        <p className="mb-6 text-xs text-slate-500">
          Common Paper Mutual NDA Standard Terms, Version 1.0
        </p>
        <ol className="space-y-4">
          {terms.map((t) => (
            <li key={t.n} className="text-[14px] leading-relaxed">
              <span className="font-semibold text-slate-900">
                {t.n}. {t.title}.
              </span>{" "}
              <span>{t.body}</span>
            </li>
          ))}
        </ol>
      </section>

      <footer className="mt-10 border-t border-slate-200 pt-4 text-xs text-slate-400">
        Common Paper Mutual Non-Disclosure Agreement (Version 1.0), free to use
        under CC BY 4.0. Governed by the laws of {governingLawText(data)}; courts
        located in {jurisdictionText(data)}.
      </footer>
    </article>
  );
}
