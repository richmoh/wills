"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

const errorBox =
  "mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800";
const textLink = "font-semibold text-forest-800 hover:underline";

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
      <div className="card mx-auto w-full max-w-md" role="status">
        <h1 className="font-display text-2xl font-semibold text-forest-900">
          Check your email
        </h1>
        <p className="mt-3 text-sm leading-6 text-ink/70">
          If there is a Wasiyyah account for <strong>{email}</strong>, we have
          sent it a link to choose a new password. The link works once and
          expires in one hour.
        </p>
        <p className="mt-3 text-sm leading-6 text-ink/70">
          Nothing arrived? Check your spam folder, or email
          support@themuslimguide.org.
        </p>
        {devResetUrl && (
          <p className="mt-4 rounded-xl border border-gold-300 bg-gold-100/70 px-4 py-3 text-sm text-ink/80">
            Development only — no email was sent.{" "}
            <a id="dev-reset-link" href={devResetUrl} className={textLink}>
              Open the reset link
            </a>
          </p>
        )}
        <p className="mt-6 text-center text-sm text-ink/60">
          <Link href="/login" className={textLink}>Back to sign in</Link>
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="card mx-auto w-full max-w-md">
      <h1 className="font-display text-2xl font-semibold text-forest-900">
        Reset your password
      </h1>
      <p className="mt-1.5 text-sm text-ink/60">
        Enter the email you signed up with and we will send you a link to
        choose a new password.
      </p>
      <div className="mt-6">
        <label className="label" htmlFor="email">Email</label>
        <input
          id="email"
          type="email"
          className="input"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          autoComplete="email"
          required
        />
      </div>
      {error && <p className={errorBox} role="alert">{error}</p>}
      <button type="submit" disabled={busy} className="btn-primary mt-6 w-full">
        {busy ? "One moment…" : "Send reset link"}
      </button>
      <p className="mt-4 text-center text-sm text-ink/60">
        Remembered it? <Link href="/login" className={textLink}>Sign in</Link>
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
      <div className="card mx-auto w-full max-w-md">
        <h1 className="font-display text-2xl font-semibold text-forest-900">
          This link is incomplete
        </h1>
        <p className="mt-3 text-sm leading-6 text-ink/70">
          Open the link from your password reset email again, or ask for a new
          one.
        </p>
        <Link href="/forgot-password" className="btn-primary mt-6 w-full">
          Send a new reset link
        </Link>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="card mx-auto w-full max-w-md">
      <h1 className="font-display text-2xl font-semibold text-forest-900">
        Choose a new password
      </h1>
      <p className="mt-1.5 text-sm text-ink/60">
        Once it is saved you will be signed in here, and signed out everywhere
        else.
      </p>
      <div className="mt-6">
        <label className="label" htmlFor="password">New password</label>
        <input
          id="password"
          type="password"
          className="input"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          autoComplete="new-password"
          minLength={8}
          maxLength={200}
          required
        />
        <p className="mt-1.5 text-xs text-ink/50">At least 8 characters.</p>
      </div>
      {error && (
        <p className={errorBox} role="alert">
          {error}
          {linkRefused && (
            <>
              {" "}
              <Link href="/forgot-password" className="font-semibold underline">
                Send a new reset link
              </Link>
            </>
          )}
        </p>
      )}
      <button type="submit" disabled={busy} className="btn-primary mt-6 w-full">
        {busy ? "One moment…" : "Save new password"}
      </button>
    </form>
  );
}
