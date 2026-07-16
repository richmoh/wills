import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth";
import { AuthForm } from "@/components/AuthForm";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";

export const metadata = { title: "Create your account" };

export default async function SignupPage() {
  if (await getSessionUser()) redirect("/dashboard");
  return (
    <>
      <SiteHeader />
      <main className="flex flex-1 items-center px-4 py-16">
        <AuthForm mode="signup" />
      </main>
      <SiteFooter />
    </>
  );
}
