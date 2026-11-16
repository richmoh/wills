"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  AuthField,
  AuthHeading,
  authFoot,
  authFootLink,
  authStack,
  authSubmit,
} from "./AuthShell";

const errorBox = "note-error text-[17px]";
const footLink = `${authFootLink} font-bold`;

/** Step one: ask for the email address and send a reset link to it. */
export function ForgotPasswordForm() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);
  // only ever returned by a development server with no email provider set up
  const [devResetUrl, setDevResetUrl] = useState<string | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/auth/forgot", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(body.error ?? "Something went wrong — please try again.");
        setBusy(false);
        return;
      }
      setDevResetUrl(typeof body.devResetUrl === "string" ? body.devResetUrl : null);
      setSent(true);
    } catch {
      setError("Could not reach the server — please try again.");
      setBusy(false);
    }
  };

  if (sent) {
    return (
      <div className={authStack} role="status">
        <AuthHeading title="Check your email">
          If there is a Wasiyyah account for{" "}
          <strong className="text-ink [overflow-wrap:anywhere]">{email}</strong>, we have
          sent it a link to choose a new password. The link works once and
          expires in one hour.
        </AuthHeading>
        <p className="text-ink-soft">
          Nothing arrived? Check your spam folder, or email
          hello@wasiyyahwills.com.
        </p>
        {devResetUrl && (
          <p className="note-warn text-[16px]">
            Development only: no email was sent.{" "}
            <a id="dev-reset-link" href={devResetUrl} className="font-bold">
              Open the reset link
            </a>
          </p>
        )}
        <p className={authFoot}>
          <Link href="/login" className={footLink}>
            Back to sign in
          </Link>
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className={authStack}>
      <AuthHeading title="Reset your password">
        Enter the email you signed up with and we will send you a link to
        choose a new password.
      </AuthHeading>
      <AuthField
        id="email"
        label="Email address"
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        autoComplete="email"
        placeholder="you@example.com"
        required
      />
      {error && (
        <p className={errorBox} role="alert">
          {error}
        </p>
      )}
      <button type="submit" disabled={busy} className={authSubmit}>
        {busy ? "One moment…" : "Send reset link"}
      </button>
      <p className={authFoot}>
        Remembered it?{" "}
        <Link href="/login" className={footLink}>
          Sign in
        </Link>
      </p>
    </form>
  );
}

/** Step two: the emailed link lands here with its token; choose a new password. */
export function ResetPasswordForm({ token }: { token: string }) {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  // the link itself was refused (used, expired or malformed), not the password
  const [linkRefused, setLinkRefused] = useState(false);
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/auth/reset", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(body.error ?? "Something went wrong — please try again.");
        setLinkRefused(body.invalidLink === true);
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

  if (!token) {
    return (
      <div className={authStack}>
        <AuthHeading title="This link is incomplete">
          Open the link from your password reset email again, or ask for a new
          one.
        </AuthHeading>
        <Link href="/forgot-password" className={authSubmit}>
          Send a new reset link
        </Link>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className={authStack}>
      <AuthHeading title="Choose a new password">
        Once it is saved you will be signed in here, and signed out everywhere
        else.
      </AuthHeading>
      <AuthField
        id="password"
        label="New password"
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        autoComplete="new-password"
        minLength={8}
        maxLength={200}
        hint="At least 8 characters."
        required
      />
      {error && (
        <p className={errorBox} role="alert">
          {error}
          {linkRefused && (
            <>
              {" "}
              <Link href="/forgot-password" className="font-bold">
                Send a new reset link
              </Link>
            </>
          )}
        </p>
      )}
      <button type="submit" disabled={busy} className={authSubmit}>
        {busy ? "One moment…" : "Save new password"}
      </button>
    </form>
  );
}
