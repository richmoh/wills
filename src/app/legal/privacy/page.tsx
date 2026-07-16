import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";

export const metadata = { title: "Privacy policy" };

export default function PrivacyPage() {
  return (
    <>
      <SiteHeader />
      <main className="flex-1">
        <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6">
          <h1 className="font-display text-3xl font-semibold text-forest-900">Privacy policy</h1>
          <div className="mt-8 space-y-5 text-[15px] leading-7 text-ink/75">
            <p><strong>What we collect.</strong> Your account details (name, email, a hashed password) and the answers you give in the will interview — family structure, the people you appoint, and your wishes. We collect nothing else, and we never ask for financial account details.</p>
            <p><strong>What it is used for.</strong> Solely to generate your documents and operate your account. We do not sell, rent, share or advertise with your data. Ever.</p>
            <p><strong>Payments.</strong> Card payments are processed by Stripe; your card details never touch our servers.</p>
            <p><strong>Where it lives.</strong> Data is stored on our own server infrastructure in Europe, encrypted in transit and at rest at the disk level. Session cookies are essential-only; we set no advertising or analytics cookies.</p>
            <p><strong>Retention and deletion.</strong> Your data is kept while your account exists. Deleting a will, or your account, removes the data immediately and permanently from the live database.</p>
            <p><strong>Your rights.</strong> Under UK GDPR you may request access, correction, export or erasure of your data at any time: support@themuslimguide.org.</p>
          </div>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
