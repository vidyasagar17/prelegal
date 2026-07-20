// Data model, defaults, and content for the Common Paper Mutual NDA.
//
// The Mutual NDA is made up of two parts:
//   1. A Cover Page holding the deal-specific values a user fills in.
//   2. The fixed "Standard Terms Version 1.0" legal text (Section 9 of which
//      references the Governing Law / Jurisdiction chosen on the Cover Page).
//
// Source: https://github.com/CommonPaper/Mutual-NDA (CC BY 4.0)

export type MndaTermType = "expires" | "until_terminated";
export type ConfidentialityTermType = "years" | "perpetuity";

export interface Party {
  company: string;
  signerName: string;
  signerTitle: string;
  noticeAddress: string;
}

export interface NdaData {
  purpose: string;
  effectiveDate: string; // ISO yyyy-mm-dd
  mndaTermType: MndaTermType;
  mndaTermYears: number;
  confidentialityTermType: ConfidentialityTermType;
  confidentialityTermYears: number;
  governingLaw: string;
  jurisdiction: string;
  modifications: string;
  party1: Party;
  party2: Party;
}

const emptyParty = (): Party => ({
  company: "",
  signerName: "",
  signerTitle: "",
  noticeAddress: "",
});

/**
 * Today's date as yyyy-mm-dd in the user's LOCAL timezone. (Using
 * toISOString() would give the UTC date, which can be a day ahead/behind for
 * users in non-UTC timezones — wrong for an Effective Date.) Call on the
 * client to avoid hydration mismatch.
 */
