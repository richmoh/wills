"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function NewWillButton({
  label = "Start a new will",
  mirrorOf,
  className = "btn-primary",
}: {
  label?: string;
  /** create the spouse's will, pre-filled from this will */
  mirrorOf?: string;
  className?: string;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const create = async () => {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/wills", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(mirrorOf ? { mirrorOf } : {}),
      });
      const body = await res.json().catch(() => ({}));
      if (res.ok) {
        router.push(`/will/${body.id}/edit`);
        return;
      }
      setError(body.error ?? "Could not create a will — please try again.");
    } catch {
      setError("Could not reach the server — please check your connection and try again.");
    }
    setBusy(false);
  };

  return (
    <div>
      <button onClick={create} disabled={busy} className={className}>
        {busy ? "One moment…" : label}
      </button>
      {error && (
        <p className="mt-3 max-w-md rounded-xl border border-gold-300 bg-gold-100/70 px-4 py-3 text-sm text-ink/80">
          {error}
        </p>
      )}
    </div>
  );
}

export function UpgradeButton({ className = "btn-gold" }: { className?: string }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const upgrade = async () => {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/stripe/checkout", { method: "POST" });
      const body = await res.json().catch(() => ({}));
      if (res.ok && body.url) {
        window.location.href = body.url;
        return;
      }
      if (res.status === 401) {
        window.location.href = "/signup";
        return;
      }
      setError(body.error ?? "Could not start checkout — please try again.");
    } catch {
      setError("Could not reach the server — please check your connection and try again.");
    }
    setBusy(false);
  };

  return (
    <div>
      <button onClick={upgrade} disabled={busy} className={className}>
        {busy ? "One moment…" : "Get the Complete Will Pack"}
      </button>
      {error && <p className="mt-2 text-sm text-red-700">{error}</p>}
    </div>
  );
}

export function LogoutButton() {
  const router = useRouter();
  return (
    <button
      className="text-sm font-medium text-ink/55 hover:text-forest-800"
      onClick={async () => {
        await fetch("/api/auth/logout", { method: "POST" });
        router.push("/");
        router.refresh();
      }}
    >
      Sign out
    </button>
  );
}

export function DeleteWillButton({ willId }: { willId: string }) {
  const router = useRouter();
  const [confirming, setConfirming] = useState(false);
  if (!confirming) {
    return (
      <button
        className="text-xs font-medium text-ink/45 hover:text-red-700"
        onClick={() => setConfirming(true)}
      >
        Delete
      </button>
    );
  }
  return (
    <span className="text-xs">
      Delete this will?{" "}
      <button
        className="font-semibold text-red-700 hover:underline"
        onClick={async () => {
          await fetch(`/api/wills/${willId}`, { method: "DELETE" });
          router.refresh();
        }}
      >
        Yes, delete
      </button>{" "}
      ·{" "}
      <button className="font-medium text-ink/55 hover:underline" onClick={() => setConfirming(false)}>
        Keep it
      </button>
    </span>
  );
}
