import Link from "next/link";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";

const exampleShares = [
  { label: "Wife", fraction: "1/8", pct: 12.5, color: "#15804F" },
  { label: "Two sons", fraction: "17/60 each", pct: 56.66, color: "#B08A18" },
  { label: "Daughter", fraction: "17/120", pct: 14.17, color: "#4678B8" },
  { label: "Mother", fraction: "1/6", pct: 16.67, color: "#B05F2A" },
];

export default function LandingPage() {
  return (
    <>
      <SiteHeader />
      <main className="flex-1">
        {/* ============================== HERO ============================== */}
        <section className="pattern-dark relative overflow-hidden bg-forest-950 text-white">
          <div
            className="pointer-events-none absolute inset-0 bg-[radial-gradient(80%_60%_at_50%_0%,rgba(36,135,98,0.35),transparent)]"
            aria-hidden
          />
          <div className="relative mx-auto max-w-6xl px-4 pb-24 pt-20 sm:px-6 lg:pb-32 lg:pt-28">
            <div className="grid items-center gap-14 lg:grid-cols-2">
              <div>
                <p className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-4 py-1.5 text-xs font-medium tracking-wide text-forest-200">
                  For Muslims in England &amp; Wales
                </p>
                <h1 className="mt-6 font-display text-4xl font-semibold leading-[1.1] tracking-tight sm:text-5xl lg:text-[3.4rem]">
                  Your Islamic will,
                  <br />
                  <span className="text-gold-300">done properly.</span>
                </h1>
                <p className="mt-6 max-w-lg text-lg leading-8 text-white/75">
                  A professionally drafted will that follows the Qur&rsquo;anic
                  shares <em>exactly</em> and is valid under English law —
                  from a guided interview that takes about 15 minutes.
                </p>
                <div className="mt-8 flex flex-wrap items-center gap-4">
                  <Link href="/signup" className="btn-gold !px-8 !py-3.5 !text-base">
                    Start my will — free
                  </Link>
                  <Link
                    href="#how-it-works"
                    className="text-sm font-semibold text-white/80 hover:text-white"
                  >
                    See how it works ↓
                  </Link>
                </div>
                <ul className="mt-10 flex flex-wrap gap-x-8 gap-y-3 text-sm text-white/60">
                  <li className="flex items-center gap-2">
                    <Tick /> Exact fara&rsquo;id shares
                  </li>
                  <li className="flex items-center gap-2">
                    <Tick /> Wills Act 1837 compliant
                  </li>
                  <li className="flex items-center gap-2">
                    <Tick /> Free will, genuinely valid
                  </li>
                </ul>
              </div>

              {/* live-look example card */}
              <div className="relative">
                <p
                  className="pointer-events-none absolute -top-16 right-0 select-none font-arabic text-[10rem] leading-none text-white/[0.05]"
                  lang="ar"
                  dir="rtl"
                  aria-hidden
                >
                  وصية
                </p>
                <div className="relative rounded-3xl border border-white/10 bg-white p-6 text-ink shadow-2xl">
                  <div className="flex items-baseline justify-between">
                    <h3 className="font-display text-lg font-semibold text-forest-900">
                      Inheritance shares
                    </h3>
                    <span className="text-xs text-ink/50">example — husband &amp; father of three</span>
                  </div>
                  <div className="mt-4 flex h-8 w-full gap-[2px] overflow-hidden rounded-lg">
                    {exampleShares.map((s) => (
                      <div
                        key={s.label}
                        style={{ width: `${s.pct}%`, backgroundColor: s.color }}
                        className="flex items-center justify-center"
                      >
                        {s.pct > 13 && (
                          <span className="text-[11px] font-semibold text-white">
                            {s.pct.toFixed(0)}%
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                  <ul className="mt-4 space-y-2.5 text-sm">
                    {exampleShares.map((s) => (
                      <li key={s.label} className="flex items-center gap-2.5">
                        <span
                          className="h-3 w-3 rounded-[4px]"
                          style={{ backgroundColor: s.color }}
                        />
                        <span className="font-medium">{s.label}</span>
                        <span className="ml-auto font-display font-semibold text-forest-800">
                          {s.fraction}
                        </span>
                      </li>
                    ))}
                  </ul>
                  <p className="mt-4 rounded-xl bg-forest-50 px-3 py-2 text-xs leading-5 text-forest-800">
                    Every share traced to its source — Qur&rsquo;an 4:11, 4:12
                    and 4:176 — with the working shown.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ============================ WHY ============================ */}
        <section className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
          <div className="max-w-2xl">
            <h2 className="font-display text-3xl font-semibold tracking-tight text-forest-900">
              Two nights is the limit the Prophet ﷺ set
            </h2>
            <p className="mt-4 text-[15px] leading-7 text-ink/70">
              <em>
                &ldquo;It is not right for a Muslim who has something concerning
                which a will should be made to spend two nights without his
                will being written down with him.&rdquo;
              </em>{" "}
              — al-Bukhari &amp; Muslim. Yet most British Muslims have no will
              at all.
            </p>
          </div>
          <div className="mt-12 grid gap-6 md:grid-cols-3">
            {[
              {
                title: "Without a will, English law decides",
                body: "The intestacy rules hand your estate out in fixed portions that ignore the Qur'anic shares entirely — a spouse may take everything while parents and siblings receive nothing of their haqq.",
              },
              {
                title: "A will makes fara'id legally binding",
                body: "England & Wales gives you almost complete testamentary freedom. Your will simply directs your estate to the Qur'anic heirs in the Qur'anic fractions — and the law will enforce it.",
              },
              {
                title: "Your children, your choice",
                body: "Your will appoints guardians you trust to raise your children in the deen, and executors who understand that debts — including zakat — come before everything.",
              },
            ].map((c) => (
              <div key={c.title} className="card">
                <h3 className="font-display text-lg font-semibold text-forest-900">
                  {c.title}
                </h3>
                <p className="mt-3 text-sm leading-6 text-ink/65">{c.body}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ======================== HOW IT WORKS ======================== */}
        <section id="how-it-works" className="pattern-light bg-paper-dark py-20">
          <div className="mx-auto max-w-6xl px-4 sm:px-6">
            <h2 className="font-display text-3xl font-semibold tracking-tight text-forest-900">
              Fifteen minutes, three steps
            </h2>
            <div className="mt-12 grid gap-10 md:grid-cols-3">
              {[
                {
                  n: "١",
                  title: "Answer gentle questions",
                  body: "Family, executors, guardians, wishes. The interview is smart: rules of exclusion (hajb) mean you're never asked about relatives who cannot inherit. Most people answer 12–18 questions.",
                },
                {
                  n: "٢",
                  title: "Watch your shares appear",
                  body: "As you answer, the Qur'anic shares are calculated live in exact fractions — never rounded — with every rule cited so you (or your imam) can verify the working.",
                },
                {
                  n: "٣",
                  title: "Print, sign, done",
                  body: "Your will is drafted for England & Wales with step-by-step signing instructions. Two witnesses, ten minutes, and your wasiyyah is legally binding.",
                },
              ].map((s) => (
                <div key={s.title}>
                  <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-forest-800 font-arabic text-2xl text-gold-300">
                    {s.n}
                  </div>
                  <h3 className="mt-5 font-display text-xl font-semibold text-forest-900">
                    {s.title}
                  </h3>
                  <p className="mt-3 text-sm leading-6 text-ink/65">{s.body}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ===================== INHERITANCE EXPLAINER ===================== */}
        <section id="inheritance" className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
          <div className="grid items-center gap-12 lg:grid-cols-2">
            <div>
              <h2 className="font-display text-3xl font-semibold tracking-tight text-forest-900">
                Fractions set by revelation, enforced by English law
              </h2>
              <p className="mt-4 text-[15px] leading-7 text-ink/70">
                Inheritance is one of the few matters the Qur&rsquo;an legislates
                in precise fractions — a half, a quarter, an eighth, two-thirds,
                a third, a sixth. The Prophet ﷺ urged the ummah to learn this
                knowledge, and it is a duty on the community to uphold it.
              </p>
              <p className="mt-4 text-[15px] leading-7 text-ink/70">
                Wasiyyah computes your family&rsquo;s shares the way the
                classical scholars did — exact fractions, the rules of exclusion,
                proportional adjustment (&lsquo;awl) and return (radd) — and then
                expresses them in a will English courts enforce.
              </p>
              <ul className="mt-6 space-y-3 text-sm text-ink/75">
                <li className="flex gap-3"><TickDark /> Sunni fiqh, with the Hanafi position where schools differ — always disclosed</li>
                <li className="flex gap-3"><TickDark /> Rule-by-rule working shown for scholar review</li>
                <li className="flex gap-3"><TickDark /> Up to one-third wasiyya for charity and non-heirs, cap enforced</li>
                <li className="flex gap-3"><TickDark /> Religious debts — zakat, fidya, Hajj — paid first, as debts</li>
              </ul>
            </div>
            <div className="rounded-3xl border border-forest-100 bg-forest-50 p-8">
              <blockquote className="text-[15px] leading-7 text-forest-900">
                <p className="font-arabic text-xl leading-9" lang="ar" dir="rtl">
                  يُوصِيكُمُ اللَّهُ فِي أَوْلَادِكُمْ ۖ لِلذَّكَرِ مِثْلُ حَظِّ الْأُنثَيَيْنِ
                </p>
                <p className="mt-4 italic text-forest-800/80">
                  &ldquo;Allah instructs you concerning your children: for the
                  male, what is equal to the share of two females…&rdquo;
                </p>
                <footer className="mt-3 text-sm font-semibold text-forest-700">
                  — Surah an-Nisa, 4:11
                </footer>
              </blockquote>
              <p className="mt-6 border-t border-forest-200 pt-5 text-sm leading-6 text-forest-900/70">
                These verses close with a warning and a promise — gardens
                beneath which rivers flow for those who keep Allah&rsquo;s
                limits. A written will is how you keep them after you.
              </p>
            </div>
          </div>
        </section>

        {/* ========================== PRICING =========================== */}
        <section className="bg-forest-950 py-20 text-white">
          <div className="mx-auto max-w-6xl px-4 sm:px-6">
            <div className="max-w-2xl">
              <h2 className="font-display text-3xl font-semibold tracking-tight">
                Free for every Muslim. More for those who want it.
              </h2>
              <p className="mt-4 text-white/70">
                The Essential Will is complete and legally valid — free, because
                no one should be without a wasiyyah. The Complete Will Pack is a
                single payment, never a subscription.
              </p>
            </div>
            <div className="mt-12 grid gap-6 md:grid-cols-2">
              <div className="rounded-3xl border border-white/10 bg-white/5 p-8">
                <h3 className="font-display text-xl font-semibold">Essential Will</h3>
                <p className="mt-1 font-display text-4xl font-semibold">£0</p>
                <ul className="mt-6 space-y-3 text-sm text-white/80">
                  <li className="flex gap-3"><Tick /> Full guided interview &amp; exact fara&rsquo;id shares</li>
                  <li className="flex gap-3"><Tick /> Complete will: executors, guardians, burial wishes, Islamic shares</li>
                  <li className="flex gap-3"><Tick /> Signing instructions for England &amp; Wales</li>
                  <li className="flex gap-3"><Tick /> Print-ready PDF</li>
                </ul>
                <div className="mt-8">
                  <Link href="/signup" className="btn-ghost w-full !border-white/25 !text-white hover:!bg-white/10">
                    Start free
                  </Link>
                </div>
              </div>
              <div className="relative rounded-3xl border-2 border-gold-400 bg-gradient-to-b from-white/10 to-white/5 p-8">
                <span className="absolute -top-3.5 left-8 rounded-full bg-gold-500 px-4 py-1 text-xs font-bold uppercase tracking-wide text-forest-950">
                  One payment, forever
                </span>
                <h3 className="font-display text-xl font-semibold">Complete Will Pack</h3>
                <p className="mt-1 font-display text-4xl font-semibold">
                  £39 <span className="text-base font-normal text-white/60">once</span>
                </p>
                <ul className="mt-6 space-y-3 text-sm text-white/85">
                  <li className="flex gap-3"><Gold /> Everything in Essential</li>
                  <li className="flex gap-3"><Gold /> Charitable bequests (wasiyya) — one-third cap enforced</li>
                  <li className="flex gap-3"><Gold /> Religious-debts schedule: zakat, fidya, kaffarah, Hajj</li>
                  <li className="flex gap-3"><Gold /> Letter of wishes to your family</li>
                  <li className="flex gap-3"><Gold /> Executor guidance pack &amp; estate checklist</li>
                  <li className="flex gap-3"><Gold /> Mirror will for your spouse + unlimited updates</li>
                </ul>
                <div className="mt-8">
                  <Link href="/pricing" className="btn-gold w-full">
                    Get the Complete Pack
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ============================ FAQ ============================= */}
        <section className="mx-auto max-w-3xl px-4 py-20 sm:px-6">
          <h2 className="text-center font-display text-3xl font-semibold tracking-tight text-forest-900">
            Questions, answered honestly
          </h2>
          <div className="mt-10 space-y-4">
            {[
              {
                q: "Is this will really legally valid?",
                a: "Yes. England & Wales grants near-total testamentary freedom, so a will distributing your estate in the Qur'anic shares is enforced like any other — provided it is signed with two independent witnesses exactly as our instructions describe. For complex estates (businesses, foreign property, expected disputes) we flag when a solicitor should review it.",
              },
              {
                q: "Which school of fiqh do you follow?",
                a: "The rules the four Sunni schools agree on — which is almost everything — plus the Hanafi position on the few points of difference. Every rule applied to your family is shown in the working, so you can take it to your own scholar.",
              },
              {
                q: "What happens when my family changes?",
                a: "Your will includes a clause directing your executors to apply the Islamic shares to the family you actually leave behind, verified by a qualified scholar — and you can regenerate the document at any time.",
              },
            ].map((f) => (
              <details key={f.q} className="card group">
                <summary className="cursor-pointer select-none font-display text-base font-semibold text-forest-900 marker:content-none">
                  {f.q}
                </summary>
                <p className="mt-3 text-sm leading-6 text-ink/65">{f.a}</p>
              </details>
            ))}
          </div>
          <p className="mt-8 text-center">
            <Link href="/faq" className="font-semibold text-forest-800 hover:underline">
              Read the full FAQ →
            </Link>
          </p>
        </section>

        {/* ========================== FINAL CTA ========================== */}
        <section className="pattern-dark bg-forest-900 py-16 text-center text-white">
          <div className="mx-auto max-w-2xl px-4">
            <p className="font-arabic text-3xl text-gold-300" lang="ar" dir="rtl">
              وصية
            </p>
            <h2 className="mt-4 font-display text-3xl font-semibold tracking-tight">
              Tonight could be the first of the two nights.
            </h2>
            <p className="mt-4 text-white/70">
              Fifteen minutes now. Peace of mind for your family, and your
              affairs in order before Allah.
            </p>
            <div className="mt-8">
              <Link href="/signup" className="btn-gold !px-10 !py-4 !text-base">
                Write my will now
              </Link>
            </div>
          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}

function Tick() {
  return (
    <svg viewBox="0 0 20 20" className="h-5 w-5 shrink-0 fill-forest-400" aria-hidden>
      <path d="M10 0a10 10 0 100 20 10 10 0 000-20zm4.6 7.1l-5.3 6.2a1 1 0 01-1.5 0L5.4 10.6a1 1 0 111.5-1.3l1.7 1.9 4.5-5.4a1 1 0 111.5 1.3z" />
    </svg>
  );
}
function TickDark() {
  return (
    <svg viewBox="0 0 20 20" className="h-5 w-5 shrink-0 fill-forest-600" aria-hidden>
      <path d="M10 0a10 10 0 100 20 10 10 0 000-20zm4.6 7.1l-5.3 6.2a1 1 0 01-1.5 0L5.4 10.6a1 1 0 111.5-1.3l1.7 1.9 4.5-5.4a1 1 0 111.5 1.3z" />
    </svg>
  );
}
function Gold() {
  return (
    <svg viewBox="0 0 20 20" className="h-5 w-5 shrink-0 fill-gold-400" aria-hidden>
      <path d="M10 0l2.4 6.9L20 7.6l-5.6 4.8L16.2 20 10 15.8 3.8 20l1.8-7.6L0 7.6l7.6-.7L10 0z" />
    </svg>
  );
}
