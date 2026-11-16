"use client";

import { useId } from "react";
import type { Person } from "@/lib/will-types";

/**
 * The interview's controls. Every one is at least 48px tall, because many of
 * the people filling this in are older and on a phone.
 */

export function TextField({
  label,
  value,
  onChange,
  placeholder,
  type = "text",
  hint,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  type?: string;
  hint?: string;
}) {
  const id = useId();
  return (
    <div>
      <label htmlFor={id} className="label">
        {label}
      </label>
      <input
        id={id}
        type={type}
        className="input"
        value={value}
        placeholder={placeholder}
        aria-describedby={hint ? `${id}-hint` : undefined}
        onChange={(e) => onChange(e.target.value)}
      />
      {hint && (
        <p id={`${id}-hint`} className="hint mt-2">
          {hint}
        </p>
      )}
    </div>
  );
}

const STEP_BUTTON =
  "flex h-12 w-12 flex-none items-center justify-center rounded-xl border-[1.5px] border-field bg-white text-[24px] leading-none font-semibold text-ink hover:border-ink disabled:border-line disabled:bg-stone disabled:text-ink-faint md:h-14 md:w-14 md:rounded-[14px] md:text-[28px]";

/**
 * A count with a − and a + button. On a phone it is a white row with the
 * label on the left; on a wider screen the label sits above the buttons.
 */
export function CountField({
  label,
  value,
  onChange,
  max = 12,
  hint,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
  max?: number;
  hint?: string;
}) {
  return (
    <div
      role="group"
      aria-label={label}
      className="flex items-center justify-between gap-3 rounded-[14px] border border-line bg-white px-3.5 py-3 md:block md:rounded-none md:border-0 md:bg-transparent md:p-0"
    >
      <div className="min-w-0">
        <p className="leading-snug font-bold">{label}</p>
        {hint && <p className="text-[14px] text-ink-soft md:text-[16px]">{hint}</p>}
      </div>
      <div className="flex flex-none items-center gap-2 md:mt-2.5 md:gap-3.5">
        <button
          type="button"
          aria-label={`decrease ${label}`}
          className={STEP_BUTTON}
          disabled={value <= 0}
          onClick={() => onChange(value - 1)}
        >
          &minus;
        </button>
        <span
          className="w-7 text-center text-[24px] font-extrabold tabular-nums md:w-10 md:text-[30px]"
          aria-live="polite"
        >
          {value}
        </span>
        <button
          type="button"
          aria-label={`increase ${label}`}
          className={STEP_BUTTON}
          disabled={value >= max}
          onClick={() => onChange(value + 1)}
        >
          +
        </button>
      </div>
    </div>
  );
}

const pill = (on: boolean) =>
  `min-h-[52px] rounded-[14px] border-[1.5px] px-5 py-2.5 text-left text-[17px] leading-snug font-bold transition-colors ${
    on
      ? "border-emerald bg-emerald text-white"
      : "border-field bg-white text-ink hover:border-ink"
  }`;

function GroupLabel({ label, hint }: { label: string; hint?: string }) {
  return (
    <div className="mb-3">
      <p className="leading-snug font-bold">{label}</p>
      {hint && <p className="mt-0.5 text-[16px] text-ink-soft">{hint}</p>}
    </div>
  );
}

export function YesNo({
  label,
  value,
  onChange,
  hint,
}: {
  label: string;
  value: boolean;
  onChange: (v: boolean) => void;
  hint?: string;
}) {
  return (
    <div role="group" aria-label={label}>
      <GroupLabel label={label} hint={hint} />
      <div className="flex gap-2.5">
        {[
          { v: true, t: "Yes" },
          { v: false, t: "No" },
        ].map(({ v, t }) => (
          <button
            key={t}
            type="button"
            aria-pressed={value === v}
            onClick={() => onChange(v)}
            className={`${pill(value === v)} min-w-[88px] !text-center`}
          >
            {t}
          </button>
        ))}
      </div>
    </div>
  );
}

