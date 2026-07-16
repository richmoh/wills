import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";

export const metadata = {
  title: "FAQ",
  description: "Honest answers about Islamic wills in England & Wales.",
};

const faqs: { q: string; a: string; id?: string }[] = [
  {
    id: "why-a-will",
    q: "Why does a Muslim in the UK need a will at all?",
    a: "Without a will, your estate is distributed under the intestacy rules of England & Wales, which bear no relation to the Qur'anic shares — a surviving spouse can take the entire estate while parents receive nothing. A valid will is the only way to make the fara'id legally binding on your estate. It is also how you appoint guardians for your children and record your wish for an Islamic burial.",
  },
  {
    q: "Is a will made here legally valid?",
    a: "Yes — a will is valid in England & Wales when it is made by an adult with capacity, in writing, signed in the joint presence of two witnesses who each then sign. Our documents follow the Wills Act 1837 formalities and come with precise signing instructions. The single most common DIY mistake — letting a beneficiary or their spouse act as witness, which voids their gift — is called out in bold in your signing pack.",
  },
  {
    q: "Is it really Sharia-compliant? Who checked the fiqh?",
    a: "The calculation engine implements the classical Sunni rules — the fixed Qur'anic shares, exclusion (hajb), residuary heirs, proportional adjustment ('awl) and return of surplus (radd). Where the four schools genuinely differ we apply the Hanafi position and say so openly. Uniquely, every will shows its rule-by-rule working with sources, so your own imam or scholar can verify every fraction. We recommend and welcome scholarly review.",
  },
  {
    q: "What if my family changes after I make my will?",
    a: "Best practice is to regenerate your will after any birth, death, marriage or divorce — it takes minutes and updates every fraction. As a safety net, your will also directs your executors to apply the Islamic shares to the family actually surviving you, confirmed in writing by a qualified scholar, if it differs from the family listed.",
  },
  {
    q: "Does marriage affect my will?",
    a: "Yes — under English law, marriage automatically revokes an existing will unless it was made in contemplation of that specific marriage. If you marry after making your will, make a new one the same week.",
  },
  {
    q: "My spouse and I own our home together. Does the will cover it?",
    a: "It depends how you own it. As 'joint tenants' the home passes automatically to the survivor outside the will — defeating the Islamic shares. As 'tenants in common' your share passes under your will. The Complete Will Pack includes a checklist explaining how to check and how to sever a joint tenancy (a simple Land Registry form).",
  },
  {
    q: "What about my pension and life insurance?",
    a: "Pension death benefits and life-insurance payouts usually pass by nomination, outside the will. The estate checklist in the Complete Will Pack walks you through aligning each nomination with your Islamic shares.",
  },
  {
    q: "Can I leave something to charity, or to relatives who aren't heirs?",
    a: "Yes — that is the wasiyya. Up to one-third of your estate may be left to charity or to people who are not fixed-share heirs (grandchildren via a daughter, adopted children, non-Muslim relatives). Our editor enforces the one-third cap. A bequest to someone who is already an heir requires the other heirs' consent after death — we explain this where it applies.",
  },
  {
    q: "Can my family challenge the Islamic shares?",
    a: "English law lets certain dependants claim 'reasonable financial provision' under the Inheritance (Provision for Family and Dependants) Act 1975 — no will can exclude that possibility. In practice, claims are uncommon where the family understands the shares are religiously mandated; a letter of wishes explaining your intentions (included in the Complete Pack) helps greatly. If you expect a dispute, we flag that a solicitor should be involved.",
  },
  {
    q: "Is my data safe? Do you sell it?",
    a: "Your answers are stored encrypted at rest on UK/EU infrastructure, used solely to generate your documents, and never sold or shared. You can delete your wills and account at any time, and deletion is immediate and real.",
  },
  {
    q: "When should I use a solicitor instead?",
    a: "If you own a business, hold significant foreign assets, expect the will to be contested, have a blended family from previous marriages, or your estate is well above the inheritance-tax threshold — get a solicitor (ideally one familiar with Islamic wills). Our interview detects these situations and tells you, rather than pretending a generated document is always enough.",
  },
  {
    q: "Do you support Shia (Ja'fari) inheritance rules?",
    a: "Not yet. The Ja'fari system differs structurally from the Sunni schools, and doing it half-right would be worse than being honest. It is on our roadmap.",
  },
];

export default function FaqPage() {
  return (
    <>
      <SiteHeader />
      <main className="flex-1">
        <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6">
          <h1 className="font-display text-4xl font-semibold tracking-tight text-forest-900">
            Frequently asked questions
          </h1>
          <div className="mt-10 space-y-4">
            {faqs.map((f) => (
              <details key={f.q} id={f.id} className="card">
                <summary className="cursor-pointer select-none font-display text-base font-semibold text-forest-900">
                  {f.q}
                </summary>
                <p className="mt-3 text-sm leading-7 text-ink/70">{f.a}</p>
              </details>
            ))}
          </div>
        </div>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "FAQPage",
              mainEntity: faqs.map((f) => ({
                "@type": "Question",
                name: f.q,
                acceptedAnswer: { "@type": "Answer", text: f.a },
              })),
            }),
          }}
        />
      </main>
      <SiteFooter />
    </>
  );
}
