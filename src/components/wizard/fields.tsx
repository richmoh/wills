"use client";

import type { Person } from "@/lib/will-types";

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
  return (
    <div>
      <label className="label">
        {label}
        {hint && <span className="ml-1 font-normal text-ink/45">— {hint}</span>}
      </label>
      <input
        type={type}
        className="input"
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  );
}

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
    <div>
      <span className="label">
        {label}
        {hint && <span className="ml-1 font-normal text-ink/45">— {hint}</span>}
      </span>
      <div className="inline-flex items-center gap-1 rounded-xl border border-ink/15 bg-white p-1">
        <button
          type="button"
          aria-label={`decrease ${label}`}
          className="h-9 w-9 rounded-lg text-lg font-semibold text-forest-800 transition hover:bg-forest-50 disabled:opacity-30"
          disabled={value <= 0}
          onClick={() => onChange(value - 1)}
        >
          −
        </button>
        <span className="w-10 text-center text-base font-semibold tabular-nums">
          {value}
        </span>
        <button
          type="button"
          aria-label={`increase ${label}`}
          className="h-9 w-9 rounded-lg text-lg font-semibold text-forest-800 transition hover:bg-forest-50 disabled:opacity-30"
          disabled={value >= max}
          onClick={() => onChange(value + 1)}
        >
          +
        </button>
      </div>
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
    <div>
      <span className="label">
        {label}
        {hint && <span className="ml-1 font-normal text-ink/45">— {hint}</span>}
      </span>
      <div className="inline-flex gap-2">
        {[
          { v: true, t: "Yes" },
          { v: false, t: "No" },
        ].map(({ v, t }) => (
          <button
            key={t}
            type="button"
            onClick={() => onChange(v)}
            className={`rounded-xl border px-6 py-2.5 text-sm font-semibold transition ${
              value === v
                ? "border-forest-700 bg-forest-800 text-white"
                : "border-ink/15 bg-white text-ink/70 hover:border-forest-600/50"
            }`}
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
    <div>
      <span className="label">
        {label}
        {hint && <span className="ml-1 font-normal text-ink/45">— {hint}</span>}
      </span>
      <div className="flex flex-wrap gap-2">
        {options.map((o) => (
          <button
            key={o.value}
            type="button"
            onClick={() => onChange(o.value)}
            className={`rounded-xl border px-4 py-2.5 text-sm font-semibold transition ${
              value === o.value
                ? "border-forest-700 bg-forest-800 text-white"
                : "border-ink/15 bg-white text-ink/70 hover:border-forest-600/50"
            }`}
          >
            {o.label}
          </button>
        ))}
      </div>
    </div>
  );
}

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
    <div className="space-y-4">
      {people.map((p, i) => (
        <div key={i} className="rounded-xl border border-ink/10 bg-paper p-4">
          <div className="mb-3 flex items-center justify-between">
            <span className="text-sm font-semibold text-forest-900">
              Person {i + 1}
            </span>
            <button
              type="button"
              className="text-xs font-medium text-ink/50 hover:text-red-700"
              onClick={() => onChange(people.filter((_, j) => j !== i))}
            >
              Remove
            </button>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <TextField label="Full name" value={p.name} onChange={(v) => update(i, { name: v })} />
            <TextField
              label="Relationship to you"
              value={p.relationship ?? ""}
              onChange={(v) => update(i, { relationship: v })}
              placeholder={relationshipPlaceholder}
            />
          </div>
          <div className="mt-3">
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
          className="btn-ghost !py-2.5 text-sm"
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
      <span className="label">{label} <span className="font-normal text-ink/45">— optional, so your will can name them</span></span>
      <div className="grid gap-2 sm:grid-cols-2">
        {padded.map((n, i) => (
          <input
            key={i}
            className="input"
            value={n}
            placeholder={`Name ${i + 1}`}
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