export function ChoiceField<T extends string>({
  label,
  value,
  onChange,
  options,
  hint,
}: {
  label: string;
  value: T;
  onChange: (v: T) => void;
  options: { value: T; label: string }[];
  hint?: string;
}) {
  return (
    <div role="group" aria-label={label}>
      <GroupLabel label={label} hint={hint} />
      <div className="flex flex-wrap gap-2.5">
        {options.map((o) => (
          <button
            key={o.value}
            type="button"
            aria-pressed={value === o.value}
            onClick={() => onChange(o.value)}
            className={pill(value === o.value)}
          >
            {o.label}
          </button>
        ))}
      </div>
    </div>
  );
}

/** The quiet "Remove" control on a repeated block. */
export function RemoveButton({ onClick, label }: { onClick: () => void; label: string }) {
  return (
    <button
      type="button"
      aria-label={label}
      className="-my-2 min-h-11 px-1 text-[16px] font-bold text-ink-soft underline underline-offset-[0.18em] hover:text-clay"
      onClick={onClick}
    >
      Remove
    </button>
  );
}

/** A block that repeats: one executor, one guardian, one bequest. */
export const REPEAT_BLOCK = "rounded-[20px] border border-line bg-white p-5 md:bg-stone";

export function PersonListEditor({
  people,
  onChange,
  max,
  addLabel,
  relationshipPlaceholder = "e.g. brother, friend, imam",
}: {
  people: Person[];
  onChange: (p: Person[]) => void;
  max: number;
  addLabel: string;
  relationshipPlaceholder?: string;
}) {
  const update = (i: number, patch: Partial<Person>) => {
    const next = people.map((p, j) => (j === i ? { ...p, ...patch } : p));
    onChange(next);
  };
  return (
    <div className="flex flex-col gap-4">
      {people.map((p, i) => (
        <div key={i} className={REPEAT_BLOCK}>
          <div className="mb-4 flex items-center justify-between gap-4">
            <span className="font-bold">Person {i + 1}</span>
            <RemoveButton
              label={`Remove person ${i + 1}`}
              onClick={() => onChange(people.filter((_, j) => j !== i))}
            />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <TextField label="Full name" value={p.name} onChange={(v) => update(i, { name: v })} />
            <TextField
              label="Relationship to you"
              value={p.relationship ?? ""}
              onChange={(v) => update(i, { relationship: v })}
              placeholder={relationshipPlaceholder}
            />
          </div>
          <div className="mt-4">
            <TextField
              label="Address"
              value={p.address ?? ""}
              onChange={(v) => update(i, { address: v })}
              placeholder="Street, town, postcode"
            />
          </div>
        </div>
      ))}
      {people.length < max && (
        <button
          type="button"
          className="btn-ghost self-start"
          onClick={() => onChange([...people, { name: "", relationship: "", address: "" }])}
        >
          + {addLabel}
        </button>
      )}
    </div>
  );
}

export function NameList({
  label,
  names,
  count,
  onChange,
}: {
  label: string;
  names: string[];
  count: number;
  onChange: (names: string[]) => void;
}) {
  if (count === 0) return null;
  const padded = Array.from({ length: count }, (_, i) => names[i] ?? "");
  return (
    <div>
      <p className="leading-snug font-bold">{label}</p>
      <p className="mt-0.5 mb-3 text-[16px] text-ink-soft">
        Optional, so your will can name them.
      </p>
      <div className="grid gap-2.5 sm:grid-cols-2">
        {padded.map((n, i) => (
          <input
            key={i}
            className="input"
            value={n}
            aria-label={`${label} ${i + 1}`}
            placeholder={count > 1 ? `Name ${i + 1}` : "Full name"}
            onChange={(e) => {
              const next = [...padded];
              next[i] = e.target.value;
              onChange(next);
            }}
          />
        ))}
      </div>
    </div>
  );
}
