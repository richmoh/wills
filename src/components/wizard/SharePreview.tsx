"use client";

import type { FaraidResult, HeirGroupKey, HeirShare } from "@/lib/faraid/types";
import { HEIR_LABELS, heirLabel } from "@/lib/faraid/labels";
import { HEIR_ORDER, shareColours } from "@/lib/share-colours";
import type { WillData } from "@/lib/will-types";
import {
  ShareBar,
  ShareRing,
  StackedFraction,
  Swatch,
  type ShareSegment,
} from "@/components/Shares";

/**
 * The live picture of the shares, in the three places the interview shows it:
 * the panel beside the questions, the summary above the buttons on a phone,
 * and the list on the review step.
 */

interface Row extends ShareSegment {
  heir: HeirShare;
  /** "Maryam, your wife", or "Your 2 sons" when the will has no names for them */
  title: string;
  /** first names, when the will has one for everybody in the group */
  names: string | null;
}

const first = (full: string) => full.trim().split(/\s+/)[0];

const joined = (names: string[]) =>
  names.length <= 1
    ? (names[0] ?? "")
    : `${names.slice(0, -1).join(", ")} and ${names[names.length - 1]}`;

/** The names the will holds for a group, only if it has one for each person. */
function knownNames(key: HeirGroupKey, count: number, d: WillData): string | null {
  const from = (list: (string | undefined)[] | undefined) =>
    (list ?? []).map((n) => (n ?? "").trim()).filter(Boolean);
  let names: string[];
  switch (key) {
    case "husband":
    case "wives":
      names = from(d.spouseName.split(","));
      break;
    case "sons":
      names = from(d.sonNames);
      break;
    case "daughters":
      names = from(d.daughterNames);
      break;
    case "father":
      names = from([d.fatherName]);
      break;
    case "mother":
      names = from([d.motherName]);
      break;
    case "grandmothers":
      names = [
        ...(d.census.maternalGrandmother ? from(d.heirNames.maternalGrandmother) : []),
        ...(d.census.paternalGrandmother ? from(d.heirNames.paternalGrandmother) : []),
      ];
      break;
    case "otherAgnates":
    case "distantKindred":
      return null;
    default:
      names = from(d.heirNames[key]);
  }
  return names.length === count && count <= 4 ? joined(names.map(first)) : null;
}

const relation = (key: HeirGroupKey, count: number) =>
  (count > 1 ? HEIR_LABELS[key].plural : HEIR_LABELS[key].singular).toLowerCase();

function toRow(heir: HeirShare, d: WillData, fill: string, text: string): Row {
  const names = knownNames(heir.key, heir.count, d);
  const rel = relation(heir.key, heir.count);
  return {
    heir,
    key: heir.key,
    label: heirLabel(heir.key, heir.count),
    n: heir.share.n,
    d: heir.share.d,
    fill,
    text,
    names,
    title: names
      ? `${names}, your ${rel}`
      : `Your ${heir.count > 1 ? `${heir.count} ` : ""}${rel}`,
  };
}

function rowsFor(result: FaraidResult, d: WillData) {
  const inOrder = (a: HeirShare, b: HeirShare) =>
    HEIR_ORDER.indexOf(a.key) - HEIR_ORDER.indexOf(b.key);
  const active = result.shares.filter((s) => !s.share.isZero()).sort(inOrder);
  const colours = shareColours(active.map((s) => s.key));
  return {
    active: active.map((s) => {
      const c = colours.get(s.key)!;
      return toRow(s, d, c.fill, c.text);
    }),
    excluded: result.shares
      .filter((s) => s.share.isZero())
      .sort(inOrder)
      .map((s) => toRow(s, d, "#B9C4BD", "#0F1F1A")),
  };
}

