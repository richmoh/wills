import Link from "next/link";
import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth";
import { query } from "@/lib/db";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import {
  DeleteWillButton,
  LogoutButton,
  NewWillButton,
  UpgradeButton,
} from "@/components/DashboardActions";

export const metadata = { title: "My wills" };

interface WillRow {
  id: string;
  label: string;
  status: string;
  updated_at: string;
}

export default async function Dashboard({
  searchParams,
}: {
  searchParams: Promise<{ upgraded?: string }>;
}) {
  const user = await getSessionUser();
  if (!user) redirect("/login");

  const { upgraded } = await searchParams;
  const wills = await query<WillRow>(
    `select id, label, status, updated_at from wills where user_id = $1 order by created_at`,
    [user.id]
  );

  return (
    <>
      <SiteHeader />
      <main className="flex-1">
        <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h1 className="font-display text-3xl font-semibold text-forest-900">
                As-salamu alaykum, {user.full_name.split(" ")[0]}
              </h1>
              <p className="mt-1 text-sm text-ink/60">
                {user.is_premium ? (
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-gold-100 px-3 py-1 text-xs font-semibold text-gold-600">
                    ✦ Complete Will Pack — lifetime access
                  </span>
                ) : (
                  "Free plan — one Essential Will included."
                )}
              </p>
            </div>
            <LogoutButton />
          </div>

          {upgraded && (
            <div className="mt-6 rounded-2xl border border-forest-200 bg-forest-50 px-5 py-4 text-sm text-forest-800">
              <strong>JazakAllahu khayran — your upgrade is complete.</strong>{" "}
              The bequests, religious debts and letter-of-wishes steps are now
              unlocked in your will, and your document pack includes the
              executor guidance and estate checklist.
            </div>
          )}

          <div className="mt-8 space-y-4">
            {wills.length === 0 && (
              <div className="card text-center">
                <h2 className="font-display text-xl font-semibold text-forest-900">
                  Your will awaits
                </h2>
                <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-ink/60">
                  About 15 minutes of gentle questions. You can stop at any
                  point — everything saves as you go.
                </p>
                <div className="mt-5 flex justify-center">
                  <NewWillButton label="Begin my will" />
                </div>
              </div>
            )}

            {wills.map((w) => (
              <div key={w.id} className="card flex flex-wrap items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-3">
                    <h2 className="font-display text-lg font-semibold text-forest-900">
                      {w.label}
                    </h2>
                    <span
                      className={`rounded-full px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wide ${
                        w.status === "complete"
                          ? "bg-forest-100 text-forest-700"
                          : "bg-gold-100 text-gold-600"
                      }`}
                    >
                      {w.status === "complete" ? "Generated" : "Draft"}
                    </span>
                  </div>
                  <p className="mt-1 text-xs text-ink/50">
                    Last edited{" "}
                    {new Date(w.updated_at).toLocaleDateString("en-GB", {
                      day: "numeric",
                      month: "long",
                      year: "numeric",
                    })}
                  </p>
                </div>
                <div className="flex items-center gap-4">
                  <DeleteWillButton willId={w.id} />
                  {w.status === "complete" && (
                    <Link href={`/will/${w.id}/document`} className="btn-ghost !py-2">
                      View document
                    </Link>
                  )}
                  <Link href={`/will/${w.id}/edit`} className="btn-primary !py-2">
                    {w.status === "complete" ? "Update" : "Continue"}
                  </Link>
                </div>
              </div>
            ))}

            {wills.length > 0 && (
              <div className="pt-2">
                {user.is_premium ? (
                  <NewWillButton label="Start another will (e.g. your spouse's mirror will)" />
                ) : (
                  <div className="card flex flex-wrap items-center justify-between gap-4 border-gold-300/60 bg-gold-100/30">
                    <div className="max-w-lg">
                      <h3 className="font-display text-base font-semibold text-forest-900">
                        Complete Will Pack
                      </h3>
                      <p className="mt-1 text-sm leading-6 text-ink/65">
                        Charitable bequests, religious-debts schedule, letter of
                        wishes, executor guidance, the estate checklist, and a
                        mirror will for your spouse. One payment, yours for
                        life.
                      </p>
                    </div>
                    <UpgradeButton />
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
