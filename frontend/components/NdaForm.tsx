"use client";

import { NdaData, Party } from "@/lib/nda";

interface Props {
  data: NdaData;
  onChange: (data: NdaData) => void;
}

const labelCls = "block text-sm font-medium text-slate-700";
const inputCls =
  "mt-1 block w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm outline-none transition focus:border-brand-blue focus:ring-2 focus:ring-brand-blue/30 placeholder:text-slate-400";

function TextField({
  label,
  value,
  onChange,
  placeholder,
  type = "text",
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  type?: string;
}) {
  return (
    <label className="block">
      <span className={labelCls}>{label}</span>
      <input
        type={type}
        className={inputCls}
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
      />
    </label>
  );
}

function Section({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <h3 className="text-sm font-semibold text-brand-navy">{title}</h3>
      {description && (
        <p className="mt-1 text-xs text-slate-500">{description}</p>
      )}
      <div className="mt-4 space-y-4">{children}</div>
    </div>
  );
}

function PartyFields({
  label,
  party,
  onChange,
}: {
  label: string;
  party: Party;
  onChange: (p: Party) => void;
}) {
  const set = (patch: Partial<Party>) => onChange({ ...party, ...patch });
  return (
    <div className="space-y-4">
      <div className="text-xs font-semibold uppercase tracking-wider text-slate-500">
        {label}
      </div>
      <TextField
        label="Company"
        value={party.company}
        onChange={(v) => set({ company: v })}
        placeholder="Acme, Inc."
      />
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <TextField
          label="Signer name"
          value={party.signerName}
          onChange={(v) => set({ signerName: v })}
          placeholder="Jane Doe"
        />
        <TextField
          label="Signer title"
          value={party.signerTitle}
          onChange={(v) => set({ signerTitle: v })}
          placeholder="CEO"
        />
      </div>
      <TextField
        label="Notice address"
        value={party.noticeAddress}
        onChange={(v) => set({ noticeAddress: v })}
        placeholder="legal@acme.com or a postal address"
      />
    </div>
  );
}

export default function NdaForm({ data, onChange }: Props) {
  const set = (patch: Partial<NdaData>) => onChange({ ...data, ...patch });

  return (
    <form className="space-y-6" onSubmit={(e) => e.preventDefault()}>
      <Section
        title="Agreement terms"
        description="The core terms of the Mutual NDA."
      >
        <label className="block">
          <span className={labelCls}>Purpose</span>
          <textarea
            className={`${inputCls} min-h-20 resize-y`}
            value={data.purpose}
            placeholder="How Confidential Information may be used"
            onChange={(e) => set({ purpose: e.target.value })}
          />
        </label>

        <TextField
          label="Effective date"
          type="date"
          value={data.effectiveDate}
          onChange={(v) => set({ effectiveDate: v })}
        />

        {/* MNDA Term */}
        <div>
          <span className={labelCls}>MNDA term</span>
          <div className="mt-2 space-y-2">
            <label className="flex items-center gap-2 text-sm text-slate-700">
              <input
                type="radio"
                name="mndaTerm"
                checked={data.mndaTermType === "expires"}
                onChange={() => set({ mndaTermType: "expires" })}
                className="accent-brand-blue"
              />
              Expires
              <input
                type="number"
                min={1}
                className="w-16 rounded-md border border-slate-300 px-2 py-1 text-sm disabled:bg-slate-100 disabled:text-slate-400"
                value={data.mndaTermYears || ""}
                disabled={data.mndaTermType !== "expires"}
                onChange={(e) =>
                  set({
                    mndaTermYears:
                      e.target.value === ""
                        ? 0
                        : Math.max(0, parseInt(e.target.value, 10) || 0),
                  })
                }
                onBlur={() =>
                  data.mndaTermYears < 1 && set({ mndaTermYears: 1 })
                }
              />
              year(s) from the Effective Date
            </label>
            <label className="flex items-center gap-2 text-sm text-slate-700">
              <input
                type="radio"
                name="mndaTerm"
                checked={data.mndaTermType === "until_terminated"}
                onChange={() => set({ mndaTermType: "until_terminated" })}
                className="accent-brand-blue"
              />
              Continues until terminated
            </label>
          </div>
        </div>

        {/* Term of Confidentiality */}
        <div>
          <span className={labelCls}>Term of confidentiality</span>
          <div className="mt-2 space-y-2">
            <label className="flex items-center gap-2 text-sm text-slate-700">
              <input
                type="radio"
                name="confTerm"
                checked={data.confidentialityTermType === "years"}
                onChange={() => set({ confidentialityTermType: "years" })}
                className="accent-brand-blue"
              />
              <input
                type="number"
                min={1}
                className="w-16 rounded-md border border-slate-300 px-2 py-1 text-sm disabled:bg-slate-100 disabled:text-slate-400"
                value={data.confidentialityTermYears || ""}
                disabled={data.confidentialityTermType !== "years"}
                onChange={(e) =>
                  set({
                    confidentialityTermYears:
                      e.target.value === ""
                        ? 0
                        : Math.max(0, parseInt(e.target.value, 10) || 0),
                  })
                }
                onBlur={() =>
                  data.confidentialityTermYears < 1 &&
                  set({ confidentialityTermYears: 1 })
                }
              />
              year(s) from the Effective Date
            </label>
            <label className="flex items-center gap-2 text-sm text-slate-700">
              <input
                type="radio"
                name="confTerm"
                checked={data.confidentialityTermType === "perpetuity"}
                onChange={() => set({ confidentialityTermType: "perpetuity" })}
                className="accent-brand-blue"
              />
              In perpetuity
            </label>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <TextField
            label="Governing law (state)"
            value={data.governingLaw}
            onChange={(v) => set({ governingLaw: v })}
            placeholder="Delaware"
          />
          <TextField
            label="Jurisdiction (city/county, state)"
            value={data.jurisdiction}
            onChange={(v) => set({ jurisdiction: v })}
            placeholder="New Castle, DE"
          />
        </div>

        <label className="block">
          <span className={labelCls}>
            Modifications{" "}
            <span className="font-normal text-slate-400">(optional)</span>
          </span>
          <textarea
            className={`${inputCls} min-h-16 resize-y`}
            value={data.modifications}
            placeholder="List any modifications to the Standard Terms"
            onChange={(e) => set({ modifications: e.target.value })}
          />
        </label>
      </Section>

      <Section
        title="Parties"
        description="Details for each party's signature block. Signatures and dates are left blank for signing."
      >
        <PartyFields
          label="Party 1"
          party={data.party1}
          onChange={(p) => set({ party1: p })}
        />
        <hr className="border-slate-200" />
        <PartyFields
          label="Party 2"
          party={data.party2}
          onChange={(p) => set({ party2: p })}
        />
      </Section>
    </form>
  );
}
