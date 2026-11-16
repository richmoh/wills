import Link from "next/link";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { LegalDocument, type LegalSection } from "@/components/marketing/LegalDocument";

export const metadata = { title: "Terms of service" };

// Each clause's heading keeps its number and its closing full stop, exactly as
// the terms were written.
const clauses: Omit<LegalSection, "label">[] = [
  {
    id: "service",
    heading: "1. What Wasiyyah is.",
    body: (
      <p>Wasiyyah is a self-help document-assembly service. It prepares will documents from the answers you provide. It is not a law firm, does not provide legal advice, and no solicitor–client relationship arises from your use of it.</p>
    ),
  },
  {
    id: "responsibility",
    heading: "2. Your responsibility.",
    body: (
      <p>You are responsible for the accuracy of your answers, for reading the generated documents before signing, and for executing them correctly following the signing instructions provided. A will is only valid once signed and witnessed in accordance with the Wills Act 1837.</p>
    ),
  },
  {
    id: "scope",
    heading: "3. Scope.",
    body: (
      <p>Documents are drafted for the law of England &amp; Wales only. If you live elsewhere or hold assets elsewhere, take local advice. The Islamic calculations follow the Sunni schools, applying the Hanafi position where they differ, as disclosed in the calculation working.</p>
    ),
  },
  {
    id: "advice",
    heading: "4. When to seek advice.",
    body: (
      <p>For estates involving businesses, foreign assets, expected disputes, blended families or significant inheritance-tax exposure, we recommend a qualified solicitor. The service flags several of these situations where your answers reveal them, but it does not ask what your estate is worth and cannot tell you whether inheritance tax applies.</p>
    ),
  },
  {
    id: "payment",
    heading: "5. Payment.",
    body: (
      <p>The Complete Will Pack is a one-time payment processed by Stripe. Refunds are available within 14 days of purchase on request.</p>
    ),
  },
  {
    id: "liability",
    heading: "6. Liability.",
    body: (
      <p>We will provide the service with reasonable care and skill. If we fail to, we are responsible for loss you suffer that was a foreseeable result of that failure. We are not responsible for loss caused by answers that were inaccurate or incomplete, by a will that was not signed and witnessed as the signing instructions describe, or by going ahead without advice where the service recommended a solicitor. Nothing in these terms limits or excludes liability that cannot lawfully be limited or excluded — including for death or personal injury caused by negligence, or for fraud — and nothing affects your legal rights as a consumer.</p>
    ),
  },
  {
    id: "account",
    heading: "7. Your account.",
    body: (
      <p>You can download a copy of your data, or delete your account and everything in it, at any time from your <Link href="/account" className="font-semibold">Account page</Link>; individual wills can be deleted from your dashboard. Deletion is permanent. We may suspend accounts used unlawfully or abusively.</p>
    ),
  },
  {
    id: "changes",
    heading: "8. Changes.",
    body: (
      <p>We may update these terms; material changes will be notified on the site. Continued use after changes constitutes acceptance.</p>
    ),
  },
];

// The contents list names each clause without the full stop.
const sections: LegalSection[] = clauses.map((clause) => ({
  ...clause,
  label: clause.heading.replace(/\.$/, ""),
}));

export default function TermsPage() {
  return (
    <>
      <SiteHeader />
      <LegalDocument
        title="Terms of service"
        sections={sections}
        closing={<p>Contact: support@themuslimguide.org</p>}
      />
      <SiteFooter />
    </>
  );
}
