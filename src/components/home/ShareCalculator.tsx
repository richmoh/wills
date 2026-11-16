"use client";

import Link from "next/link";
import { useId, useState } from "react";
import { ShareRing, StackedFraction, Swatch } from "@/components/Shares";
import { calculatorShares, type Family } from "./calculator-shares";

// A man with a wife, two sons, a daughter and his mother: the family the rest
// of the page works through.
const START: Family = {
  sex: "male",
  spouse: true,
  sons: 2,
  daughters: 1,
  father: false,
  mother: true,
};

const MOST_CHILDREN = 6;

const ROW_LABEL = "w-[92px] text-[15px] font-semibold text-ink-soft";

function Pill({
  pressed,
  onClick,
  children,
}: {
  pressed: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      aria-pressed={pressed}
      onClick={onClick}
      className={`min-h-[44px] rounded-[10px] border-[1.5px] px-4 text-[15px] font-semibold ${
        pressed
          ? "border-emerald bg-emerald text-white"
          : "border-line-strong bg-white text-ink"
      }`}
    >
      {children}
    </button>
  );
}

function Stepper({
  label,
  one,
  value,
  onChange,
}: {
  label: string;
  /** the singular, for the button names: "One more son" */
  one: string;
  value: number;
  onChange: (value: number) => void;
}) {
  const id = useId();
  const step =
    "h-11 w-11 rounded-[10px] border-[1.5px] border-line-strong bg-white text-[22px] font-semibold text-ink";
  return (
    <div role="group" aria-labelledby={id} className="flex items-center gap-[10px]">
      <span id={id} className={ROW_LABEL}>
        {label}
      </span>
      <button
        type="button"
        aria-label={`One fewer ${one}`}
        onClick={() => onChange(Math.max(0, value - 1))}
        className={step}
      >
        &minus;
      </button>
      <span aria-live="polite" className="w-7 text-center text-[20px] font-bold tabular-nums">
        {value}
      </span>
      <button
        type="button"
        aria-label={`One more ${one}`}
        onClick={() => onChange(Math.min(MOST_CHILDREN, value + 1))}
        className={step}
      >
        +
      </button>
    </div>
  );
}

/**
 * The home page's calculator: a few controls for spouse, children and parents,
 * and the shares the real inheritance engine gives that family. Nothing is
 * stored or sent anywhere.
 */
export function ShareCalculator({ className = "" }: { className?: string }) {
  const [family, setFamily] = useState(START);
  const set = (patch: Partial<Family>) => setFamily((f) => ({ ...f, ...patch }));
  const iAmId = useId();
  const parentsId = useId();

  const { rows, notes } = calculatorShares(family);
  const segments = rows.map((r) => r.segment);

  return (
    <div
      className={`rounded-3xl border border-line bg-white p-[clamp(20px,3vw,32px)] shadow-[0_24px_60px_-32px_rgba(15,31,26,0.35)] ${className}`}
    >
      <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
        <h2 className="text-[22px] font-bold tracking-[-0.02em]">Try it with your family</h2>
        <span className="text-[14px] text-ink-mute">Nothing is saved</span>
      </div>

      <div className="mt-5 flex flex-col gap-[14px]">
        <div
          role="group"
          aria-labelledby={iAmId}
          className="flex flex-wrap items-center gap-[10px]"
        >
          <span id={iAmId} className={ROW_LABEL}>
            I am a
          </span>
          <Pill pressed={family.sex === "male"} onClick={() => set({ sex: "male" })}>
            Man
          </Pill>
          <Pill pressed={family.sex === "female"} onClick={() => set({ sex: "female" })}>
            Woman
          </Pill>
          <Pill pressed={family.spouse} onClick={() => set({ spouse: !family.spouse })}>
            {family.sex === "male" ? "Wife living" : "Husband living"}
          </Pill>
        </div>
        <div className="flex flex-wrap items-center gap-x-6 gap-y-[10px]">
          <Stepper
            label="Sons"
            one="son"
            value={family.sons}
            onChange={(sons) => set({ sons })}
          />
          <Stepper
            label="Daughters"
            one="daughter"
            value={family.daughters}
            onChange={(daughters) => set({ daughters })}
          />
        </div>
        <div
          role="group"
          aria-labelledby={parentsId}
          className="flex flex-wrap items-center gap-[10px]"
        >
          <span id={parentsId} className={ROW_LABEL}>
            Parents
          </span>
          <Pill pressed={family.father} onClick={() => set({ father: !family.father })}>
            Father living
          </Pill>
          <Pill pressed={family.mother} onClick={() => set({ mother: !family.mother })}>
            Mother living
          </Pill>
        </div>
      </div>

      <div className="mt-6 flex flex-wrap items-center gap-x-8 gap-y-6 border-t border-line pt-6">
        <ShareRing
          segments={segments}
          size={176}
          label={
            segments.length ? "Ring divided in proportion to each heir's share" : undefined
          }
        />
        <div className="flex min-w-0 flex-[1_1_240px] flex-col gap-3">
          {rows.length === 0 ? (
            <p className="text-ink-mute">Add a relative to see how the estate is shared.</p>
          ) : (
            rows.map(({ segment, each, percent }) => (
              <div key={segment.key} className="flex items-center gap-3">
                <Swatch fill={segment.fill} />
                <span className="min-w-0 flex-1">
                  <strong className="block text-[17px] leading-[1.25]">{segment.label}</strong>
                  <span className="text-[14px] text-ink-mute">{each}</span>
                </span>
                <span className="text-[15px] text-ink-mute">{percent}</span>
                <StackedFraction
                  n={segment.n}
                  d={segment.d}
                  className="min-w-[44px] text-[19px]"
                />
              </div>
            ))
          )}
        </div>
      </div>

      {notes.map((note) => (
        <p
          key={note}
          className="mt-5 rounded-xl bg-saffron-tint px-4 py-3 text-[15px] leading-[1.5] text-saffron-ink"
        >
          {note}
        </p>
      ))}

      <div className="mt-6 flex flex-wrap items-center justify-between gap-x-5 gap-y-3">
        <p className="flex-[1_1_220px] text-[14px] leading-[1.5] text-ink-mute">
          A quick example for spouse, children and parents. The full interview asks about
          every relative who could inherit.
        </p>
        <Link href="/signup" className="btn-dark px-5">
          Put this in my will
        </Link>
      </div>
    </div>
  );
}
