"use client";

import { useState } from "react";
import type { FaraidResult, HeirGroupKey, HeirShare } from "@/lib/faraid/types";
import { heirLabel } from "@/lib/faraid/labels";

/**
 * Validated categorical palette (dataviz six-checks, light surface).
 * Colors are assigned to heir groups in canonical family order — never by
 * share size — so a group keeps its color as answers change.
 */
const CHART_COLORS = [
  "#15804F", // green
  "#B08A18", // gold
  "#4678B8", // blue
  "#B05F2A", // copper
  "#6D5AC4", // violet
  "#C1619C", // pink-plum
];
const OTHER_COLOR = "#7C8582";

const CANONICAL_ORDER: HeirGroupKey[] = [
  "husband", "wives", "sons", "daughters", "grandsons", "granddaughters",
  "father", "mother", "paternalGrandfather", "grandmothers",
  "fullBrothers", "fullSisters", "paternalBrothers", "paternalSisters",
  "maternalSiblings", "otherAgnates", "distantKindred",
];

const BASIS_BADGE: Record<HeirShare["basis"], string> = {
  "quranic-share": "Qur'anic share",
  residuary: "Residuary",
  "quranic-plus-residuary": "Share + residue",
  radd: "Share + return",
  "distant-kindred": "Distant kindred",
  excluded: "Excluded",
};

interface Segment {
  label: string;
  fractionText: string;
  percent: number;
  color: string;
}

export function SharePreview({ result }: { result: FaraidResult }) {
  const [hover, setHover] = useState<Segment | null>(null);

  if (result.noHeirs) {
    return (
      <div className="card">
        <h3 className="font-display text-lg font-semibold text-forest-900">
          Inheritance shares
        </h3>
        <p className="mt-3 text-sm leading-6 text-ink/70">
          Based on your answers, no fara&rsquo;id heir survives you. Your will
          directs the whole estate to the charity you choose, in the way of
          Allah.
        </p>
      </div>
    );
  }

  const active = result.shares.filter((s) => !s.share.isZero());
  const excluded = result.shares.filter((s) => s.share.isZero());

  // color by canonical family order, stable across recalculations
  const ordered = [...active].sort(
    (a, b) => CANONICAL_ORDER.indexOf(a.key) - CANONICAL_ORDER.indexOf(b.key)
  );
  const colorFor = new Map<HeirGroupKey, string>();
  ordered.forEach((s, i) => {
    colorFor.set(s.key, i < CHART_COLORS.length ? CHART_COLORS[i] : OTHER_COLOR);
  });

  const segments: Segment[] = ordered.map((s) => ({
    label: heirLabel(s.key, s.count),
    fractionText: s.share.toString(),
    percent: s.share.toNumber() * 100,
    color: colorFor.get(s.key)!,
  }));

  return (
    <div className="card">
      <div className="flex items-baseline justify-between gap-3">
        <h3 className="font-display text-lg font-semibold text-forest-900">
          Inheritance shares
        </h3>
        <span className="text-xs text-ink/50">updates as you answer</span>
      </div>

      {/* proportional bar — 2px surface gaps between segments */}
      <div
        className="relative mt-4"
        onMouseLeave={() => setHover(null)}
      >
        <div className="flex h-8 w-full gap-[2px] overflow-hidden rounded-lg">
          {segments.map((seg) => (
            <div
              key={seg.label}
              className="relative flex items-center justify-center transition-opacity"
              style={{
                width: `${seg.percent}%`,
                backgroundColor: seg.color,
                opacity: hover && hover.label !== seg.label ? 0.45 : 1,
              }}
              onMouseEnter={() => setHover(seg)}
            >
              {seg.percent >= 14 && (
                <span className="truncate px-1.5 text-[11px] font-semibold text-white">
                  {seg.fractionText}
                </span>
              )}
            </div>
          ))}
        </div>
        {hover && (
          <div className="pointer-events-none absolute -top-9 left-1/2 z-10 -translate-x-1/2 whitespace-nowrap rounded-lg bg-forest-950 px-3 py-1.5 text-xs font-medium text-white shadow-lg">
            {hover.label}: {hover.fractionText} ({hover.percent.toFixed(1)}%)
          </div>
        )}
      </div>

      {/* the list is the table view: exact fractions, identity beside a chip */}
      <ul className="mt-4 space-y-2.5">
        {ordered.map((s) => (
          <li key={s.key} className="flex items-start gap-2.5">
            <span
              className="mt-1 h-3 w-3 shrink-0 rounded-[4px]"
              style={{ backgroundColor: colorFor.get(s.key) }}
              aria-hidden
            />
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-baseline gap-x-2">
                <span className="text-sm font-semibold text-ink">
                  {heirLabel(s.key, s.count)}
                </span>
                <span className="font-display text-sm font-semibold text-forest-800">
                  {s.share.toString()}
                </span>
                <span className="text-xs tabular-nums text-ink/50">
                  {s.share.toPercent(1)}
                </span>
                <span className="rounded-full bg-forest-50 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-forest-700">
                  {BASIS_BADGE[s.basis]}
                </span>
              </div>
              <p className="mt-0.5 text-xs leading-5 text-ink/55">{s.reason}</p>
              {s.count > 1 && (
                <p className="text-xs text-ink/45">
                  {s.perPerson.toString()} each
                </p>
              )}
            </div>
          </li>
        ))}
        {excluded.map((s, i) => (
          <li key={`${s.key}-${i}`} className="flex items-start gap-2.5 opacity-60">
            <span className="mt-1 h-3 w-3 shrink-0 rounded-[4px] border border-ink/25 bg-transparent" aria-hidden />
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-baseline gap-x-2">
                <span className="text-sm font-medium text-ink/70">
                  {heirLabel(s.key, s.count)}
                </span>
                <span className="rounded-full bg-ink/5 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-ink/50">
                  does not inherit
                </span>
              </div>
              <p className="mt-0.5 text-xs leading-5 text-ink/50">{s.reason}</p>
            </div>
          </li>
        ))}
      </ul>

      {(result.awlApplied || result.raddApplied) && (
        <p className="mt-3 rounded-xl bg-gold-100 px-3 py-2 text-xs leading-5 text-ink/70">
          {result.awlApplied &&
            "The fixed shares exceeded the whole estate, so every share was scaled down proportionally ('awl). "}
          {result.raddApplied &&
            "No residuary heir survives, so the surplus returns pro-rata to the sharers (radd)."}
        </p>
      )}

      <details className="group mt-4">
        <summary className="cursor-pointer select-none text-sm font-semibold text-forest-800 hover:text-forest-600">
          Show the rule-by-rule working
        </summary>
        <ol className="mt-3 space-y-2 border-l-2 border-forest-100 pl-4">
          {result.trace.map((t, i) => (
            <li key={i} className="text-xs leading-5 text-ink/70">
              <span className="font-semibold text-forest-900">{t.step}.</span>{" "}
              {t.detail}
              {t.source && (
                <span className="ml-1 text-ink/45">[{t.source}]</span>
              )}
            </li>
          ))}
        </ol>
      </details>
    </div>
  );
}
