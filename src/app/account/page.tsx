import Link from "next/link";
import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth";
import { AccountSettings } from "@/components/AccountSettings";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";

export const metadata = { title: "Your account" };

export default async function AccountPage() {
  const user = await getSessionUser();
  if (!user) redirect("/login");

  return (
    <>
      <SiteHeader />
      <main className="flex-1">
        <div className="mx-auto max-w-2xl px-4 py-12 sm:px-6">
          <Link href="/dashboard" className="text-sm font-medium text-ink/55 hover:text-forest-800">
            ← My wills
          </Link>
          <h1 className="mt-3 font-display text-3xl font-semibold text-forest-900">
            Your account
          </h1>
          <AccountSettings
            fullName={user.full_name}
            email={user.email}
            isPremium={user.is_premium}
          />
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
