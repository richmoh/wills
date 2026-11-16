"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  AuthField,
  AuthHeading,
  Dot,
  authFoot,
  authFootLink,
  authStack,
  authSubmit,
} from "./AuthShell";

export function AuthForm({ mode }: { mode: "login" | "signup" }) {
  const router = useRouter();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [consent, setConsent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/auth/${mode}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(
          mode === "signup" ? { fullName, email, password, consent } : { email, password }
        ),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(body.error ?? "Something went wrong — please try again.");
        setBusy(false);
        return;
      }
      router.push("/dashboard");
      router.refresh();
    } catch {
      setError("Could not reach the server — please try again.");
      setBusy(false);
    }
  };

  const signup = mode === "signup";

  return (
    <form onSubmit={submit} className={authStack}>
      {signup ? (
        <AuthHeading title="Start your will">
          Free, and no card needed. Your answers save as you go, so you can stop
          and come back.
        </AuthHeading>
      ) : (
        <AuthHeading title="Welcome back">Sign in to continue your will.</AuthHeading>
      )}

      {signup && (
        <AuthField
          id="fullName"
          label="Your full name"
          type="text"
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          autoComplete="name"
          required
        />
      )}
      <AuthField
        id="email"
        label="Email address"
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        autoComplete="email"
        placeholder="you@example.com"
        hint={
          signup
            ? "Check it carefully: this is how you get back in to update your will."
            : undefined
        }
        required
      />
      <AuthField
        id="password"
        label={signup ? "Choose a password" : "Password"}
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        autoComplete={signup ? "new-password" : "current-password"}
        minLength={signup ? 8 : undefined}
        maxLength={200}
        hint={signup ? "At least 8 characters." : undefined}
        required
      />

      {signup && (
        <label
          htmlFor="consent"
          className="flex items-start gap-[14px] rounded-[14px] border border-line bg-white p-4 text-[16px] leading-normal"
        >
          <input
            id="consent"
            type="checkbox"
            className="mt-px h-6 w-6 flex-none accent-emerald"
            checked={consent}
            onChange={(e) => setConsent(e.target.checked)}
            required
          />
          <span>
            I understand Wasiyyah will store my answers, which reveal my
            religion and details about my family, so it can prepare and keep my
            will. I consent to this.{" "}
            <Link href="/legal/privacy" target="_blank" className="font-semibold">
              Privacy policy
            </Link>
          </span>
        </label>
      )}

      {error && (
        <p className="note-error text-[17px]" role="alert">
          {error}
        </p>
      )}

      <button type="submit" disabled={busy} className={authSubmit}>
        {busy ? "One moment…" : signup ? "Create my account and begin" : "Sign in"}
      </button>

      <p className={authFoot}>
        {signup ? (
          <>
            Already started?{" "}
            <Link href="/login" className={`${authFootLink} font-bold`}>
              Sign in
            </Link>
          </>
        ) : (
          <>
            New here?{" "}
            <Link href="/signup" className={`${authFootLink} font-bold`}>
              Create an account
            </Link>
          </>
        )}
        <Dot />
        <Link href="/forgot-password" className={`${authFootLink} font-semibold`}>
          Forgot your password?
        </Link>
      </p>
    </form>
  );
}
