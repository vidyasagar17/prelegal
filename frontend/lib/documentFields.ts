// Adapts the generic key/value fields gathered by the chat into the structured
// NdaData used by the rich Mutual NDA preview and PDF.

import { NdaData } from "./nda";

const num = (v: string | undefined, fallback: number): number => {
  const n = parseInt(v ?? "", 10);
  return Number.isFinite(n) && n > 0 ? n : fallback;
};

export function ndaDataFromFields(f: Record<string, string>): NdaData {
  return {
    purpose: f.purpose ?? "",
    effectiveDate: f.effectiveDate ?? "",
    mndaTermType: f.mndaTermType === "until_terminated" ? "until_terminated" : "expires",
    mndaTermYears: num(f.mndaTermYears, 1),
    confidentialityTermType:
      f.confidentialityTermType === "perpetuity" ? "perpetuity" : "years",
    confidentialityTermYears: num(f.confidentialityTermYears, 1),
    governingLaw: f.governingLaw ?? "",
    jurisdiction: f.jurisdiction ?? "",
    modifications: f.modifications ?? "",
    party1: {
      company: f.party1Company ?? "",
      signerName: f.party1SignerName ?? "",
      signerTitle: f.party1SignerTitle ?? "",
      noticeAddress: f.party1NoticeAddress ?? "",
    },
    party2: {
      company: f.party2Company ?? "",
      signerName: f.party2SignerName ?? "",
      signerTitle: f.party2SignerTitle ?? "",
      noticeAddress: f.party2NoticeAddress ?? "",
    },
  };
}
