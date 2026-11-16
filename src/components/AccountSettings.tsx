"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function AccountSettings({
  fullName,
  email,
  isPremium,
}: {
  fullName: string;
  email: string;
  isPremium: boolean;
}) {
  return (
    <div className="mt-8 space-y-4">
      <section className="card">
        <h2 className="font-display text-lg font-semibold text-forest-900">Your details</h2>
        <dl className="mt-4 space-y-3 text-sm">
          <div className="flex flex-wrap justify-between gap-x-6 gap-y-1">
            <dt className="text-ink/55">Name</dt>
            <dd className="font-medium text-ink">{fullName}</dd>
          </div>
          <div className="flex flex-wrap justify-between gap-x-6 gap-y-1">
            <dt className="text-ink/55">Email</dt>
            <dd className="font-medium text-ink">{email}</dd>
          </div>
          <div className="flex flex-wrap justify-between gap-x-6 gap-y-1">
            <dt className="text-ink/55">Plan</dt>
            <dd className="font-medium text-ink">
              {isPremium ? "Complete Will Pack — lifetime access" : "Free — one Essential Will"}
            </dd>
          </div>
        </dl>
      </section>

      <section className="card">
        <h2 className="font-display text-lg font-semibold text-forest-900">Your data</h2>
        <p className="mt-2 text-sm leading-6 text-ink/65">
          Download a copy of your account details, the answers in each of
          your wills, and your payment records, as a single file.
        </p>
        <a href="/api/account/export" className="btn-ghost mt-4 !py-2.5">
          Download my data
        </a>
      </section>

      <DeleteAccount />
    </div>
  );
}

function DeleteAccount() {
  const router = useRouter();
  const [confirming, setConfirming] = useState(false);
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const cancel = () => {
    setConfirming(false);
    setPassword("");
    setError(null);
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/account", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(body.error ?? "Something went wrong — your account has not been deleted.");
        setBusy(false);
        return;
      }
      router.push("/");
      router.refresh();
    } catch {
      setError("Could not reach the server — your account has not been deleted.");
      setBusy(false);
    }
  };

  return (
    <section className="card border-red-200">
      <h2 className="font-display text-lg font-semibold text-forest-900">Delete your account</h2>
      <p className="mt-2 text-sm leading-6 text-ink/65">
        This permanently deletes your account, every will and document in it,
        and your payment records. It cannot be undone, and a paid Complete
        Will Pack does not carry over to a new account. A will you have
        already printed and signed is not affected.
      </p>

      {!confirming ? (
        <button
          id="delete-account-start"
          type="button"
          className="mt-4 text-sm font-semibold text-red-700 hover:underline"
          onClick={() => setConfirming(true)}
        >
          Delete my account
        </button>
      ) : (
        <form onSubmit={submit} className="mt-5 border-t border-ink/8 pt-5">
          <label className="label" htmlFor="delete-password">
            Enter your password to confirm
          </label>
          <input
            id="delete-password"
            type="password"
            className="input"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="current-password"
            maxLength={200}
            required
          />
          {error && (
            <p className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800" role="alert">
              {error}
            </p>
          )}
          <div className="mt-5 flex flex-wrap items-center gap-4">
            <button
              type="submit"
              disabled={busy}
              className="inline-flex items-center justify-center rounded-full bg-red-700 px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-red-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-700 disabled:opacity-50"
            >
              {busy ? "Deleting…" : "Delete my account permanently"}
            </button>
            <button
              type="button"
              className="text-sm font-medium text-ink/55 hover:text-forest-800"
              onClick={cancel}
            >
              Keep my account
            </button>
          </div>
        </form>
      )}
    </section>
  );
}
