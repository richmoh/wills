import Link from "next/link";
import { getSessionUser } from "@/lib/auth";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { UpgradeButton } from "@/components/DashboardActions";

export const metadata = {
  title: "Pricing",
  description:
    "The Essential Will is free and legally valid. The Complete Will Pack is a one-time £39 — never a subscription.",
};

const rows: [string, boolean, boolean][] = [
  ["Guided interview with live fara'id shares", true, true],
  ["Exact Qur'anic fractions with the working shown", true, true],
  ["Executor & guardian appointments", true, true],
  ["Islamic burial directions", true, true],
  ["England & Wales signing instructions", true, true],
  ["Print-ready will document", true, true],
  ["Charitable bequests / wasiyya (one-third cap enforced)", false, true],
  ["Religious-debts schedule (zakat, fidya, kaffarah, Hajj)", false, true],
  ["Letter of wishes", false, true],
  ["Executor guidance pack", false, true],
  ["Estate-alignment checklist (joint homes, pensions, insurance)", false, true],
  ["Mirror will for your spouse", false, true],
  ["Unlimited wills & future updates", false, true],
];

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
      <main className="flex-1">
        <div className="mx-auto max-w-5xl px-4 py-16 sm:px-6">
          <div className="mx-auto max-w-2xl text-center">
            <h1 className="font-display text-4xl font-semibold tracking-tight text-forest-900">
              One honest price. No subscription.
            </h1>
            <p className="mt-4 text-ink/65">
              Your Essential Will is free — complete and legally valid. The
              Complete Will Pack is a single payment of{" "}
              <strong>£39</strong>, yours for life.
            </p>
            {cancelled && (
              <p className="mt-4 rounded-xl bg-gold-100 px-4 py-3 text-sm text-ink/70">
                Checkout was cancelled — no payment was taken. Your free will is
                untouched.
              </p>
            )}
          </div>

          <div className="mt-12 overflow-x-auto">
            <table className="w-full min-w-[640px] border-collapse text-sm">
              <thead>
                <tr>
                  <th className="w-1/2 pb-4 text-left font-display text-base font-semibold text-forest-900">
                    What you get
                  </th>
                  <th className="pb-4 text-center">
                    <div className="font-display text-base font-semibold text-forest-900">Essential</div>
                    <div className="font-display text-2xl font-semibold text-forest-900">£0</div>
                  </th>
                  <th className="pb-4 text-center">
                    <div className="font-display text-base font-semibold text-gold-600">Complete Pack</div>
                    <div className="font-display text-2xl font-semibold text-forest-900">
                      £39 <span className="text-sm font-normal text-ink/50">once</span>
                    </div>
                  </th>
                </tr>
              </thead>
              <tbody>
                {rows.map(([feature, free, premium]) => (
                  <tr key={feature} className="border-t border-ink/8">
                    <td className="py-3.5 pr-4 text-ink/80">{feature}</td>
                    <td className="py-3.5 text-center">{free ? <Yes /> : <span className="text-ink/25">—</span>}</td>
                    <td className="py-3.5 text-center">{premium ? <Yes gold /> : <span className="text-ink/25">—</span>}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="border-t border-ink/8">
                  <td className="py-6" />
                  <td className="py-6 text-center">
                    <Link href={user ? "/dashboard" : "/signup"} className="btn-ghost !py-2.5">
                      {user ? "Go to my will" : "Start free"}
                    </Link>
                  </td>
                  <td className="py-6 text-center">
                    {user ? (
                      user.is_premium ? (
                        <span className="text-sm font-semibold text-forest-700">✦ You have the Complete Pack</span>
                      ) : (
                        <UpgradeButton />
                      )
                    ) : (
                      <Link href="/signup" className="btn-gold !py-2.5">
                        Start free, upgrade inside
                      </Link>
                    )}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>

          <div className="mx-auto mt-12 max-w-2xl space-y-4 text-sm leading-6 text-ink/60">
            <p>
              <strong className="text-forest-900">Why is the core will free?</strong>{" "}
              Because writing a wasiyyah is a religious duty, and cost should
              never be the reason a Muslim dies without one. The paid pack
              funds the service for everyone.
            </p>
            <p>
              <strong className="text-forest-900">Refunds.</strong> If the pack
              isn&rsquo;t right for you, email us within 14 days for a full
              refund — no questions asked.
            </p>
          </div>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}

function Yes({ gold = false }: { gold?: boolean }) {
  return (
    <svg
      viewBox="0 0 20 20"
      className={`inline h-5 w-5 ${gold ? "fill-gold-500" : "fill-forest-600"}`}
      aria-label="included"
    >
      <path d="M10 0a10 10 0 100 20 10 10 0 000-20zm4.6 7.1l-5.3 6.2a1 1 0 01-1.5 0L5.4 10.6a1 1 0 111.5-1.3l1.7 1.9 4.5-5.4a1 1 0 111.5 1.3z" />
    </svg>
  );
}
