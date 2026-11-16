import Image from "next/image";
import { UpgradeButton } from "@/components/DashboardActions";

/**
 * The column beside the will. A will that is not signed properly is the real
 * failure, so the signing steps sit next to the document, followed by what to
 * do with it afterwards. None of it is printed.
 *
 * The steps summarise the "How to sign your will" sheet (lib/document.ts) and
 * must keep agreeing with it and with the attestation clause.
 */
const CARD = "rounded-[20px] px-[clamp(20px,2.4vw,30px)] py-7";

/** Each step is its bold opening words, then the rest of the sentence. */
const STEPS: { lead: string; rest: string }[] = [
  { lead: "Print every page", rest: ", single-sided, and read it through." },
  {
    lead: "Choose two witnesses",
    rest: " aged 18 or over. Not your spouse, children, parents or any heir, and not the husband, wife or civil partner of one: a witness who benefits loses their gift.",
  },
  {
    lead: "All three in one room.",
    rest: " Write the date, then sign in ink while both witnesses watch.",
  },
  {
    lead: "Each witness signs",
    rest: " and adds their name, address and occupation, while you and the other witness watch.",
  },
  {
    lead: "Everyone initials",
    rest: " the foot of each page. Do not staple or clip anything to it afterwards.",
  },
];

const CHECKBOX = "h-[26px] w-[26px] flex-none accent-emerald";

/** "Imran Khan, your executor," or "Imran Khan and Fatima Khan, your executors," */
function executorPhrase(names: string[]): string {
  if (names.length === 0) return "your executor";
  const list = new Intl.ListFormat("en-GB", { style: "long", type: "conjunction" }).format(names);
  return `${list}, your executor${names.length > 1 ? "s" : ""},`;
}

export function SigningAside({
  executors,
  isPremium,
}: {
  /** the names of the executors appointed in the will */
  executors: string[];
  isPremium: boolean;
}) {
  return (
    // #signing is where "How to sign it" lands, from this page and from My wills
    <aside
      id="signing"
      className="no-print flex min-w-0 flex-[1_1_360px] scroll-mt-5 flex-col gap-5"
    >
      <section className={`${CARD} bg-white`}>
        <Image
          src="/illustrations/signing.jpg"
          alt="Illustration: a man signing his will at a table while two witnesses watch."
          width={1400}
          height={1045}
          sizes="(min-width: 1044px) 320px, calc(100vw - 80px)"
          className="mb-[22px] block aspect-video h-auto w-full rounded-[14px] object-cover"
        />
        <p className="mb-1.5 text-[14px] font-bold tracking-[0.08em] text-[#8A4A00] uppercase">
          Not valid until signed
        </p>
        <h2 className="mb-5 text-[26px] leading-[1.15] font-bold tracking-[-0.02em]">
          Sign it properly, in this order
        </h2>
        <ol role="list" className="flex flex-col gap-[18px]">
          {STEPS.map((step, i) => (
            <li key={i}>
              {/* the padding reaches into the gaps, so a one-line step is still a 44px target */}
              <label htmlFor={`sign-step-${i + 1}`} className="-my-[9px] flex gap-3.5 py-[9px]">
                <input id={`sign-step-${i + 1}`} type="checkbox" className={`mt-0.5 ${CHECKBOX}`} />
                <span>
                  <strong>{step.lead}</strong>
                  {step.rest}
                </span>
              </label>
            </li>
          ))}
        </ol>
      </section>

      <section className={`${CARD} bg-white`}>
        <h2 className="h-card mb-2.5">Then keep it safe</h2>
        <p className="text-ink-soft">
          Store the signed original somewhere dry and tell {executorPhrase(executors)} where it
          is. A copy is not enough for probate.
        </p>
        <label
          htmlFor="signed-and-stored"
          className="mt-[18px] flex items-center gap-3.5 rounded-[14px] border-[1.5px] border-field p-4 font-bold"
        >
          <input id="signed-and-stored" type="checkbox" className={CHECKBOX} />
          I have signed and stored my will
        </label>
      </section>

      <section className={`${CARD} bg-deep text-white`}>
        <h2 className="h-card mb-2.5">Before you rely on it</h2>
        <p className="text-mist">
          Show the shares to your imam and, if your affairs are not simple, the will to a
          solicitor. This wording has not yet been reviewed by either.
        </p>
      </section>

      {!isPremium && (
        <section className={`${CARD} bg-saffron-tint text-saffron-ink`}>
          <p>
            <strong>This is your free Essential Will — complete and ready to sign.</strong>{" "}
            The Complete Will Pack adds charitable bequests, the
            religious-debts schedule, a letter of wishes, executor guidance
            and the estate checklist, plus a mirror will for your spouse.
          </p>
          <div className="mt-[18px]">
            <UpgradeButton className="btn-primary" />
          </div>
        </section>
      )}

      <p className="px-1 text-[15px] leading-normal text-ink-soft">
        Wasiyyah is a document-assembly service, not a law firm. This will was
        generated from your answers; please read every clause before signing.
        For complex estates we recommend a solicitor reviews it.
      </p>
    </aside>
  );
}
