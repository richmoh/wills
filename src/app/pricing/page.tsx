import Link from "next/link";
import { getSessionUser } from "@/lib/auth";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { UpgradeButton } from "@/components/DashboardActions";

export const metadata = {
  title: "Pricing",
  description:
    "The Essential Will is free and complete. The Complete Will Pack is a one-time £39 — never a subscription.",
};

// What you get, then what the Essential Will and the Complete Pack say for it.
const rows: [string, string, string][] = [
  ["The guided interview, with live shares", "Yes", "Yes"],
  ["Exact fractions, with the rule behind each one", "Yes", "Yes"],
  ["Executors, and guardians for your children", "Yes", "Yes"],
  ["Islamic funeral and burial directions", "Yes", "Yes"],
  ["Print-ready will with signing instructions", "Yes", "Yes"],
  ["Bequests to charity or to relatives who are not heirs, kept within one-third", "Not included", "Yes"],
  ["Religious-debts schedule: zakat, fidya, kaffarah, Hajj", "Not included", "Yes"],
  ["A letter of wishes to your family", "Not included", "Yes"],
  ["A guide for your executors", "Not included", "Yes"],
  ["Checklist for what a will cannot reach: a jointly owned home, pensions, life insurance", "Not included", "Yes"],
  ["A mirror will for your spouse, started from your answers", "Not included", "Yes"],
  ["More than one will, and updates whenever your family changes", "One will", "Unlimited"],
];

const notes: [string, string][] = [
  [
    "Why is the will free?",
    "Because writing a wasiyyah is a religious duty, and cost should never be the reason a Muslim dies without one. The paid pack funds the service for everyone.",
  ],
  [
    "Refunds",
    "If the pack is not right for you, email us within 14 days of buying it for a full refund.",
  ],
  [
    "When to use a solicitor instead",
    "If you own a business, hold property abroad, expect a dispute or have children from a previous marriage. The interview tells you when your answers call for one.",
  ],
];

// the size of the button at the foot of each plan
const planButton = "px-6 py-4 text-[18px]";

export default async function PricingPage({
  searchParams,
}: {
  searchParams: Promise<{ cancelled?: string }>;
}) {
  const user = await getSessionUser();
  const { cancelled } = await searchParams;

  return (
    <>
      <SiteHeader />
      <main className="mx-auto w-full max-w-[1120px] px-[clamp(20px,4vw,48px)] pt-12 pb-24">
        <h1 className="h-display max-w-[760px]">The will is free. The extras are £39, once.</h1>
        <p className="lede mt-6 max-w-[640px]">
          No subscription and no card to start. Make your will first; add the
          pack later if you want it.
        </p>
        {cancelled && (
          <p className="note-warn mt-6 max-w-[640px]">
            Checkout was cancelled — no payment was taken. Your free will is
            untouched.
          </p>
        )}

        <div className="mt-12 grid grid-cols-[repeat(auto-fit,minmax(min(320px,100%),1fr))] gap-6">
          <section className="flex flex-col gap-4 rounded-3xl border border-line bg-white p-9">
            <h2 className="text-[22px] font-bold">Essential Will</h2>
            <p className="text-[64px] leading-none font-extrabold tracking-[-0.04em]">£0</p>
            <p className="flex-1 text-ink-soft">
              A complete will in the Qur&rsquo;anic shares, ready to print and
              sign. For most families this is everything they need.
            </p>
            <Link
              href={user ? "/dashboard" : "/signup"}
              className={`btn-primary ${planButton}`}
            >
              {user ? "Go to my will" : "Start my free will"}
            </Link>
          </section>

          <section className="flex flex-col gap-4 rounded-3xl bg-ink p-9 text-white">
            <h2 className="text-[22px] font-bold">Complete Will Pack</h2>
            <p className="text-[64px] leading-none font-extrabold tracking-[-0.04em]">
              £39{" "}
              <span className="text-[18px] font-medium tracking-normal text-mist">
                one payment
              </span>
            </p>
            <p className="flex-1 text-mist">
              For giving to charity, settling what you owe to Allah, guiding
              your executors, and a matching will for your husband or wife.
            </p>
            {user ? (
              user.is_premium ? (
                <p className="flex items-center justify-center gap-2.5 rounded-xl border-[1.5px] border-deep-line px-6 py-4 text-center font-bold text-saffron">
                  <svg
                    aria-hidden="true"
                    width="22"
                    height="22"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="flex-none"
                  >
                    <path d="M5 12.5l4.5 4.5L19 7.5" />
                  </svg>
                  You have the Complete Pack
                </p>
              ) : (
                <UpgradeButton className={`btn-gold w-full ${planButton}`} />
              )
            ) : (
              <Link href="/signup" className={`btn-gold ${planButton}`}>
                Start free, add the pack inside
              </Link>
            )}
          </section>
        </div>

        <h2 id="plans-compared" className="h-section mt-[88px] mb-6">
          What is in each
        </h2>
        {/* On a narrow screen the table scrolls sideways inside its own box,
            which takes keyboard focus so that it can be scrolled without a mouse. */}
        <div
          role="region"
          aria-labelledby="plans-compared"
          tabIndex={0}
          className="overflow-x-auto rounded-[20px] border border-line bg-white focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-focus"
        >
          <table className="w-full min-w-[620px] border-collapse text-[17px]">
            <thead>
              <tr>
                <th scope="col" className="px-6 py-5 text-left text-[15px] font-semibold text-ink-soft">
                  What you get
                </th>
                <th scope="col" className="w-[150px] px-4 py-5 text-center font-bold">
                  Essential
                </th>
                <th scope="col" className="w-[150px] px-4 py-5 text-center font-bold">
                  Complete Pack
                </th>
              </tr>
            </thead>
            <tbody>
              {rows.map(([feature, essential, pack]) => {
                // rows the free will does not fully cover are tinted
                const inBoth = essential === "Yes";
                return (
                  <tr key={feature} className={`border-t border-line ${inBoth ? "" : "bg-stone"}`}>
                    <th scope="row" className="px-6 py-4 text-left font-medium">
                      {feature}
                    </th>
                    <td className={`text-center ${inBoth ? "font-bold text-emerald" : "text-ink-mute"}`}>
                      {essential}
                    </td>
                    <td className="text-center font-bold text-emerald">{pack}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <div className="mt-[72px] grid grid-cols-[repeat(auto-fit,minmax(min(260px,100%),1fr))] gap-x-12 gap-y-8">
          {notes.map(([title, text]) => (
            <div key={title}>
              <h3 className="mb-2 text-[21px] font-bold tracking-[-0.02em]">{title}</h3>
              <p className="text-ink-soft">{text}</p>
            </div>
          ))}
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
