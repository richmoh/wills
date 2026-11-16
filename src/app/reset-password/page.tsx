import { ResetPasswordForm } from "@/components/PasswordResetForms";
import { AuthShell, type AuthPanel } from "@/components/AuthShell";

export const metadata = { title: "Choose a new password" };

// Every line here describes what /api/auth/forgot and /api/auth/reset do:
// change them together.
const panel: AuthPanel = {
  heading: "About your reset link",
  kind: "facts",
  points: [
    {
      title: "It works once",
      text: "After you save a new password, the link cannot be used again.",
    },
    {
      title: "It lasts one hour",
      text: "After that it expires, and you will need to ask for a new one.",
    },
    {
      title: "Only the newest link works",
      text: "If you asked more than once, use the link in the latest email.",
    },
  ],
  closing: "Your old password stops working as soon as the new one is saved.",
};

export default async function ResetPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string | string[] }>;
}) {
  const { token } = await searchParams;
  return (
    <AuthShell panel={panel}>
      <ResetPasswordForm token={typeof token === "string" ? token : ""} />
    </AuthShell>
  );
}
