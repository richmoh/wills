import Link from "next/link";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { SideNav } from "@/components/marketing/SideNav";

export const metadata = {
  title: "FAQ",
  description: "Honest answers about Islamic wills in England & Wales.",
};

type Faq = {
  q: string;
  a: string;
  /** an id other pages link to, e.g. /faq#why-a-will */
  id?: string;
};

const topics: { id: string; title: string; faqs: Faq[] }[] = [
  {
    id: "law",
    title: "The law",
    faqs: [
      {
        q: "Will a will made here be legally valid?",
        a: "A will is valid in England & Wales when it is made by an adult with capacity, in writing, and signed in the joint presence of two witnesses who each then sign. Our documents are drafted to meet those Wills Act 1837 requirements and come with precise signing instructions. Wasiyyah is a self-help service, not a law firm: the wording has not yet been reviewed by a solicitor, and a will is only as good as its signing. If your affairs are anything but simple, have a solicitor read it before you sign.",
      },
      {
        id: "why-a-will",
        q: "Why does a Muslim in the UK need a will at all?",
        a: "Without one, your estate is divided under the intestacy rules, which bear no relation to the Qur’anic shares: a surviving spouse can take the entire estate while parents receive nothing. A will is also how you appoint guardians for your children and record your wish for an Islamic burial.",
      },
      {
        q: "Can my family challenge the Islamic shares?",
        a: "English law lets certain dependants claim reasonable financial provision under the Inheritance (Provision for Family and Dependants) Act 1975, and no will can exclude that. A letter of wishes explaining your intentions helps. If you expect a dispute, a solicitor should be involved.",
      },
      {
        q: "When should I use a solicitor instead?",
        a: "If you own a business, hold significant assets abroad, expect the will to be contested, or have a blended family from previous marriages. The interview asks about most of these and tells you when your answers call for one.",
      },
    ],
  },
  {
    id: "shares",
    title: "The Islamic shares",
    faqs: [
      {
        q: "Who checked the fiqh?",
        a: "The calculation follows the classical Sunni rules: the fixed Qur’anic shares, exclusion, residuary heirs, proportional reduction (‘awl) and return of surplus (radd), with the Hanafi position where the four schools differ. It has not yet been independently reviewed by a scholar or fatwa body. Every will shows its rule-by-rule working, so please take it to someone you trust.",
      },
      {
        q: "Can I leave something to charity, or to relatives who are not heirs?",
        a: "Yes. Up to one-third of your estate may be left to charity or to people who are not fixed-share heirs, such as grandchildren through a daughter or adopted children. A bequest to someone who is already an heir needs the other heirs’ consent after your death.",
      },
      {
        q: "Some of my family are not Muslim. What happens to them?",
        a: "The four Sunni schools agree that a relative who is not Muslim does not take a fixed share of a Muslim’s estate, so the interview counts only your Muslim relatives. You can provide for the others through a bequest of up to one-third, and we recommend a solicitor’s advice.",
      },
      {
        q: "Do you support Shia (Ja’fari) inheritance rules?",
        a: "Not yet. The Ja’fari system differs structurally from the Sunni schools, and doing it half-right would be worse than saying so.",
      },
    ],
  },
  {
    id: "family",
    title: "Your family and your home",
    faqs: [
      {
        q: "What if my family changes after I make my will?",
        a: "Sign in, change the answer and print a new will after any birth, death, marriage or divorce. Under English law, marriage revokes an existing will, so make a new one the same week.",
      },
      {
        q: "My spouse and I own our home together. Does the will cover it?",
        a: "It depends how you own it. As joint tenants the home passes to the survivor outside the will, which defeats the Islamic shares. As tenants in common your share passes under your will. Pensions and life insurance also pass by nomination, not by will.",
      },
    ],
  },
  {
    id: "data",
    title: "Your information",
    faqs: [
      {
        q: "Is my data safe? Do you sell it?",
        a: "Your answers are used only to prepare your documents and are never sold or shared. Because they reveal your faith and your family, we ask for your consent before storing anything. You can download everything we hold, or delete your account, at any time.",
      },
    ],
  },
];

// The same questions and answers, described for search engines.
const structuredData = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: topics
    .flatMap((topic) => topic.faqs)
    .map((f) => ({
      "@type": "Question",
      name: f.q,
      acceptedAnswer: { "@type": "Answer", text: f.a },
    })),
};

export default function FaqPage() {
  return (
    <>
      <SiteHeader />
      <main className="mx-auto flex w-full max-w-[1240px] flex-wrap gap-x-20 gap-y-12 px-[clamp(20px,4vw,48px)] pt-12 pb-24">
        <div className="min-w-0 flex-[1_1_320px]">
          <h1 className="h-display">Straight answers</h1>
          <p className="lede mt-6">Including the ones that do not flatter us.</p>
          <SideNav
            label="Topics"
            items={topics.map((topic) => ({ id: topic.id, label: topic.title }))}
          />
          <p className="mt-9 text-[16px] text-ink-soft">
            Something else?{" "}
            <a href="mailto:hello@wasiyyahwills.com" className="font-semibold">
              hello@wasiyyahwills.com
            </a>
          </p>
        </div>

        <div className="flex min-w-0 flex-[2_1_560px] flex-col gap-14">
          {topics.map((topic, topicIndex) => (
            <section key={topic.id} id={topic.id} className="scroll-mt-6">
              <h2 className="eyebrow mb-3">{topic.title}</h2>
              {topic.faqs.map((f, index) => (
                <details
                  key={f.q}
                  id={f.id}
                  // the first answer is open, so it is plain how the list works
                  open={topicIndex === 0 && index === 0}
                  className="scroll-mt-6 border-t border-line-strong py-1 last:border-b"
                >
                  <summary className="py-4 text-[21px] font-bold tracking-[-0.01em]">
                    {f.q}
                  </summary>
                  <p className="mb-5 text-ink-soft">{f.a}</p>
                </details>
              ))}
            </section>
          ))}

          <div className="flex flex-wrap items-center justify-between gap-x-8 gap-y-5 rounded-3xl bg-ink p-9 text-white">
            <p className="flex-[1_1_320px] text-[24px] leading-[1.25] font-bold tracking-[-0.02em]">
              The quickest answer is to see your own shares.
            </p>
            <Link href="/signup" className="btn-gold px-[26px] py-4 text-[18px]">
              Start my free will
            </Link>
          </div>
        </div>
      </main>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(structuredData).replace(/</g, "\\u003c"),
        }}
      />
      <SiteFooter />
    </>
  );
}
