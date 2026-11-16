"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

const row =
  "flex flex-wrap justify-between gap-x-6 gap-y-0.5 border-t border-line py-3.5 first:border-t-0 first:pt-0 last:pb-0";

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
    <div className="flex max-w-[760px] flex-col gap-7">
      <section className="card">
        <h2 className="h-card">Your details</h2>
        <dl className="mt-5">
          <div className={row}>
            <dt className="text-ink-soft">Name</dt>
            <dd className="min-w-0 font-semibold break-words">{fullName}</dd>
          </div>
          <div className={row}>
            <dt className="text-ink-soft">Email</dt>
            <dd className="min-w-0 font-semibold break-words">{email}</dd>
          </div>
          <div className={row}>
            <dt className="text-ink-soft">Plan</dt>
            <dd className="min-w-0 font-semibold">
              {isPremium ? "Complete Will Pack — lifetime access" : "Free — one Essential Will"}
            </dd>
          </div>
        </dl>
      </section>

      <section className="card">
        <h2 className="h-card">Your data</h2>
        <p className="mt-2 text-ink-soft">
          Download a copy of your account details, the answers in each of
          your wills, and your payment records, as a single file.
        </p>
        <a href="/api/account/export" className="btn-ghost mt-5">
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
    <section className="card border-clay">
      <h2 className="h-card">Delete your account</h2>
      <p className="mt-2 text-ink-soft">
        This permanently deletes your account, every will and document in it,
        and your payment records. It cannot be undone, and a paid Complete
        Will Pack does not carry over to a new account. A will you have
        already printed and signed is not affected.
      </p>

      {!confirming ? (
        <button
          id="delete-account-start"
          type="button"
          className="btn-ghost mt-5 border-clay text-clay hover:border-clay hover:bg-clay hover:text-white"
          onClick={() => setConfirming(true)}
        >
          Delete my account
        </button>
      ) : (
        <form onSubmit={submit} className="mt-6 border-t border-line pt-6">
          <label className="label" htmlFor="delete-password">
            Enter your password to confirm
          </label>
          {/* focus moves here from the button this form replaces */}
          <input
            id="delete-password"
            type="password"
            className="input max-w-[440px]"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="current-password"
            maxLength={200}
            required
            autoFocus
          />
          {error && (
            <p className="note-error mt-4" role="alert">
              {error}
            </p>
          )}
          <div className="mt-6 flex flex-wrap items-center gap-3">
            <button
              type="submit"
              disabled={busy}
              className="btn-dark bg-clay enabled:hover:bg-ink disabled:bg-stone"
            >
              {busy ? "Deleting…" : "Delete my account permanently"}
            </button>
            <button type="button" className="btn-ghost" onClick={cancel}>
              Keep my account
            </button>
          </div>
        </form>
      )}
    </section>
  );
}
