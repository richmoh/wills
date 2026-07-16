import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";

export const metadata = { title: "Terms of service" };

export default function TermsPage() {
  return (
    <>
      <SiteHeader />
      <main className="flex-1">
        <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6">
          <h1 className="font-display text-3xl font-semibold text-forest-900">Terms of service</h1>
          <div className="prose-sm mt-8 space-y-5 text-[15px] leading-7 text-ink/75">
            <p><strong>1. What Wasiyyah is.</strong> Wasiyyah is a self-help document-assembly service. It prepares will documents from the answers you provide. It is not a law firm, does not provide legal advice, and no solicitor–client relationship arises from your use of it.</p>
            <p><strong>2. Your responsibility.</strong> You are responsible for the accuracy of your answers, for reading the generated documents before signing, and for executing them correctly following the signing instructions provided. A will is only valid once signed and witnessed in accordance with the Wills Act 1837.</p>
            <p><strong>3. Scope.</strong> Documents are drafted for the law of England &amp; Wales only. If you live elsewhere or hold assets elsewhere, take local advice. The Islamic calculations follow the Sunni schools, applying the Hanafi position where they differ, as disclosed in the calculation working.</p>
            <p><strong>4. When to seek advice.</strong> For estates involving businesses, foreign assets, expected disputes, blended families or significant inheritance-tax exposure, we recommend a qualified solicitor. The service flags these situations where your answers reveal them.</p>
            <p><strong>5. Payment.</strong> The Complete Will Pack is a one-time payment processed by Stripe. Refunds are available within 14 days of purchase on request.</p>
            <p><strong>6. Liability.</strong> To the extent permitted by law, our liability in connection with the service is limited to the amount you paid for it. Nothing limits liability that cannot lawfully be limited.</p>
            <p><strong>7. Your account.</strong> You may delete your account and documents at any time; deletion is permanent. We may suspend accounts used unlawfully or abusively.</p>
            <p><strong>8. Changes.</strong> We may update these terms; material changes will be notified on the site. Continued use after changes constitutes acceptance.</p>
            <p>Contact: support@themuslimguide.org</p>
          </div>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