export function todayIso(): string {
  const d = new Date();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${d.getFullYear()}-${mm}-${dd}`;
}

export function defaultNdaData(): NdaData {
  return {
    purpose:
      "Evaluating whether to enter into a business relationship with the other party.",
    // Left empty at first render; the client fills in today's date on mount so
    // server-prerendered HTML and client HTML match during hydration.
    effectiveDate: "",
    mndaTermType: "expires",
    mndaTermYears: 1,
    confidentialityTermType: "years",
    confidentialityTermYears: 1,
    governingLaw: "",
    jurisdiction: "",
    modifications: "",
    party1: emptyParty(),
    party2: emptyParty(),
  };
}

// ---- Derived / display helpers -------------------------------------------

const pluralYears = (n: number) => `${n} year${n === 1 ? "" : "s"}`;

/** Human-readable Effective Date, e.g. "July 11, 2026". Falls back gracefully. */
export function formatEffectiveDate(iso: string): string {
  if (!iso) return "[Effective Date]";
  const d = new Date(`${iso}T00:00:00`);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

export function mndaTermText(data: NdaData): string {
  return data.mndaTermType === "until_terminated"
    ? "Continues until terminated in accordance with the terms of the MNDA."
    : `Expires ${pluralYears(data.mndaTermYears)} from the Effective Date.`;
}

export function confidentialityTermText(data: NdaData): string {
  return data.confidentialityTermType === "perpetuity"
    ? "In perpetuity."
    : `${pluralYears(
        data.confidentialityTermYears,
      )} from the Effective Date, but in the case of trade secrets until the Confidential Information is no longer considered a trade secret under applicable laws.`;
}

export const governingLawText = (data: NdaData) =>
  data.governingLaw.trim() || "[Governing Law]";

export const jurisdictionText = (data: NdaData) =>
  data.jurisdiction.trim() || "[Jurisdiction]";

// ---- Standard Terms content ----------------------------------------------

export interface TermSection {
  n: number;
  title: string;
  body: string;
}

/**
 * The Common Paper Mutual NDA Standard Terms (Version 1.0). Section 9 is
 * interpolated with the Governing Law and Jurisdiction from the Cover Page so
 * the rendered document is internally consistent.
 */
export function standardTerms(data: NdaData): TermSection[] {
  const law = governingLawText(data);
  const jur = jurisdictionText(data);

  return [
    {
      n: 1,
      title: "Introduction",
      body: 'This Mutual Non-Disclosure Agreement (which incorporates these Standard Terms and the Cover Page (defined below)) ("MNDA") allows each party ("Disclosing Party") to disclose or make available information in connection with the Purpose which (1) the Disclosing Party identifies to the receiving party ("Receiving Party") as "confidential", "proprietary", or the like or (2) should be reasonably understood as confidential or proprietary due to its nature and the circumstances of its disclosure ("Confidential Information"). Each party\'s Confidential Information also includes the existence and status of the parties\' discussions and information on the Cover Page. Confidential Information includes technical or business information, product designs or roadmaps, requirements, pricing, security and compliance documentation, technology, inventions and know-how. To use this MNDA, the parties must complete and sign a cover page incorporating these Standard Terms ("Cover Page"). Each party is identified on the Cover Page and capitalized terms have the meanings given herein or on the Cover Page.',
    },
    {
      n: 2,
      title: "Use and Protection of Confidential Information",
      body: "The Receiving Party shall: (a) use Confidential Information solely for the Purpose; (b) not disclose Confidential Information to third parties without the Disclosing Party's prior written approval, except that the Receiving Party may disclose Confidential Information to its employees, agents, advisors, contractors and other representatives having a reasonable need to know for the Purpose, provided these representatives are bound by confidentiality obligations no less protective of the Disclosing Party than the applicable terms in this MNDA and the Receiving Party remains responsible for their compliance with this MNDA; and (c) protect Confidential Information using at least the same protections the Receiving Party uses for its own similar information but no less than a reasonable standard of care.",
    },
    {
      n: 3,
      title: "Exceptions",
      body: "The Receiving Party's obligations in this MNDA do not apply to information that it can demonstrate: (a) is or becomes publicly available through no fault of the Receiving Party; (b) it rightfully knew or possessed prior to receipt from the Disclosing Party without confidentiality restrictions; (c) it rightfully obtained from a third party without confidentiality restrictions; or (d) it independently developed without using or referencing the Confidential Information.",
    },
    {
      n: 4,
      title: "Disclosures Required by Law",
      body: "The Receiving Party may disclose Confidential Information to the extent required by law, regulation or regulatory authority, subpoena or court order, provided (to the extent legally permitted) it provides the Disclosing Party reasonable advance notice of the required disclosure and reasonably cooperates, at the Disclosing Party's expense, with the Disclosing Party's efforts to obtain confidential treatment for the Confidential Information.",
    },
    {
      n: 5,
      title: "Term and Termination",
      body: "This MNDA commences on the Effective Date and expires at the end of the MNDA Term. Either party may terminate this MNDA for any or no reason upon written notice to the other party. The Receiving Party's obligations relating to Confidential Information will survive for the Term of Confidentiality, despite any expiration or termination of this MNDA.",
    },
    {
      n: 6,
      title: "Return or Destruction of Confidential Information",
      body: "Upon expiration or termination of this MNDA or upon the Disclosing Party's earlier request, the Receiving Party will: (a) cease using Confidential Information; (b) promptly after the Disclosing Party's written request, destroy all Confidential Information in the Receiving Party's possession or control or return it to the Disclosing Party; and (c) if requested by the Disclosing Party, confirm its compliance with these obligations in writing. As an exception to subsection (b), the Receiving Party may retain Confidential Information in accordance with its standard backup or record retention policies or as required by law, but the terms of this MNDA will continue to apply to the retained Confidential Information.",
    },
    {
      n: 7,
      title: "Proprietary Rights",
      body: "The Disclosing Party retains all of its intellectual property and other rights in its Confidential Information and its disclosure to the Receiving Party grants no license under such rights.",
    },
    {
      n: 8,
      title: "Disclaimer",
      body: 'ALL CONFIDENTIAL INFORMATION IS PROVIDED "AS IS", WITH ALL FAULTS, AND WITHOUT WARRANTIES, INCLUDING THE IMPLIED WARRANTIES OF TITLE, MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE.',
    },
    {
      n: 9,
      title: "Governing Law and Jurisdiction",
      body: `This MNDA and all matters relating hereto are governed by, and construed in accordance with, the laws of the State of ${law}, without regard to the conflict of laws provisions of such ${law}. Any legal suit, action, or proceeding relating to this MNDA must be instituted in the federal or state courts located in ${jur}. Each party irrevocably submits to the exclusive jurisdiction of such ${jur} in any such suit, action, or proceeding.`,
    },
    {
      n: 10,
      title: "Equitable Relief",
      body: "A breach of this MNDA may cause irreparable harm for which monetary damages are an insufficient remedy. Upon a breach of this MNDA, the Disclosing Party is entitled to seek appropriate equitable relief, including an injunction, in addition to its other remedies.",
    },
    {
      n: 11,
      title: "General",
      body: "Neither party has an obligation under this MNDA to disclose Confidential Information to the other or proceed with any proposed transaction. Neither party may assign this MNDA without the prior written consent of the other party, except that either party may assign this MNDA in connection with a merger, reorganization, acquisition or other transfer of all or substantially all its assets or voting securities. Any assignment in violation of this Section is null and void. This MNDA will bind and inure to the benefit of each party's permitted successors and assigns. Waivers must be signed by the waiving party's authorized representative and cannot be implied from conduct. If any provision of this MNDA is held unenforceable, it will be limited to the minimum extent necessary so the rest of this MNDA remains in effect. This MNDA (including the Cover Page) constitutes the entire agreement of the parties with respect to its subject matter, and supersedes all prior and contemporaneous understandings, agreements, representations, and warranties, whether written or oral, regarding such subject matter. This MNDA may only be amended, modified, waived, or supplemented by an agreement in writing signed by both parties. Notices, requests and approvals under this MNDA must be sent in writing to the email or postal addresses on the Cover Page and are deemed delivered on receipt. This MNDA may be executed in counterparts, including electronic copies, each of which is deemed an original and which together form the same agreement.",
    },
  ];
}

/** Suggests a sensible download filename based on the parties. */
export function ndaFileName(data: NdaData): string {
  const slug = (s: string) =>
    s
      .trim()
      .replace(/[^\w\s-]/g, "")
      .replace(/\s+/g, "-")
      .slice(0, 40);
  const p1 = slug(data.party1.company);
  const p2 = slug(data.party2.company);
  if (p1 && p2) return `Mutual-NDA-${p1}-and-${p2}`;
  if (p1) return `Mutual-NDA-${p1}`;
  return "Mutual-NDA";
}
