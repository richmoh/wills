import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth";
import { queryOne } from "@/lib/db";
import { buildWillDocument } from "@/lib/document";
import { emptyCensus } from "@/lib/faraid/types";
import { emptyWillData, type WillData } from "@/lib/will-types";
import { PrintButton } from "@/components/PrintButton";
import { UpgradeButton } from "@/components/DashboardActions";
import { Logo } from "@/components/Logo";

export const metadata = { title: "Your will" };

export default async function WillDocumentPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await getSessionUser();
  if (!user) redirect("/login");

  const { id } = await params;
  const row = await queryOne<{ id: string; data: Partial<WillData>; status: string }>(
    `select id, data, status from wills where id = $1 and user_id = $2`,
    [id, user.id]
  );
  if (!row) notFound();

  const defaults = emptyWillData();
  const data: WillData = {
    ...defaults,
    ...row.data,
    census: { ...emptyCensus(), ...(row.data.census ?? {}) },
    religiousDebts: { ...defaults.religiousDebts, ...(row.data.religiousDebts ?? {}) },
    complexity: { ...defaults.complexity, ...(row.data.complexity ?? {}) },
  };

  const doc = buildWillDocument(data, user.is_premium);
  const today = new Date().toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  return (
    <div className="min-h-screen bg-paper-dark">
      {/* screen-only toolbar */}
      <div className="no-print sticky top-0 z-40 border-b border-ink/8 bg-paper/90 backdrop-blur">
        <div className="mx-auto flex max-w-4xl flex-wrap items-center justify-between gap-3 px-4 py-3 sm:px-6">
          <Link href="/dashboard" aria-label="Back to dashboard">
            <Logo />
          </Link>
          <div className="flex items-center gap-3">
            <Link href={`/will/${row.id}/edit`} className="btn-ghost !py-2.5">
              Edit answers
            </Link>
            <PrintButton />
          </div>
        </div>
      </div>

      <main className="mx-auto max-w-4xl px-4 py-8 sm:px-6">
        {!user.is_premium && (
          <div className="no-print mb-6 flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-gold-300/60 bg-gold-100/50 p-5">
            <p className="max-w-xl text-sm leading-6 text-ink/75">
              <strong>This is your free Essential Will — valid and complete.</strong>{" "}
              The Complete Will Pack adds charitable bequests, the
              religious-debts schedule, a letter of wishes, executor guidance
              and the estate checklist, plus a mirror will for your spouse.
            </p>
            <UpgradeButton />
          </div>
        )}

        {/* ======================= THE WILL ======================= */}
        <article className="will-sheet card !p-10 sm:!p-14">
          <header className="text-center">
            <p className="font-arabic text-2xl text-forest-800" lang="ar" dir="rtl">
              بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ
            </p>
            <p className="mt-1 text-xs italic text-ink/50">
              In the name of Allah, the Most Gracious, the Most Merciful
            </p>
            <h1 className="mt-6 font-display text-3xl font-semibold tracking-tight text-ink">
              Last Will and Testament
            </h1>
            <p className="mt-3 text-sm text-ink/70">
              of <strong className="text-ink">{doc.testatorName || "________________"}</strong>
              <br />
              of {doc.testatorAddress || "________________"}
            </p>
          </header>

          <div className="mt-10 space-y-8">
            {doc.clauses.map((clause, i) => (
              <section key={i} className="will-clause">
                <h2 className="font-display text-lg font-semibold text-forest-900">
                  {i + 1}. {clause.heading}
                </h2>
                {clause.paragraphs.map((p, j) => (
                  <p key={j} className="mt-2.5 text-justify text-[15px] leading-7 text-ink/85">
                    {p}
                  </p>
                ))}
                {clause.list && (
                  <ul className="mt-2.5 space-y-1.5 pl-5 text-[15px] leading-7 text-ink/85">
                    {clause.list.map((item, k) => (
                      <li key={k}>{item}</li>
                    ))}
                  </ul>
                )}
                {/* shares table sits inside the residuary clause */}
                {clause.heading.startsWith("Residuary") && doc.shareRows.length > 0 && (
                  <table className="mt-4 w-full border-collapse text-sm">
                    <thead>
                      <tr className="border-b-2 border-forest-800 text-left">
                        <th className="py-2 pr-3 font-semibold text-forest-900">Heir</th>
                        <th className="py-2 pr-3 font-semibold text-forest-900">Share</th>
                        <th className="py-2 font-semibold text-forest-900">Equivalent</th>
                      </tr>
                    </thead>
                    <tbody>
                      {doc.shareRows.map((r, k) => (
                        <tr key={k} className="border-b border-ink/10 align-top">
                          <td className="py-2.5 pr-3">
                            {r.heir}
                            {r.names && <span className="text-ink/60"> — {r.names}</span>}
                          </td>
                          <td className="py-2.5 pr-3 font-semibold">
                            {r.fraction}
                            {r.perPerson && (
                              <span className="font-normal text-ink/55"> ({r.perPerson})</span>
                            )}
                          </td>
                          <td className="py-2.5 tabular-nums">{r.percent}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </section>
            ))}

            {/* attestation */}
            <section className="will-clause">
              <h2 className="font-display text-lg font-semibold text-forest-900">
                {doc.clauses.length + 1}. Attestation
              </h2>
              <p className="mt-2.5 text-justify text-[15px] leading-7 text-ink/85">
                IN WITNESS of which I have signed this will on the date below,
                in the joint presence of the two witnesses named beneath, who
                then each signed in my presence and in the presence of each
                other.
              </p>

              <div className="mt-8 grid gap-10">
                <div>
                  <div className="text-xs font-semibold uppercase tracking-wide text-ink/50">
                    Testator
                  </div>
                  <div className="mt-8 grid grid-cols-2 gap-8 border-t border-ink/40 pt-2 text-sm text-ink/70">
                    <span>Signature of {doc.testatorName || "the testator"}</span>
                    <span>Date</span>
                  </div>
                </div>
                {[1, 2].map((n) => (
                  <div key={n}>
                    <div className="text-xs font-semibold uppercase tracking-wide text-ink/50">
                      Witness {n} — must not be a beneficiary or a beneficiary&rsquo;s spouse
                    </div>
                    <div className="mt-8 grid grid-cols-2 gap-8 border-t border-ink/40 pt-2 text-sm text-ink/70">
                      <span>Signature</span>
                      <span>Full name</span>
                    </div>
                    <div className="mt-8 grid grid-cols-2 gap-8 border-t border-ink/40 pt-2 text-sm text-ink/70">
                      <span>Address</span>
                      <span>Occupation</span>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          </div>

          <footer className="mt-12 border-t border-ink/10 pt-4 text-center text-[11px] text-ink/40">
            Prepared with Wasiyyah ({user.is_premium ? "Complete Will Pack" : "free plan"}) on {today} ·
            wills.themuslimguide.org · This document was prepared from the testator&rsquo;s own instructions.
          </footer>
        </article>

        {/* ======================= THE PACK ======================= */}
        {doc.extras.map((extra) => (
          <article key={extra.id} className="will-sheet page-break card mt-8 !p-10 sm:!p-14">
            <h1 className="font-display text-2xl font-semibold tracking-tight text-ink">
              {extra.title}
            </h1>
            {extra.intro && (
              <p className="mt-2 text-sm italic leading-6 text-ink/60">{extra.intro}</p>
            )}
            <div className="mt-6 space-y-6">
              {extra.sections.map((s, i) => (
                <section key={i} className="will-clause">
                  <h2 className="font-display text-base font-semibold text-forest-900">
                    {s.heading}
                  </h2>
                  {s.paragraphs?.map((p, j) => (
                    <p key={j} className="mt-2 text-[15px] leading-7 text-ink/85">
                      {p}
                    </p>
                  ))}
                  {s.list && (
                    <ul className="mt-2 list-disc space-y-1.5 pl-5 text-[15px] leading-7 text-ink/85">
                      {s.list.map((item, k) => (
                        <li key={k}>{item}</li>
                      ))}
                    </ul>
                  )}
                </section>
              ))}
            </div>
          </article>
        ))}

        <p className="no-print mx-auto mt-8 max-w-2xl text-center text-xs leading-5 text-ink/45">
          Wasiyyah is a document-assembly service, not a law firm. This will was
          generated from your answers; please read every clause before signing.
          For complex estates we recommend a solicitor reviews it.
        </p>
      </main>
    </div>
  );
}