function Adjustment({ result }: { result: FaraidResult }) {
  if (!result.awlApplied && !result.raddApplied) return null;
  // the engine returns the surplus to a spouse only when nobody else inherits
  const spouse = result.shares.find((s) => s.key === "wives" || s.key === "husband");
  const who = spouse ? (spouse.key === "wives" ? "wife" : "husband") : "";
  const radd = !spouse
    ? "No relative survives to take the remainder, so it returns to these heirs in proportion (radd)."
    : spouse.basis === "radd"
      ? `No other relative survives to take the remainder, so it returns to your ${who} (radd), the position of later Hanafi jurists.`
      : `No relative survives to take the remainder, so it returns to the heirs other than your ${who}, in proportion (radd).`;
  return (
    <p className="rounded-xl bg-saffron-tint px-4 py-3 text-[15px] leading-normal text-saffron-ink">
      {result.awlApplied &&
        "The fixed shares came to more than the whole estate, so each is reduced in proportion ('awl). "}
      {result.raddApplied && radd}
    </p>
  );
}

function Working({ result, summary }: { result: FaraidResult; summary: string }) {
  return (
    <details>
      <summary className="py-2.5 text-[16px] font-bold text-emerald">{summary}</summary>
      <ol className="mt-1 flex flex-col gap-2 text-[15px] leading-normal text-ink-soft">
        {result.trace.map((t, i) => (
          <li key={i}>
            <strong className="text-ink">{t.step}.</strong> {t.detail}
            {t.source && <span> ({t.source})</span>}
          </li>
        ))}
      </ol>
    </details>
  );
}

/** Each heir with the reason for the share, then those who do not inherit. */
function ShareList({ result, data }: { result: FaraidResult; data: WillData }) {
  const { active, excluded } = rowsFor(result, data);
  return (
    <>
      <ul className="flex flex-col gap-[18px]">
        {active.map((r) => (
          <li key={r.key} className="flex items-start gap-3.5">
            <Swatch fill={r.fill} className="mt-[7px]" />
            <span className="min-w-0 flex-1">
              <strong>{r.title}</strong>
              <span className="block text-[15px] leading-[1.45] text-ink-soft">
                {r.heir.reason}
                {r.heir.count > 1 && ` ${r.heir.perPerson.toString()} each.`}
              </span>
            </span>
            <StackedFraction n={r.n} d={r.d} />
          </li>
        ))}
      </ul>
      {excluded.map((r) => (
        <p
          key={r.key}
          className="rounded-xl bg-stone px-4 py-3.5 text-[15px] leading-normal text-ink-soft"
        >
          <strong className="text-ink">
            {r.title} {r.heir.count > 1 ? "do" : "does"} not inherit.
          </strong>{" "}
          {r.heir.reason}
        </p>
      ))}
      <Adjustment result={result} />
    </>
  );
}

/** Whether ShareBar has room to write "Wife 1/4" in this share's slice. */
const barNames = (r: Row) =>
  (Number(r.n) / Number(r.d)) * 330 >= `${r.label} ${r.n}/${r.d}`.length * 8 + 14;

const NOTHING_YET =
  "Your shares appear here as you tell us who is in your family.";
const NO_HEIRS =
  "Based on your answers, no fara'id heir survives you. Your will directs the whole estate to the charity you choose, in the way of Allah.";

/** The card beside the questions: ring, reasons, and the working on request. */
export function SharesPanel({
  result,
  data,
  familyAnswered,
}: {
  result: FaraidResult | null;
  data: WillData;
  /** false while the family questions are still being answered */
  familyAnswered: boolean;
}) {
  const rows = result && !result.noHeirs ? rowsFor(result, data) : null;
  return (
    <div className="rounded-3xl border border-line bg-white p-[clamp(24px,2.4vw,32px)]">
      <div className="flex flex-wrap items-baseline justify-between gap-x-3">
        <h2 className="h-card">Your shares so far</h2>
        <span className="text-[14px] text-ink-soft">Updates as you answer</span>
      </div>
      {!result || !rows ? (
        <p className="mt-4 text-[16px] text-ink-soft">
          {result && familyAnswered ? NO_HEIRS : NOTHING_YET}
        </p>
      ) : (
        <>
          <div className="my-6 flex justify-center">
            <ShareRing segments={rows.active} size={200} />
          </div>
          <div className="flex flex-col gap-5">
            <ShareList result={result} data={data} />
            <Working result={result} summary="Show the full working, with sources" />
          </div>
        </>
      )}
    </div>
  );
}

