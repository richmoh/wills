import { redirect, notFound } from "next/navigation";
import { getSessionUser } from "@/lib/auth";
import { queryOne } from "@/lib/db";
import { isUuid, normalizeWillData } from "@/lib/will-types";
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
  if (!isUuid(id)) notFound();
  const will = await queryOne<{ id: string; data: unknown }>(
    `select id, data from wills where id = $1 and user_id = $2`,
    [id, user.id]
  );
  if (!will) notFound();

  // stored answers are normalised so older drafts survive schema growth
  const data = normalizeWillData(will.data);

  // the interview draws its own header and its own <main>: the header shows
  // the save state, and the review step lays the page out differently
  return <WillWizard willId={will.id} initialData={data} isPremium={user.is_premium} />;
}
