import { ForgotPasswordForm } from "@/components/PasswordResetForms";
import { AuthShell, type AuthPanel } from "@/components/AuthShell";

export const metadata = { title: "Reset your password" };

// Every line here describes what /api/auth/forgot and /api/auth/reset do:
// change them together.
const panel: AuthPanel = {
  heading: "What happens next",
  kind: "steps",
  points: [
    {
      title: "We email you a link",
      text: "It goes to the address you enter, if there is a Wasiyyah account for it. Look for “Reset your Wasiyyah password”.",
    },
    {
      title: "Open it within the hour",
      text: "The link works once and expires after one hour. Asking again cancels any link you have not used.",
    },
    {
      title: "Choose a new password",
      text: "Once it is saved you are signed in here, and signed out everywhere else.",
    },
  ],
  closing: "Your password stays as it is until you save a new one.",
};

export default function ForgotPasswordPage() {
  return (
    <AuthShell panel={panel}>
      <ForgotPasswordForm />
    </AuthShell>
  );
}
