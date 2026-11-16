import Image from "next/image";
import Link from "next/link";
import { ShareCalculator } from "@/components/home/ShareCalculator";
import { ShareBar, type ShareSegment } from "@/components/Shares";
import { SiteFooter } from "@/components/SiteFooter";
import { SiteHeader } from "@/components/SiteHeader";
import { SHARE_COLOURS } from "@/lib/share-colours";

const COLUMN = "mx-auto max-w-[1240px] px-[clamp(20px,4vw,48px)]";
const H2 = "text-[clamp(30px,3.4vw,44px)] leading-[1.08] font-bold tracking-[-0.03em]";

// The worked example the page keeps returning to: a husband who leaves a wife,
// two sons, a daughter and his mother, and an estate of £250,000.
const EXAMPLE: (ShareSegment & { amount: string })[] = [
  { key: "wife", label: "Wife", amount: "£31,250", n: 1, d: 8, ...SHARE_COLOURS.spouse },
  { key: "sons", label: "Two sons", amount: "£141,667", n: 17, d: 30, ...SHARE_COLOURS.sons },
  { key: "daughter", label: "Daughter", amount: "£35,417", n: 17, d: 120, ...SHARE_COLOURS.daughters },
  { key: "mother", label: "Mother", amount: "£41,667", n: 1, d: 6, ...SHARE_COLOURS.mother },
];

const STEPS = [
  {
    image: "/illustrations/answering.jpg",
    alt: "Illustration: a husband and wife on a sofa answering questions together on a laptop.",
    numeral: "١",
    title: "Answer about your family",
    body: "Islamic law itself keeps the interview short: if a son survives you, your brothers cannot inherit, so you are never asked about them. Everything saves as you go.",
  },
  {
    image: "/illustrations/shares-on-phone.jpg",
    alt: "Illustration: hands holding a phone that shows a ring divided into shares.",
    numeral: "٢",
    title: "Watch the shares appear",
    body: "Each answer updates the shares beside you, in exact fractions that are never rounded, with the reason for every one in plain English.",
  },
  {
    image: "/illustrations/signing.jpg",
    alt: "Illustration: a man signing his will at a table while two witnesses watch.",
    numeral: "٣",
    title: "Print it and sign it",
    body: "Sign in front of two independent witnesses, exactly as the instructions describe, and your will takes legal effect. Come back and update it whenever your family changes.",
  },
];

const QUESTIONS = [
  {
    q: "Will my will be legally valid?",
    a: "A will takes effect in England & Wales when an adult with capacity signs it in front of two independent witnesses, who then sign it too. Ours is drafted to meet those requirements and comes with exact signing instructions. It has not yet been reviewed by a solicitor, and for anything beyond a straightforward estate we tell you when to ask one.",
  },
  {
    q: "Which school of fiqh do you follow?",
    a: "The rules the four Sunni schools agree on, which is almost everything, and the Hanafi position on the few points of difference. The working shows which rule was applied where.",
  },
  {
    q: "What happens when my family changes?",
    a: "Sign in, change the answer, and print a new will; it takes minutes. As a safety net, the will also directs your executors to apply the Islamic shares to the family you actually leave behind.",
  },
  {
    q: "Is my information safe?",
    a: "Your answers are used only to prepare your documents and are never sold or shared. You can download or delete everything from your account at any time.",
  },
];

