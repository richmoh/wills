import { ForgotPasswordForm } from "@/components/PasswordResetForms";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";

export const metadata = { title: "Reset your password" };

export default function ForgotPasswordPage() {
  return (
    <>
      <SiteHeader />
      <main className="flex flex-1 items-center px-4 py-16">
        <ForgotPasswordForm />
      </main>
      <SiteFooter />
    </>
  );
}
