import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth";
import { AuthForm } from "@/components/AuthForm";
import { AuthShell, type AuthPanel } from "@/components/AuthShell";

export const metadata = { title: "Create your account" };

const panel: AuthPanel = {
  heading: "What happens next",
  kind: "steps",
  points: [
    {
      title: "A few questions about your family",
      text: "Who is living: spouse, children, parents. We only ask about relatives who could inherit.",
    },
    {
      title: "The people you trust",
      text: "An executor to carry out your will, and guardians if you have children under 18.",
    },
    {
      title: "Your will, ready to sign",
      text: "Print it, then sign it with two witnesses who are not in it. We show you exactly how.",
    },
  ],
  closing:
    "Useful to have nearby: the full names and addresses of the people you want as executors.",
};

export default async function SignupPage() {
  if (await getSessionUser()) redirect("/dashboard");
  return (
    <AuthShell panel={panel}>
      <AuthForm mode="signup" />
    </AuthShell>
  );
}