export default function LandingPage() {
  return (
    <>
      <SiteHeader />
      <main className="flex-1">
        {/* ============================== HERO ============================== */}
        <section
          className={`${COLUMN} flex flex-wrap items-center gap-x-16 gap-y-12 pt-10 pb-[88px]`}
        >
          <div className="min-w-0 flex-[1_1_440px]">
            <p className="eyebrow mb-5">Islamic wills for England &amp; Wales</p>
            <h1 className="text-[clamp(42px,5.4vw,72px)] leading-[1.02] font-extrabold tracking-[-0.035em]">
              Every heir.
              <br />
              Their exact share.
            </h1>
            <p className="lede mt-7 max-w-[520px]">
              Answer a few questions about your family. Wasiyyah works out the
              Qur&rsquo;anic shares as exact fractions and writes them into a will
              drafted for the law of England &amp; Wales. The will is free.
            </p>
            <div className="mt-9 flex flex-wrap items-center gap-x-6 gap-y-4">
              <Link href="/signup" className="btn-primary btn-lg">
                Start my free will
              </Link>
              <a href="#sample" className="px-1 py-3 text-[17px] font-semibold text-ink">
                See what you get
              </a>
            </div>
            <ul className="mt-10 flex flex-wrap gap-x-9 gap-y-3 text-[16px] text-ink-soft">
              <li className="flex flex-col">
                <strong className="text-[26px] tracking-[-0.02em] text-ink">About 15 minutes</strong>
                from first question to finished will
              </li>
              <li className="flex flex-col">
                <strong className="text-[26px] tracking-[-0.02em] text-ink">
                  12&ndash;18 questions
                </strong>
                for most families
              </li>
              <li className="flex flex-col">
                <strong className="text-[26px] tracking-[-0.02em] text-ink">&pound;0</strong>
                no card needed
              </li>
            </ul>
          </div>

          <ShareCalculator className="min-w-0 flex-[1_1_500px]" />
        </section>

        {/* ====================== WITHOUT A WILL / WITH ====================== */}
        <section className="border-y border-line bg-white">
          <div className={`${COLUMN} flex flex-wrap gap-x-[72px] gap-y-10 py-[88px]`}>
            <div className="min-w-0 flex-[1_1_360px]">
              <h2 className={H2}>
                Without a will, English law divides your estate. Not the Qur&rsquo;an.
              </h2>
              <p className="mt-5 text-ink-soft">
                The intestacy rules of England &amp; Wales take no account of the Islamic
                shares. A will is how you make those shares binding on your estate, name
                guardians for your children and record your wish for an Islamic burial.
              </p>
            </div>
            <div className="flex min-w-0 flex-[1.3_1_480px] flex-col gap-7">
              <p className="text-[16px] text-ink-soft">
                Example: a husband leaves a wife, two sons, a daughter and his mother, and
                an estate of &pound;250,000.
              </p>
              <div>
                <h3 className="mb-[10px] text-[18px] font-bold">Without a will</h3>
                <div className="flex h-14 overflow-hidden rounded-xl">
                  <div className="flex flex-1 items-center bg-emerald px-[18px] font-bold text-white">
                    Wife &middot; &pound;250,000
                  </div>
                </div>
                <p className="mt-[10px] text-[16px] text-ink-soft">
                  The whole estate passes to his wife. His children and his mother receive
                  nothing.
                </p>
              </div>
              <div>
                <h3 className="mb-[10px] text-[18px] font-bold">With his Wasiyyah will</h3>
                <ShareBar segments={EXAMPLE} className="h-14 rounded-xl text-[15px]" />
                <ul className="mt-[14px] flex flex-wrap gap-x-7 gap-y-2 text-[16px] text-ink-soft">
                  {EXAMPLE.map((s) => (
                    <li key={s.key} className="flex items-center gap-2">
                      <span
                        aria-hidden="true"
                        className="h-3 w-3 flex-none rounded-[3px]"
                        style={{ background: s.fill }}
                      />
                      {s.label} {s.amount}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </section>

        {/* ========================== WHAT YOU GET ========================== */}
        <section
          id="sample"
          className={`${COLUMN} flex flex-wrap items-center gap-x-[72px] gap-y-12 py-24`}
        >
          <div className="min-w-0 flex-[1_1_440px] rounded-3xl bg-[#E6EBE7] p-[clamp(20px,4vw,44px)]">
            <article className="bg-white p-[clamp(24px,4vw,48px)] font-serif text-[15px] leading-[1.6] text-doc shadow-[0_18px_40px_-24px_rgba(15,31,26,0.45)]">
              <p lang="ar" dir="rtl" className="text-center font-arabic text-[22px]">
                بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ
              </p>
              <h3 className="mt-[14px] mb-1 text-center text-[24px] font-semibold">
                Last Will and Testament
              </h3>
              <p className="mb-[18px] text-center text-doc-soft">
                of BILAL AHMED, of 12 Example Road, Birmingham
              </p>
              <p className="mb-[6px] font-semibold">
                7. Residuary estate &mdash; the Islamic shares
              </p>
              <p className="mb-3">
                I give the residue of my estate, after payment of the above, to my heirs
                under the Islamic law of inheritance in the shares set out below&hellip;
              </p>
              <table className="w-full border-collapse text-[14px]">
                <thead>
                  <tr className="border-b-2 border-doc">
                    <th scope="col" className="py-[6px] text-left">
                      Heir
                    </th>
                    <th scope="col" className="py-[6px] text-left">
                      Share
                    </th>
                    <th scope="col" className="py-[6px] text-right">
                      Equivalent
                    </th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b border-doc-line">
                    <td className="py-[7px]">Wife &mdash; Maryam Ahmed</td>
                    <td>1/8</td>
                    <td className="text-right">12.50%</td>
                  </tr>
                  <tr className="border-b border-doc-line">
                    <td className="py-[7px]">2 sons &mdash; Yusuf, Idris</td>
                    <td>17/30 (17/60 each)</td>
                    <td className="text-right">56.67%</td>
                  </tr>
                  <tr className="border-b border-doc-line">
                    <td className="py-[7px]">Daughter &mdash; Hana</td>
                    <td>17/120</td>
                    <td className="text-right">14.17%</td>
                  </tr>
                  <tr>
                    <td className="py-[7px]">Mother &mdash; Khadija Begum</td>
                    <td>1/6</td>
                    <td className="text-right">16.67%</td>
                  </tr>
                </tbody>
              </table>
            </article>
          </div>
          <div className="min-w-0 flex-[1_1_400px]">
            <h2 className={H2}>A will you can read, print and sign tonight.</h2>
            <p className="mt-5 mb-7 text-ink-soft">
              Plain English, numbered clauses, every heir named with their fraction. It
              comes with the one thing most home-made wills get wrong: exact instructions
              for signing it.
            </p>
            <ul className="flex flex-col gap-[18px]">
              <li className="flex gap-[14px]">
                <Check />
                <span>
                  <strong>Your will.</strong>{" "}Executors, guardians for your children,
                  Islamic burial directions, and your estate in the Qur&rsquo;anic shares.
                </span>
              </li>
              <li className="flex gap-[14px]">
                <Check />
                <span>
                  <strong>How to sign it.</strong> Who can witness, who must not, and what
                  to do in what order, under the Wills Act 1837.
                </span>
              </li>
              <li className="flex gap-[14px]">
                <Check />
                <span>
                  <strong>The working.</strong> Each share with the rule and the verse
                  behind it, to show your imam or scholar.
                </span>
              </li>
            </ul>
            <p className="mt-7 text-[16px] text-ink-soft">
              The Complete Will Pack adds bequests to charity, a religious-debts schedule,
              a letter of wishes, a guide for your executors and a mirror will for your
              spouse.{" "}
              <Link href="/pricing" className="font-semibold">
                Compare the two
              </Link>
            </p>
          </div>
        </section>

        {/* ========================== HOW IT WORKS ========================== */}
        <section id="how" className="border-y border-line bg-white">
          <div className={`${COLUMN} py-24`}>
            <h2 className={`${H2} mb-12 max-w-[640px]`}>
              Three steps. Most people finish in one sitting.
            </h2>
            <ol className="grid grid-cols-[repeat(auto-fit,minmax(min(280px,100%),1fr))] gap-x-12 gap-y-10">
              {STEPS.map((step) => (
                <li key={step.title}>
                  <Image
                    src={step.image}
                    alt={step.alt}
                    width={1400}
                    height={1045}
                    sizes="(min-width: 1020px) 350px, (min-width: 660px) 46vw, 100vw"
                    className="mb-6 block aspect-[4/3] h-auto w-full rounded-[20px] object-cover"
                  />
                  <p lang="ar" className="font-arabic text-[64px] leading-none text-emerald">
                    {step.numeral}
                  </p>
                  <h3 className="mt-[18px] mb-2 text-[24px] font-bold tracking-[-0.02em]">
                    {step.title}
                  </h3>
                  <p className="text-ink-soft">{step.body}</p>
                </li>
              ))}
            </ol>
          </div>
        </section>

        {/* =========================== THE WORKING =========================== */}
        <section id="working" className="bg-deep text-white">
          <div className={`${COLUMN} flex flex-wrap gap-x-[72px] gap-y-12 py-[104px]`}>
            <div className="min-w-0 flex-[1_1_420px]">
              <p
                lang="ar"
                dir="rtl"
                className="mb-3 text-left font-arabic text-[34px] leading-[1.7] text-saffron"
              >
                يُوصِيكُمُ اللَّهُ فِي أَوْلَادِكُمْ ۖ لِلذَّكَرِ مِثْلُ حَظِّ الْأُنثَيَيْنِ
              </p>
              <p className="mb-10 text-[16px] text-mist">
                &ldquo;Allah instructs you concerning your children: for the male, what is
                equal to the share of two females.&rdquo; Surah an-Nisa, 4:11
              </p>
              <h2 className={H2}>
                We would rather show our working than ask for your trust.
              </h2>
              <p className="mt-5 text-mist">
                The shares follow the rules the four Sunni schools agree on, and the Hanafi
                position on the few points where they differ. Every rule applied to your
                family is listed with its source.
              </p>
              <p className="mt-4 text-mist">
                Wasiyyah is a self-help service, not a law firm, and its calculation and
                wording have not yet been independently reviewed by a scholar or a
                solicitor. So take the working to someone you trust. It is written to be
                checked.
              </p>
            </div>
            <div className="min-w-0 flex-[1_1_420px] rounded-3xl bg-[#0F3A2E] p-[clamp(24px,3vw,36px)]">
              <h3 className="mb-5 text-[16px] font-bold tracking-[0.08em] text-saffron uppercase">
                The working for the example above
              </h3>
              <ol className="flex flex-col gap-5">
                <li className="flex items-start gap-[18px]">
                  <WorkingFraction>1/8</WorkingFraction>
                  <span>
                    <strong>Wife.</strong>{" "}One-eighth, the wife&rsquo;s share when the
                    deceased leaves descendants.{" "}
                    <span className="text-mist">Qur&rsquo;an 4:12</span>
                  </span>
                </li>
                <li className="flex items-start gap-[18px]">
                  <WorkingFraction>1/6</WorkingFraction>
                  <span>
                    <strong>Mother.</strong>{" "}One-sixth, the mother&rsquo;s share when the
                    deceased leaves descendants.{" "}
                    <span className="text-mist">Qur&rsquo;an 4:11</span>
                  </span>
                </li>
                <li className="flex items-start gap-[18px]">
                  <WorkingFraction>17/24</WorkingFraction>
                  <span>
                    <strong>Children.</strong> The remainder, two shares to each son for
                    every one to a daughter: 17/60 to each son, 17/120 to the daughter.{" "}
                    <span className="text-mist">Qur&rsquo;an 4:11</span>
                  </span>
                </li>
                <li className="flex items-start gap-[18px]">
                  <WorkingFraction>0</WorkingFraction>
                  <span>
                    <strong>Brothers and sisters.</strong> Excluded by a surviving son, so
                    the interview never asks about them.
                  </span>
                </li>
              </ol>
            </div>
          </div>
        </section>

        {/* ============================= PRICING ============================= */}
        <section className={`${COLUMN} py-24`}>
          <h2 className={`${H2} max-w-[700px]`}>
            The will is free. The extras are &pound;39, once.
          </h2>
          <p className="mt-5 mb-11 max-w-[640px] text-ink-soft">
            Writing a wasiyyah is a duty, and cost should never be the reason a Muslim is
            without one. The paid pack keeps the service running for everyone.
          </p>
          <div className="grid grid-cols-[repeat(auto-fit,minmax(min(320px,100%),1fr))] gap-6">
            <div className="flex flex-col gap-5 rounded-3xl border border-line bg-white p-9">
              <div>
                <h3 className="text-[22px] font-bold">Essential Will</h3>
                <p className="mt-[6px] text-[56px] leading-none font-extrabold tracking-[-0.04em]">
                  &pound;0
                </p>
              </div>
              <ul className="flex flex-1 list-disc flex-col gap-2 pl-[22px] text-ink-soft">
                <li>The full interview, with live shares and the working</li>
                <li>
                  A complete will: executors, guardians, burial wishes, the Islamic shares
                </li>
                <li>Signing instructions for England &amp; Wales</li>
                <li>One will per account</li>
              </ul>
              <Link href="/signup" className="btn-primary px-6 py-[15px] text-[18px]">
                Start my free will
              </Link>
            </div>
            <div className="flex flex-col gap-5 rounded-3xl bg-ink p-9 text-white">
              <div>
                <h3 className="text-[22px] font-bold">Complete Will Pack</h3>
                {/* a wrapping row, so on a phone the terms drop below the price in one piece */}
                <p className="mt-[6px] flex flex-wrap items-baseline gap-x-[9px] gap-y-1 text-[56px] leading-none font-extrabold tracking-[-0.04em]">
                  &pound;39
                  <span className="text-[18px] leading-[1.3] font-medium tracking-normal text-mist">
                    one payment, no subscription
                  </span>
                </p>
              </div>
              <ul className="flex flex-1 list-disc flex-col gap-2 pl-[22px] text-mist">
                <li>Everything in Essential</li>
                <li>
                  Bequests to charity and to relatives who are not heirs, kept within
                  one-third
                </li>
                <li>Religious-debts schedule: zakat, fidya, kaffarah, Hajj</li>
                <li>Letter of wishes, executor guide and estate checklist</li>
                <li>A mirror will for your spouse, and unlimited updates</li>
              </ul>
              <Link href="/pricing" className="btn-gold px-6 py-[15px] text-[18px]">
                See everything in the pack
              </Link>
            </div>
          </div>
        </section>

        {/* ============================ QUESTIONS ============================ */}
        <section className="border-t border-line bg-white">
          <div className="mx-auto max-w-[860px] px-[clamp(20px,4vw,48px)] py-24">
            <h2 className={`${H2} mb-8`}>Straight answers</h2>
            {QUESTIONS.map((item) => (
              <details key={item.q} className="border-t border-line py-[6px] last-of-type:border-b">
                <summary className="py-4 text-[20px] font-bold">{item.q}</summary>
                <p className="mb-5 text-ink-soft">{item.a}</p>
              </details>
            ))}
            {/* the padding makes the link a 44px target; the margins take it back out */}
            <p className="mt-5">
              <Link href="/faq" className="-mb-2 inline-block py-2 font-bold">
                All questions
              </Link>
            </p>
          </div>
        </section>

        {/* ============================= CLOSING ============================= */}
        <section className="bg-emerald text-white">
          <div className="mx-auto max-w-[900px] px-[clamp(20px,4vw,48px)] py-24 text-center">
            <Image
              src="/illustrations/family.jpg"
              alt="Illustration: three generations of a family at home together."
              width={1400}
              height={781}
              sizes="(min-width: 720px) 640px, 100vw"
              className="mx-auto mb-12 block aspect-video h-auto w-full max-w-[640px] rounded-3xl object-cover"
            />
            <blockquote className="mx-auto max-w-[720px] text-[clamp(24px,2.6vw,32px)] leading-[1.35] font-semibold tracking-[-0.02em]">
              &ldquo;It is not right for a Muslim who has something concerning which a will
              should be made to spend two nights without his will being written down with
              him.&rdquo;
            </blockquote>
            <p className="mt-4 mb-9 text-[16px] text-[#D5EBE2]">al-Bukhari and Muslim</p>
            <Link href="/signup" className="btn-white btn-lg px-8">
              Write mine tonight
            </Link>
          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}

function Check() {
  return (
    <svg
      aria-hidden="true"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="mt-[3px] flex-none text-emerald"
    >
      <path d="M5 12.5l4.5 4.5L19 7.5" />
    </svg>
  );
}

function WorkingFraction({ children }: { children: React.ReactNode }) {
  return (
    <span className="w-16 flex-none text-[26px] font-extrabold tracking-[-0.02em]">
      {children}
    </span>
  );
}
