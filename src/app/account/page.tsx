import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth";
import { AccountSettings } from "@/components/AccountSettings";
import { AppHeader } from "@/components/AppHeader";

export const metadata = { title: "Your account" };

export default async function AccountPage() {
  const user = await getSessionUser();
  if (!user) redirect("/login");

  return (
    <>
      <AppHeader />
      {/* the same column as My wills, so the header does not shift between the two */}
      <main className="mx-auto flex w-full max-w-[1120px] flex-col gap-7 px-[clamp(20px,4vw,48px)] pt-14 pb-24">
        <h1 className="h-page">Your account</h1>
        <AccountSettings
          fullName={user.full_name}
          email={user.email}
          isPremium={user.is_premium}
        />
      </main>
    </>
  );
}
