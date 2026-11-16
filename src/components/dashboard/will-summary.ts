import { buildWillDocument } from "@/lib/document";
import type { FaraidResult, HeirCensus, HeirGroupKey } from "@/lib/faraid/types";
import { HEIR_LABELS, heirLabel } from "@/lib/faraid/labels";
import { askedCensus, firstIncompleteStep } from "@/lib/interview";
import { HEIR_ORDER, SHARE_COLOURS, shareColours } from "@/lib/share-colours";
import type { WillData } from "@/lib/will-types";
import type { ShareSegment } from "@/components/Shares";

/**
 * What My wills shows for one will, worked out on the server from the stored
 * record: how far it has got, the date and reference its document carries, and
 * the shares it gives.
 */

/** One inheriting group, as the bar and its legend show it. */
export interface EstateShare extends ShareSegment {
  /** "Maryam (wife)", or "2 sons" when the will does not name every one of them */
  legend: string;
}

export interface WillSummary {
  id: string;
  label: string;
  /** the last step has been reached with nothing outstanding */
  answered: boolean;
  generated: boolean;
  /** the day it was generated, or last edited while it is still a draft */
  date: string;
  /** the fingerprint printed on the generated will */
  reference: string | null;
  /** empty until the will is generated, and when no heir inherits */
  shares: EstateShare[];
}

const first = (full: string) => full.trim().split(/\s+/)[0];

const joined = (names: string[]) =>
  names.length <= 1
    ? (names[0] ?? "")
    : `${names.slice(0, -1).join(", ")} and ${names[names.length - 1]}`;

/**
 * First names for a group, only when the will holds one for every person in
 * it. The interview's share panel follows the same rule.
 */
function namesHeld(
  key: HeirGroupKey,
  count: number,
  d: WillData,
  census: HeirCensus
): string | null {
  const clean = (list: string[] = []) =>
    list
      .slice(0, count)
      .map((n) => n.trim())
      .filter(Boolean);
  let names: string[];
  switch (key) {
    case "husband":
    case "wives":
      // several wives are entered as one line, separated by commas
      names = clean(count > 1 ? d.spouseName.split(",") : [d.spouseName]);
      break;
    case "sons":
      names = clean(d.sonNames);
      break;
    case "daughters":
      names = clean(d.daughterNames);
      break;
    case "father":
      names = clean([d.fatherName]);
      break;
    case "mother":
      names = clean([d.motherName]);
      break;
    case "grandmothers":
      names = [
        ...(census.paternalGrandmother ? clean(d.heirNames.paternalGrandmother).slice(0, 1) : []),
        ...(census.maternalGrandmother ? clean(d.heirNames.maternalGrandmother).slice(0, 1) : []),
      ];
      break;
    case "otherAgnates":
    case "distantKindred":
      // described in a sentence, not named one by one
      return null;
    default:
      names = clean(d.heirNames[key]);
  }
  return names.length === count && count <= 4 ? joined(names.map(first)) : null;
}

/** The groups that inherit, in family order, each with its colour and legend. */
function estateShares(d: WillData, result: FaraidResult): EstateShare[] {
  // the census as the interview asked it, which is the one the will is written from
  const census = askedCensus(d.census);
  const heirs = result.shares
    .filter((s) => !s.share.isZero())
    .sort((a, b) => HEIR_ORDER.indexOf(a.key) - HEIR_ORDER.indexOf(b.key));
  const colours = shareColours(heirs.map((s) => s.key));
  return heirs.map((s) => {
    const colour = colours.get(s.key) ?? SHARE_COLOURS.other;
    const group = heirLabel(s.key, s.count);
    const relation = (
      s.count > 1 ? HEIR_LABELS[s.key].plural : HEIR_LABELS[s.key].singular
    ).toLowerCase();
    const names = namesHeld(s.key, s.count, d, census);
    return {
      key: s.key,
      label: group,
      n: Number(s.share.n),
      d: Number(s.share.d),
      fill: colour.fill,
      text: colour.text,
      legend: !names
        ? group
        : relation.includes("(")
          ? `${names}, ${relation}`
          : `${names} (${relation})`,
    };
  });
}

export function summariseWill(
  row: { id: string; label: string; status: string; updated_at: string },
  data: WillData,
  isPremium: boolean
): WillSummary {
  const generated = row.status === "complete";
  let reference: string | null = null;
  let shares: EstateShare[] = [];
  if (generated) {
    try {
      // the same document the will page builds, so the reference and shares match it
      const doc = buildWillDocument(data, isPremium);
      reference = doc.reference;
      shares = estateShares(data, doc.result);
    } catch {
      // answers the engine cannot read must not take the whole page down:
      // the will keeps its card, without a reference or shares
    }
  }
  return {
    id: row.id,
    label: row.label,
    answered:
      generated || (data.lastStep === "review" && firstIncompleteStep(data, isPremium) === null),
    generated,
    date: new Date(row.updated_at).toLocaleDateString("en-GB", {
      day: "numeric",
      month: "long",
      year: "numeric",
    }),
    reference,
    shares,
  };
}
