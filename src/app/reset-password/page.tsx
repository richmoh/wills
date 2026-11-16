import { ResetPasswordForm } from "@/components/PasswordResetForms";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";

export const metadata = { title: "Choose a new password" };

export default async function ResetPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string | string[] }>;
}) {
  const { token } = await searchParams;
  return (
    <>
      <SiteHeader />
      <main className="flex flex-1 items-center px-4 py-16">
        <ResetPasswordForm token={typeof token === "string" ? token : ""} />
      </main>
      <SiteFooter />
    </>
  );
}
