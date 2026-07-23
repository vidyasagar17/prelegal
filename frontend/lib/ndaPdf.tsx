// Client-only: builds a downloadable PDF of the completed Mutual NDA using
// @react-pdf/renderer (produces real, selectable-text PDFs). This module is
// dynamically imported in the browser so it never runs during SSR.

import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  pdf,
} from "@react-pdf/renderer";
import {
  NdaData,
  Party,
  confidentialityTermText,
  formatEffectiveDate,
  governingLawText,
  jurisdictionText,
  mndaTermText,
  standardTerms,
} from "./nda";

const styles = StyleSheet.create({
  page: {
    paddingTop: 54,
    paddingBottom: 60,
    paddingHorizontal: 56,
    fontFamily: "Times-Roman",
    fontSize: 10.5,
    lineHeight: 1.5,
    color: "#1e293b",
  },
  title: { fontSize: 20, fontFamily: "Times-Bold", color: "#0f172a" },
  subtitle: { fontSize: 9, color: "#64748b", marginTop: 4 },
  rule: { borderBottomWidth: 1, borderBottomColor: "#e2e8f0", marginVertical: 14 },
  fieldLabel: {
    fontSize: 8,
    fontFamily: "Times-Bold",
    color: "#64748b",
    letterSpacing: 1,
    textTransform: "uppercase",
    marginBottom: 2,
  },
  fieldValue: { marginBottom: 12 },
  intro: { fontSize: 10, color: "#475569", marginBottom: 6 },
  partyRow: { flexDirection: "row", gap: 28, marginTop: 6 },
  partyCol: { flex: 1 },
  partyHeading: {
    fontSize: 8,
    fontFamily: "Times-Bold",
    color: "#64748b",
    letterSpacing: 1,
    textTransform: "uppercase",
    marginBottom: 6,
  },
  sigRow: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: "#e2e8f0",
    paddingVertical: 3,
  },
  sigKey: { width: 74, color: "#64748b", fontSize: 9 },
  sigVal: { flex: 1, fontSize: 9, color: "#1e293b" },
  sigBlank: { color: "#cbd5e1" },
  sectionHeading: {
    fontSize: 14,
    fontFamily: "Times-Bold",
    color: "#0f172a",
    marginBottom: 2,
  },
  sectionSub: { fontSize: 8, color: "#64748b", marginBottom: 10 },
  term: { marginBottom: 8, textAlign: "justify" },
  termTitle: { fontFamily: "Times-Bold", color: "#0f172a" },
  footer: {
    position: "absolute",
    bottom: 28,
    left: 56,
    right: 56,
    fontSize: 7.5,
    color: "#94a3b8",
    borderTopWidth: 1,
    borderTopColor: "#e2e8f0",
    paddingTop: 6,
  },
});

function Field({ label, value }: { label: string; value: string }) {
  return (
    <View>
      <Text style={styles.fieldLabel}>{label}</Text>
      <Text style={styles.fieldValue}>{value}</Text>
    </View>
  );
}

function SigColumn({ label, party }: { label: string; party: Party }) {
  const rows: { k: string; v: string; blank?: boolean }[] = [
    { k: "Signature", v: "", blank: true },
    { k: "Print Name", v: party.signerName || "—" },
    { k: "Title", v: party.signerTitle || "—" },
    { k: "Company", v: party.company || "—" },
    { k: "Notice Address", v: party.noticeAddress || "—" },
    { k: "Date", v: "", blank: true },
  ];
  return (
    <View style={styles.partyCol}>
      <Text style={styles.partyHeading}>{label}</Text>
      {rows.map((r) => (
        <View style={styles.sigRow} key={r.k}>
          <Text style={styles.sigKey}>{r.k}</Text>
          <Text style={r.blank ? [styles.sigVal, styles.sigBlank] : styles.sigVal}>
            {r.blank ? "____________" : r.v}
          </Text>
        </View>
      ))}
    </View>
  );
}

function NdaDocument({ data }: { data: NdaData }) {
  const terms = standardTerms(data);
  return (
    <Document
      title="Mutual Non-Disclosure Agreement"
      author="Prelegal"
      subject="Common Paper Mutual NDA"
    >
      <Page size="LETTER" style={styles.page}>
        <Text style={styles.title}>Mutual Non-Disclosure Agreement</Text>
        <Text style={styles.subtitle}>
          Cover Page — incorporating the Common Paper Mutual NDA Standard Terms
          (Version 1.0)
        </Text>
        <View style={styles.rule} />

        <Field label="Purpose" value={data.purpose || "—"} />
        <Field label="Effective Date" value={formatEffectiveDate(data.effectiveDate)} />
        <Field label="MNDA Term" value={mndaTermText(data)} />
        <Field label="Term of Confidentiality" value={confidentialityTermText(data)} />
        <View>
          <Text style={styles.fieldLabel}>Governing Law &amp; Jurisdiction</Text>
          <Text>Governing Law: {governingLawText(data)}</Text>
          <Text style={styles.fieldValue}>Jurisdiction: {jurisdictionText(data)}</Text>
        </View>
        {data.modifications.trim() ? (
          <Field label="MNDA Modifications" value={data.modifications} />
        ) : null}

        <Text style={styles.intro}>
          By signing this Cover Page, each party agrees to enter into this MNDA
          as of the Effective Date.
        </Text>
        <View style={styles.partyRow}>
          <SigColumn label="Party 1" party={data.party1} />
          <SigColumn label="Party 2" party={data.party2} />
        </View>

        {/* Standard Terms begin on their own page (page 2). */}
        <View break>
          <Text style={styles.sectionHeading}>Standard Terms</Text>
          <Text style={styles.sectionSub}>
            Common Paper Mutual NDA Standard Terms, Version 1.0
          </Text>
          {terms.map((t) => (
            <Text style={styles.term} key={t.n}>
              <Text style={styles.termTitle}>
                {t.n}. {t.title}.{" "}
              </Text>
              {t.body}
            </Text>
          ))}
        </View>

        <Text style={styles.footer} fixed>
          DRAFT — not legal advice. Review by a qualified attorney before use.
          Common Paper Mutual Non-Disclosure Agreement (Version 1.0), free to use
          under CC BY 4.0. Governed by the laws of {governingLawText(data)};
          courts located in {jurisdictionText(data)}.
        </Text>
      </Page>
    </Document>
  );
}

/** Renders the NDA to a PDF Blob in the browser. */
export async function generateNdaPdfBlob(data: NdaData): Promise<Blob> {
  return pdf(<NdaDocument data={data} />).toBlob();
}
