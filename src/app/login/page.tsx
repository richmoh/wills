import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth";
import { AuthForm } from "@/components/AuthForm";
import { AuthShell, type AuthPanel } from "@/components/AuthShell";

export const metadata = { title: "Sign in" };

const panel: AuthPanel = {
  heading: "Your will is where you left it",
  kind: "facts",
  points: [
    {
      title: "Your answers are saved",
      text: "Each one was saved as you went, so you can carry on from where you stopped.",
    },
    {
      title: "Change them when life changes",
      text: "A birth, a death, a marriage, a divorce or a new home can all change the shares.",
    },
    {
      title: "Print it again at any time",
      text: "Your will stays in your account. Open it and print a fresh copy whenever you need one.",
    },
  ],
  closing: "Until it is signed with two witnesses, a will has no legal effect.",
};

export default async function LoginPage() {
  if (await getSessionUser()) redirect("/dashboard");
  return (
    <AuthShell panel={panel}>
      <AuthForm mode="login" />
    </AuthShell>
  );
}
