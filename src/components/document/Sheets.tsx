import type { ExtraDoc, WillDocument } from "@/lib/document";

/**
 * The sheets that get printed: the will, then each further document of the
 * pack. Everything here is set in the book serif and the document greys, on
 * screen and on the printed page alike. The words come from lib/document.ts
 * and are rendered as they are.
 *
 * Print hooks (see the print block in globals.css): `will-sheet` drops the
 * screen padding and shadow, `will-clause` keeps a clause on one page, and
 * `page-break` starts a document on a new page.
 */
const SHEET =
  "will-sheet scroll-mt-5 bg-white p-[clamp(28px,6vw,88px)] font-serif text-[17px] leading-[1.7] text-doc shadow-[0_20px_48px_-28px_rgba(15,31,26,0.5)] [&_strong]:font-semibold";

const CLAUSE_HEADING = "text-[19px] font-semibold";

/** A line to write on: the rule, with what goes on it named beneath. */
function SignLine({ children }: { children: React.ReactNode }) {
  return <div className="border-t border-doc pt-1.5">{children}</div>;
}

export function WillSheet({
  doc,
  isPremium,
  generatedOn,
}: {
  doc: WillDocument;
  isPremium: boolean;
  /** the date the will was generated, already formatted */
  generatedOn: string;
}) {
  return (
    <article id="will" className={SHEET}>
      <header className="text-center">
        <p className="font-arabic text-[28px]" lang="ar" dir="rtl">
          بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ
        </p>
        <p className="mt-1 text-[14px] text-doc-soft italic">
          In the name of Allah, the Most Gracious, the Most Merciful
        </p>
        <h1 className="mt-9 mb-3.5 text-[34px] leading-[1.25] font-semibold tracking-[-0.01em]">
          Last Will and Testament
        </h1>
        <p className="text-doc-soft">
          of <strong className="text-doc">{doc.testatorName || "________________"}</strong>
          <br />
          of {doc.testatorAddress || "________________"}
        </p>
      </header>

      <div className="mt-10">
        {doc.clauses.map((clause, i) => (
          <section key={i} className="will-clause mb-7">
            <h2 className={CLAUSE_HEADING}>
              {i + 1}. {clause.heading}
            </h2>
            {clause.paragraphs.map((p, j) => (
              <p key={j} className={j === 0 ? "mt-2" : "mt-3"}>
                {p}
              </p>
            ))}
            {clause.list && (
              <ul role="list" className="mt-2 space-y-1.5 pl-6">
                {clause.list.map((item, k) => (
                  <li key={k}>{item}</li>
                ))}
              </ul>
            )}
            {/* the schedule of shares sits inside the residuary clause */}
            {clause.heading.startsWith("Residuary") && doc.shareRows.length > 0 && (
              <div
                role="region"
                aria-label="Schedule of shares"
                tabIndex={0}
                className="mt-4 overflow-x-auto print:overflow-visible"
              >
                <table className="w-full min-w-[440px] border-collapse text-[16px] print:min-w-0">
                  <thead>
                    <tr className="border-b-2 border-doc">
                      <th scope="col" className="py-2 pr-3 text-left font-semibold">
                        Heir
                      </th>
                      <th scope="col" className="py-2 pr-3 text-left font-semibold">
                        Share
                      </th>
                      <th scope="col" className="py-2 text-right font-semibold">
                        Equivalent
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {doc.shareRows.map((r, k) => (
                      <tr key={k} className="border-b border-doc-line align-top last:border-b-0">
                        <td className="py-2.5 pr-3">
                          {r.heir}
                          {r.names && <span> — {r.names}</span>}
                        </td>
                        <td className="py-2.5 pr-3 whitespace-nowrap">
                          <strong>{r.fraction}</strong>
                          {r.perPerson && <span> ({r.perPerson})</span>}
                        </td>
                        <td className="py-2.5 text-right tabular-nums">{r.percent}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        ))}

        {/* attestation: where the testator and the two witnesses sign */}
        <section className="will-clause">
          <h2 className={CLAUSE_HEADING}>{doc.clauses.length + 1}. Attestation</h2>
          <p className="mt-2">
            IN WITNESS of which I have signed this will on the date below,
            in the joint presence of the two witnesses named beneath, who
            then each signed in my presence and in the presence of each
            other.
          </p>

          <div className="mt-9 text-[14px] text-doc-soft">
            <div>
              <div className="text-[13px] font-semibold tracking-[0.06em] uppercase">
                Testator
              </div>
              <div className="mt-11 grid grid-cols-2 gap-x-8">
                <SignLine>Signature of {doc.testatorName || "the testator"}</SignLine>
                <SignLine>Date</SignLine>
              </div>
            </div>
            {[1, 2].map((n) => (
              <div key={n} className="mt-9">
                <div className="text-[13px] font-semibold tracking-[0.06em] uppercase">
                  Witness {n} — must not be a beneficiary or a beneficiary&rsquo;s spouse
                </div>
                <div className="mt-11 grid grid-cols-2 gap-x-8 gap-y-11">
                  <SignLine>Signature</SignLine>
                  <SignLine>Full name</SignLine>
                  <SignLine>Address</SignLine>
                  <SignLine>Occupation</SignLine>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>

      <footer className="will-footer mt-12 border-t border-doc-line pt-3.5 text-center text-[13px] text-doc-soft">
        Prepared with Wasiyyah ({isPremium ? "Complete Will Pack" : "free plan"}) on {generatedOn} ·
        reference {doc.reference}{" "}· wills.themuslimguide.org · This
        document was prepared from the testator&rsquo;s own instructions. The
        testator and both witnesses should initial the foot of every page.
      </footer>
    </article>
  );
}

/** One of the documents that travel with the will; each prints from a new page. */
export function PackSheet({ id, extra }: { id: string; extra: ExtraDoc }) {
  return (
    <article id={id} className={`${SHEET} page-break`}>
      <h2 className="text-[26px] leading-[1.25] font-semibold tracking-[-0.01em]">
        {extra.title}
      </h2>
      {extra.intro && <p className="mt-2 text-[16px] text-doc-soft italic">{extra.intro}</p>}
      <div className="mt-7">
        {extra.sections.map((s, i) => (
          <section key={i} className="will-clause mb-7 last:mb-0">
            <h3 className={CLAUSE_HEADING}>{s.heading}</h3>
            {s.paragraphs?.map((p, j) => (
              <p key={j} className={j === 0 ? "mt-2" : "mt-3"}>
                {p}
              </p>
            ))}
            {s.list && (
              <ul className="mt-2 list-disc space-y-1.5 pl-6">
                {s.list.map((item, k) => (
                  <li key={k}>{item}</li>
                ))}
              </ul>
            )}
          </section>
        ))}
      </div>
    </article>
  );
}
