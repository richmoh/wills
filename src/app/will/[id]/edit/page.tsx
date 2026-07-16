import { redirect, notFound } from "next/navigation";
import { getSessionUser } from "@/lib/auth";
import { queryOne } from "@/lib/db";
import { emptyCensus } from "@/lib/faraid/types";
import { emptyWillData, type WillData } from "@/lib/will-types";
import { SiteHeader } from "@/components/SiteHeader";
import { WillWizard } from "@/components/wizard/WillWizard";

export const metadata = { title: "Your will interview" };

export default async function EditWillPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await getSessionUser();
  if (!user) redirect("/login");

  const { id } = await params;
  const will = await queryOne<{ id: string; data: Partial<WillData> }>(
    `select id, data from wills where id = $1 and user_id = $2`,
    [id, user.id]
  );
  if (!will) notFound();

  // merge stored data over fresh defaults so older drafts survive schema growth
  const defaults = emptyWillData();
  const data: WillData = {
    ...defaults,
    ...will.data,
    census: { ...emptyCensus(), ...(will.data.census ?? {}) },
    religiousDebts: { ...defaults.religiousDebts, ...(will.data.religiousDebts ?? {}) },
    complexity: { ...defaults.complexity, ...(will.data.complexity ?? {}) },
  };

  return (
    <>
      <SiteHeader />
      <main className="flex-1 pt-4">
        <WillWizard willId={will.id} initialData={data} isPremium={user.is_premium} />
      </main>
    </>
  );
}
