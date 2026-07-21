"""Catalog of supported legal documents and the deal-specific fields each one
needs. This is the single source of truth shared with the frontend via
GET /api/catalog and given to the model so it knows what to ask about.

Field values are gathered as strings. The Mutual NDA is rendered with a rich,
dedicated preview on the frontend; the other documents use a generic preview
driven by these field labels.
"""

from pydantic import BaseModel


class FieldSpec(BaseModel):
    key: str
    label: str
    description: str


class DocumentType(BaseModel):
    id: str
    name: str
    description: str
    fields: list[FieldSpec]


def _f(key: str, label: str, description: str) -> FieldSpec:
    return FieldSpec(key=key, label=label, description=description)


# Common closing fields reused by several documents.
_GOVERNING_LAW = _f("governingLaw", "Governing Law", "US state whose law governs the agreement")
_JURISDICTION = _f("jurisdiction", "Jurisdiction", "city/county and state where disputes are handled")
_EFFECTIVE_DATE = _f("effectiveDate", "Effective Date", "the effective date as ISO yyyy-mm-dd")


DOCUMENTS: list[DocumentType] = [
    DocumentType(
        id="mutual-nda",
        name="Mutual NDA",
        description="Mutual Non-Disclosure Agreement protecting confidential information exchanged between two parties.",
        fields=[
            _f("purpose", "Purpose", "how the confidential information may be used"),
            _EFFECTIVE_DATE,
            _f("mndaTermType", "MNDA Term Type", 'either "expires" or "until_terminated"'),
            _f("mndaTermYears", "MNDA Term (years)", "number of years, when the term type is expires"),
            _f("confidentialityTermType", "Confidentiality Term Type", 'either "years" or "perpetuity"'),
            _f("confidentialityTermYears", "Confidentiality Term (years)", "number of years, when the type is years"),
            _GOVERNING_LAW,
            _JURISDICTION,
            _f("modifications", "Modifications", "any changes to the standard terms; empty if none"),
            _f("party1Company", "Party 1 Company", "first party's company name"),
            _f("party1SignerName", "Party 1 Signer", "first party's signer name"),
            _f("party1SignerTitle", "Party 1 Title", "first party's signer title"),
            _f("party1NoticeAddress", "Party 1 Notice Address", "first party's email or postal address"),
            _f("party2Company", "Party 2 Company", "second party's company name"),
            _f("party2SignerName", "Party 2 Signer", "second party's signer name"),
            _f("party2SignerTitle", "Party 2 Title", "second party's signer title"),
            _f("party2NoticeAddress", "Party 2 Notice Address", "second party's email or postal address"),
        ],
    ),
    DocumentType(
        id="csa",
        name="Cloud Service Agreement",
        description="Governs the provision and use of a cloud/SaaS product.",
        fields=[
            _f("providerName", "Provider", "company providing the cloud service"),
            _f("customerName", "Customer", "company using the cloud service"),
            _EFFECTIVE_DATE,
            _f("cloudService", "Cloud Service", "description of the cloud/SaaS product"),
            _f("subscriptionTerm", "Subscription Term", "length of the subscription"),
            _f("fees", "Fees", "subscription fees"),
            _f("paymentTerms", "Payment Terms", "how and when fees are paid"),
            _GOVERNING_LAW,
            _JURISDICTION,
        ],
    ),
    DocumentType(
        id="design-partner",
        name="Design Partner Agreement",
        description="Collaborating with an early customer to develop and refine a product.",
        fields=[
            _f("providerName", "Provider", "company developing the product"),
            _f("partnerName", "Design Partner", "the early customer partner"),
            _EFFECTIVE_DATE,
            _f("purpose", "Purpose", "goal of the collaboration"),
            _f("term", "Term", "length of the agreement"),
            _f("feedbackObligations", "Feedback Obligations", "what feedback the partner will provide"),
            _GOVERNING_LAW,
            _JURISDICTION,
        ],
    ),
    DocumentType(
        id="sla",
        name="Service Level Agreement",
        description="Defines uptime commitments, support, and remedies for a service.",
        fields=[
            _f("providerName", "Provider", "company providing the service"),
            _f("customerName", "Customer", "company receiving the service"),
            _EFFECTIVE_DATE,
            _f("uptimeCommitment", "Uptime Commitment", "guaranteed uptime percentage"),
            _f("supportHours", "Support Hours", "hours during which support is available"),
            _f("responseTime", "Response Time", "target response time for issues"),
            _f("serviceCredits", "Service Credits", "credits owed if commitments are missed"),
            _GOVERNING_LAW,
        ],
    ),
    DocumentType(
        id="psa",
        name="Professional Services Agreement",
        description="Covers the delivery of professional or consulting services.",
        fields=[
            _f("providerName", "Provider", "company providing the services"),
            _f("customerName", "Customer", "company receiving the services"),
            _EFFECTIVE_DATE,
            _f("services", "Services", "description of the services"),
            _f("fees", "Fees", "fees for the services"),
            _f("paymentTerms", "Payment Terms", "how and when fees are paid"),
            _f("term", "Term", "length of the agreement"),
            _GOVERNING_LAW,
            _JURISDICTION,
        ],
    ),
    DocumentType(
        id="dpa",
        name="Data Processing Agreement",
        description="Addresses the processing of personal data and related privacy obligations.",
        fields=[
            _f("controllerName", "Controller", "the data controller"),
            _f("processorName", "Processor", "the data processor"),
            _EFFECTIVE_DATE,
            _f("subjectMatter", "Subject Matter", "subject matter of the processing"),
            _f("natureAndPurpose", "Nature and Purpose", "nature and purpose of the processing"),
            _f("dataCategories", "Data Categories", "categories of personal data"),
            _f("dataSubjects", "Data Subjects", "categories of data subjects"),
            _f("subprocessors", "Subprocessors", "approved subprocessors, if any"),
            _GOVERNING_LAW,
        ],
    ),
    DocumentType(
        id="software-license",
        name="Software License Agreement",
        description="Governs the licensing of software to a customer.",
        fields=[
            _f("licensorName", "Licensor", "party licensing the software"),
            _f("licenseeName", "Licensee", "party receiving the license"),
            _EFFECTIVE_DATE,
            _f("software", "Software", "description of the licensed software"),
            _f("licenseScope", "License Scope", "scope and restrictions of the license"),
            _f("licenseFees", "License Fees", "fees for the license"),
            _f("term", "Term", "length of the license"),
            _GOVERNING_LAW,
            _JURISDICTION,
        ],
    ),
    DocumentType(
        id="partnership",
        name="Partnership Agreement",
        description="Establishes a business partnership between parties.",
        fields=[
            _f("partner1Name", "Partner 1", "first partner"),
            _f("partner2Name", "Partner 2", "second partner"),
            _EFFECTIVE_DATE,
            _f("purpose", "Purpose", "purpose of the partnership"),
            _f("capitalContributions", "Capital Contributions", "each partner's contribution"),
            _f("profitSharing", "Profit Sharing", "how profits and losses are shared"),
            _f("managementResponsibilities", "Management", "each partner's responsibilities"),
            _f("term", "Term", "length of the partnership"),
            _GOVERNING_LAW,
        ],
    ),
    DocumentType(
        id="pilot",
        name="Pilot Agreement",
        description="Runs a time-limited product pilot or proof of concept with a customer.",
        fields=[
            _f("providerName", "Provider", "company providing the product"),
            _f("customerName", "Customer", "company running the pilot"),
            _EFFECTIVE_DATE,
            _f("pilotScope", "Pilot Scope", "what the pilot covers"),
            _f("pilotPeriod", "Pilot Period", "length of the pilot"),
            _f("fees", "Fees", "fees for the pilot, if any"),
            _f("successCriteria", "Success Criteria", "criteria for a successful pilot"),
            _GOVERNING_LAW,
            _JURISDICTION,
        ],
    ),
    DocumentType(
        id="baa",
        name="Business Associate Agreement",
        description="HIPAA-covered handling of protected health information.",
        fields=[
            _f("coveredEntityName", "Covered Entity", "the HIPAA covered entity"),
            _f("businessAssociateName", "Business Associate", "the business associate"),
            _EFFECTIVE_DATE,
            _f("permittedUses", "Permitted Uses", "permitted uses of PHI"),
            _f("phiDescription", "PHI Description", "the protected health information involved"),
            _f("breachNotificationDays", "Breach Notification (days)", "days to notify of a breach"),
            _f("term", "Term", "length of the agreement"),
            _GOVERNING_LAW,
        ],
    ),
    DocumentType(
        id="ai-addendum",
        name="AI Addendum",
        description="Terms specific to the provision and use of AI products and services.",
        fields=[
            _f("providerName", "Provider", "company providing the AI product"),
            _f("customerName", "Customer", "company using the AI product"),
            _EFFECTIVE_DATE,
            _f("aiProduct", "AI Product", "description of the AI product or service"),
            _f("permittedUse", "Permitted Use", "how the AI product may be used"),
            _f("trainingDataRights", "Training Data Rights", "rights to use data for training"),
            _f("outputOwnership", "Output Ownership", "who owns the AI outputs"),
            _GOVERNING_LAW,
        ],
    ),
]

DOCUMENTS_BY_ID = {d.id: d for d in DOCUMENTS}