/**
 * The phone's summary: one bar and one line, with the full list a tap away.
 * Returns null when there is nothing to show yet.
 */
export function SharesSummary({
  result,
  data,
  open,
  onToggle,
  panelId,
}: {
  result: FaraidResult | null;
  data: WillData;
  open: boolean;
  onToggle: () => void;
  panelId: string;
}) {
  if (!result || result.noHeirs) return null;
  const { active, excluded } = rowsFor(result, data);
  // the bar names the shares it has room for; this line carries the rest
  const small = active
    .filter((r) => !barNames(r))
    .map((r) => `${r.label} ${r.n}/${r.d}`);
  const out = excluded.map(
    (r) => `${r.title.replace(/^Your/, "your")} ${r.heir.count > 1 ? "do" : "does"} not inherit`
  );
  const line = [...small, ...out].join(" · ");
  return (
    <>
      {open && (
        <div id={panelId} className="flex max-h-[50vh] flex-col gap-4 overflow-y-auto pb-1">
          <ShareList result={result} data={data} />
          <Working result={result} summary="Show the full working, with sources" />
        </div>
      )}
      <button
        type="button"
        aria-expanded={open}
        aria-controls={panelId}
        onClick={onToggle}
        className="flex flex-col gap-2 text-left"
      >
        <span className="flex items-center justify-between text-[15px]">
          <strong>Your shares so far</strong>
          <span className="flex items-center gap-1 font-bold text-emerald">
            {open ? "Hide" : "See why"}
            <svg
              aria-hidden="true"
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              className={open ? "rotate-180" : ""}
            >
              <path d="M6 15l6-6 6 6" />
            </svg>
          </span>
        </span>
        <ShareBar segments={active} className="h-9 rounded-[9px] text-[14px]" showLabel width={330} />
        {line && !open && <span className="text-[14px] text-ink-soft">{line}</span>}
      </button>
    </>
  );
}

/** The review step's list: who gets what, as it will be written into the will. */
export function ReviewShares({ result, data }: { result: FaraidResult | null; data: WillData }) {
  if (!result) return null;
  const rows = result.noHeirs ? null : rowsFor(result, data);
  return (
    <section className="rounded-[20px] border border-line bg-white px-[clamp(20px,2.4vw,32px)] py-7">
      <h2 className="h-card mb-4">The shares in your will</h2>
      {!rows ? (
        <p className="text-[16px] text-ink-soft">{NO_HEIRS}</p>
      ) : (
        <>
          <ul className="flex flex-col gap-4">
            {rows.active.map((r) => {
              const group = heirLabel(r.key as HeirGroupKey, 1);
              const size =
                r.heir.count > 1
                  ? `${r.heir.perPerson.toString()} each`
                  : r.heir.share.toPercent(1);
              return (
                <li key={r.key} className="flex items-center gap-3.5">
                  <Swatch fill={r.fill} />
                  <span className="min-w-0 flex-1">
                    <strong>{r.names ?? r.label}</strong>
                    <span className="block text-[15px] text-ink-soft">
                      {r.names
                        ? `${r.heir.count > 1 ? HEIR_LABELS[r.heir.key].plural : group} · ${size}`
                        : size}
                    </span>
                  </span>
                  <StackedFraction n={r.n} d={r.d} className="min-w-[44px] text-[20px]" />
                </li>
              );
            })}
          </ul>
          {rows.excluded.length > 0 && (
            <p className="mt-4 text-[15px] leading-normal text-ink-soft">
              Not inheriting:{" "}
              {rows.excluded.map((r) => r.title.replace(/^Your/, "your")).join("; ")}. The
              working below gives the reason for each.
            </p>
          )}
          <div className="mt-4 flex flex-col gap-3">
            <Adjustment result={result} />
            <Working result={result} summary="See the working, with sources" />
          </div>
        </>
      )}
    </section>
  );
}
