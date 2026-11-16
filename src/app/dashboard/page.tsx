import Link from "next/link";
import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth";
import { query } from "@/lib/db";
import { PREMIUM_PRICE_PENCE } from "@/lib/stripe";
import { AppHeader } from "@/components/AppHeader";
import { NewWillButton } from "@/components/DashboardActions";
import { PlanPanel } from "@/components/dashboard/PlanPanel";
import { WillCard } from "@/components/dashboard/WillCard";
import { summariseWill, type WillSummary } from "@/components/dashboard/will-summary";
import { canMirror, normalizeWillData } from "@/lib/will-types";

export const metadata = { title: "My wills" };

interface WillRow {
  id: string;
  label: string;
  status: string;
  updated_at: string;
  data: unknown;
}

const firstName = (full: string) => full.trim().split(/\s+/)[0];

/** The line under the greeting: where the user's wills have got to. */
function standing(wills: WillSummary[]): string {
  if (wills.length === 0) return "You have not started your will yet.";
  const one = wills.length === 1;
  if (wills.every((w) => w.generated)) {
    return one
      ? "Your will is written. One step is left before it counts."
      : "Your wills are written. One step is left before each of them counts.";
  }
  return `${
    one ? "Your will is not finished yet." : "Not all of your wills are finished yet."
  } What you have answered so far is saved.`;
}

const smallCard = "card flex flex-col gap-[14px] p-[clamp(24px,3vw,36px)]";
const smallCardHeading = "text-[24px] leading-[1.3] font-bold tracking-[-0.02em]";

export default async function Dashboard({
  searchParams,
}: {
  searchParams: Promise<{ upgraded?: string }>;
}) {
  const user = await getSessionUser();
  if (!user) redirect("/login");

  const { upgraded } = await searchParams;
  const wills = await query<WillRow>(
    `select id, label, status, updated_at, data from wills where user_id = $1 order by created_at`,
    [user.id]
  );

  // a spouse's mirror will can be started from any will that names one spouse,
  // unless that spouse already has a will here
  const answers = wills.map((w) => ({ id: w.id, data: normalizeWillData(w.data) }));
  const testators = new Set(answers.map((a) => a.data.fullName.trim().toLowerCase()));
  const mirrorable = answers.filter(
    (a) => canMirror(a.data) && !testators.has(a.data.spouseName.trim().toLowerCase())
  );

  const summaries = wills.map((w, i) => summariseWill(w, answers[i].data, user.is_premium));
  const generated = summaries.filter((s) => s.generated);
  // a mirror will is part of the paid pack, so only paid accounts are offered one
  const mirrors = user.is_premium ? mirrorable : [];

  const pounds = PREMIUM_PRICE_PENCE / 100;
  const price = `£${Number.isInteger(pounds) ? pounds : pounds.toFixed(2)}`;

  return (
    <>
      <AppHeader />
      <main className="mx-auto flex w-full max-w-[1120px] flex-col gap-7 px-[clamp(20px,4vw,48px)] pt-14 pb-24">
        <div>
          <h1 className="h-page">As-salamu alaykum, {firstName(user.full_name)}</h1>
          <p className="mt-2.5 text-ink-soft">{standing(summaries)}</p>
        </div>

        {upgraded && (
          <p role="status" className="rounded-[14px] bg-emerald-tint px-5 py-4 text-[17px]">
            <strong>JazakAllahu khayran — your upgrade is complete.</strong>{" "}
            The bequests, religious debts and letter-of-wishes steps are now
            unlocked in your will, and your document pack includes the
            executor guidance and estate checklist.
          </p>
        )}

        {wills.length === 0 && (
          <section className="card flex flex-col items-start gap-[14px]">
            <h2 className="text-[28px] leading-[1.3] font-bold tracking-[-0.02em]">
              Your will awaits
            </h2>
            <p className="max-w-[560px] text-ink-soft">
              About 15 minutes of gentle questions. You can stop at any
              point — everything saves as you go.
            </p>
            <div className="mt-2.5">
              <NewWillButton label="Begin my will" className="btn-primary btn-lg" />
            </div>
            <p className="text-[16px] text-ink-mute">
              {user.is_premium
                ? "Complete Will Pack — lifetime access."
                : "Free plan — one Essential Will included."}
            </p>
          </section>
        )}

        {summaries.map((s) => (
          <WillCard key={s.id} will={s} />
        ))}

        {(generated.length > 0 || mirrors.length > 0) && (
          <div className="grid grid-cols-[repeat(auto-fit,minmax(min(320px,100%),1fr))] gap-7">
            {generated.length > 0 && (
              <section className={smallCard}>
                <h2 className={smallCardHeading}>Has anything changed?</h2>
                <p className="text-ink-soft">
                  A birth, a death, a marriage, a divorce or a new home can all
                  change the shares. Marriage cancels an earlier will altogether.
                </p>
                {generated.length === 1 ? (
                  <Link
                    href={`/will/${generated[0].id}/edit`}
                    className="btn-ghost mt-auto self-start"
                  >
                    Update my will
                  </Link>
                ) : (
                  // with several wills, the update starts from the will it affects
                  <p className="text-[16px] font-semibold">
                    Choose &ldquo;Change my answers&rdquo; on the will it affects.
                  </p>
                )}
              </section>
            )}

            {mirrors.map((m) => {
              const spouse = m.data.spouseName.trim();
              const name = firstName(spouse);
              // the mirror will is for the other spouse, so a man's is for his wife
              const wife = m.data.sex === "male";
              return (
                <section key={m.id} className={smallCard}>
                  <h2 className={smallCardHeading}>A will for {name}</h2>
                  <p className="text-ink-soft">
                    {wife ? "Her" : "His"} mirror will starts from the answers you
                    share: your address, your children and their guardians.{" "}
                    {wife ? "She adds her" : "He adds his"} own parents and wishes.
                  </p>
                  <div className="mt-auto">
                    <NewWillButton
                      mirrorOf={m.id}
                      label={`Create ${name}’s will`}
                      ariaLabel={`Create ${name}’s will, a mirror will for ${spouse}`}
                      className="btn-dark px-5"
                    />
                  </div>
                </section>
              );
            })}
          </div>
        )}

        {wills.length > 0 && (
          <PlanPanel
            isPremium={user.is_premium}
            price={price}
            spouseFirstName={
              mirrorable.length > 0 ? firstName(mirrorable[0].data.spouseName) : undefined
            }
          />
        )}
      </main>
    </>
  );
}
