"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function NewWillButton({
  label = "Start a new will",
  mirrorOf,
  className = "btn-primary",
  ariaLabel,
}: {
  label?: string;
  /** create the spouse's will, pre-filled from this will */
  mirrorOf?: string;
  className?: string;
  /** a fuller name for assistive technology; it should begin with the label */
  ariaLabel?: string;
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
      <button
        type="button"
        onClick={create}
        disabled={busy}
        aria-label={ariaLabel}
        className={className}
      >
        {busy ? "One moment…" : label}
      </button>
      {error && (
        <p role="alert" className="note-warn mt-3 max-w-md text-[16px]">
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
      <button type="button" onClick={upgrade} disabled={busy} className={className}>
        {busy ? "One moment…" : "Get the Complete Will Pack"}
      </button>
      {/* a white panel, so it reads on the dark panels this button sits in as well */}
      {error && (
        <p role="alert" className="note-error mt-3 max-w-md text-[16px]">
          {error}
        </p>
      )}
    </div>
  );
}

export function DeleteWillButton({ willId }: { willId: string }) {
  const router = useRouter();
  const [confirming, setConfirming] = useState(false);
  if (!confirming) {
    return (
      <button
        type="button"
        className="min-h-11 text-[16px] font-semibold text-ink-mute underline underline-offset-[0.18em] hover:text-clay"
        onClick={() => setConfirming(true)}
      >
        Delete this will
      </button>
    );
  }
  return (
    <div
      role="group"
      aria-label="Delete this will?"
      className="flex flex-wrap items-center gap-x-4 gap-y-3 text-[16px]"
    >
      <span className="font-semibold">Delete this will?</span>
      <span className="flex flex-wrap gap-3">
        <button
          type="button"
          className="btn-ghost border-clay py-[9px] text-clay hover:border-clay hover:bg-clay hover:text-white"
          onClick={async () => {
            await fetch(`/api/wills/${willId}`, { method: "DELETE" });
            router.refresh();
          }}
        >
          Yes, delete
        </button>
        {/* focus lands on the safe choice, so the keyboard does not lose its place */}
        <button
          type="button"
          autoFocus
          className="btn-ghost py-[9px]"
          onClick={() => setConfirming(false)}
        >
          Keep it
        </button>
      </span>
    </div>
  );
}
