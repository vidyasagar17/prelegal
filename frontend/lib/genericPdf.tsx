// Client-only: builds a downloadable PDF for any non-NDA document from its
// field spec and gathered values. Dynamically imported so the PDF engine never
// runs during SSR.

import { Document, Page, Text, View, StyleSheet, pdf } from "@react-pdf/renderer";
import { DocumentType } from "./api";

const styles = StyleSheet.create({
  page: {
    paddingTop: 54,
    paddingBottom: 60,
    paddingHorizontal: 56,
    fontFamily: "Times-Roman",
    fontSize: 11,
    lineHeight: 1.5,
    color: "#1e293b",
  },
  title: { fontSize: 20, fontFamily: "Times-Bold", color: "#0f172a" },
  subtitle: { fontSize: 9, color: "#64748b", marginTop: 4 },
  rule: { borderBottomWidth: 1, borderBottomColor: "#e2e8f0", marginVertical: 14 },
  label: {
    fontSize: 8,
    fontFamily: "Times-Bold",
    color: "#64748b",
    letterSpacing: 1,
    textTransform: "uppercase",
    marginBottom: 2,
  },
  value: { marginBottom: 12 },
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

function DocumentPdf({
  doc,
  fields,
}: {
  doc: DocumentType;
  fields: Record<string, string>;
}) {
  return (
    <Document title={doc.name} author="Prelegal" subject={doc.name}>
      <Page size="LETTER" style={styles.page}>
        <Text style={styles.title}>{doc.name}</Text>
        <Text style={styles.subtitle}>{doc.description}</Text>
        <View style={styles.rule} />
        {doc.fields.map((spec) => (
          <View key={spec.key}>
            <Text style={styles.label}>{spec.label}</Text>
            <Text style={styles.value}>{(fields[spec.key] ?? "").trim() || "—"}</Text>
          </View>
        ))}
        <Text style={styles.footer} fixed>
          Based on the Common Paper {doc.name} template, free to use under CC BY 4.0.
        </Text>
      </Page>
    </Document>
  );
}

export async function generateDocumentPdfBlob(
  doc: DocumentType,
  fields: Record<string, string>,
): Promise<Blob> {
  return pdf(<DocumentPdf doc={doc} fields={fields} />).toBlob();
}

export function documentFileName(doc: DocumentType, fields: Record<string, string>): string {
  const slug = (s: string) =>
    s.trim().replace(/[^\w\s-]/g, "").replace(/\s+/g, "-").slice(0, 40);
  const firstValue = doc.fields.map((f) => fields[f.key]).find((v) => v?.trim());
  const who = firstValue ? `-${slug(firstValue)}` : "";
  return `${slug(doc.name)}${who}`;
}
