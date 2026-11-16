import { equalParts, type ShareSegment } from "@/components/Shares";
import { calculateFaraid } from "@/lib/faraid/engine";
import { Fraction, sum } from "@/lib/faraid/fraction";
import { heirLabel } from "@/lib/faraid/labels";
import { emptyCensus, type HeirGroupKey } from "@/lib/faraid/types";
import { HEIR_ORDER, SHARE_COLOURS, shareColours } from "@/lib/share-colours";

/** What the home page's calculator asks. The interview asks about everyone else. */
export interface Family {
  sex: "male" | "female";
  spouse: boolean;
  sons: number;
  daughters: number;
  father: boolean;
  mother: boolean;
}

/** The heir groups the calculator has a control for. */
const ASKED: HeirGroupKey[] = ["husband", "wives", "sons", "daughters", "father", "mother"];

export interface CalculatorRow {
  segment: ShareSegment;
  /** "17/60 each" for a group, "15 of 120 parts" for one person */
  each: string;
  /** to one decimal place: "12.5%" */
  percent: string;
}

/**
 * The inheritance engine's answer for this family, laid out for the ring and
 * the list beside it. The rows always account for the whole estate: anything
 * the engine does not give to the six groups asked about is one "Wider family"
 * row. `notes` explain a result that is not the plain fixed shares.
 */
export function calculatorShares(family: Family): { rows: CalculatorRow[]; notes: string[] } {
  const result = calculateFaraid({
    ...emptyCensus(family.sex),
    spouseCount: family.spouse ? 1 : 0,
    sons: family.sons,
    daughters: family.daughters,
    father: family.father,
    mother: family.mother,
  });

  const heirs = result.shares
    .filter((h) => ASKED.includes(h.key) && !h.share.isZero())
    .sort((a, b) => HEIR_ORDER.indexOf(a.key) - HEIR_ORDER.indexOf(b.key));
  const colours = shareColours(heirs.map((h) => h.key));

  const groups = heirs.map((h) => ({
    key: h.key as string,
    label: heirLabel(h.key, h.count),
    count: h.count,
    share: h.share,
    perPerson: h.perPerson,
    colour: colours.get(h.key) ?? SHARE_COLOURS.other,
  }));

  const rest = result.noHeirs
    ? Fraction.ZERO
    : Fraction.ONE.sub(sum(heirs.map((h) => h.share)));
  const hasRest = rest.gt(Fraction.ZERO);
  if (hasRest) {
    groups.push({
      key: "rest",
      label: "Wider family",
      count: 1,
      share: rest,
      perPerson: rest,
      colour: SHARE_COLOURS.other,
    });
  }

  const parts = equalParts(groups.map((g) => ({ d: g.share.d })));
  const rows = groups.map((g): CalculatorRow => {
    const whole = g.share.eq(Fraction.ONE);
    return {
      segment: {
        key: g.key,
        label: g.label,
        n: g.share.n,
        d: g.share.d,
        fill: g.colour.fill,
        text: g.colour.text,
      },
      each:
        g.count > 1
          ? `${g.perPerson.toString()} each`
          : whole
            ? "The whole estate"
            : `${(g.share.n * BigInt(parts)) / g.share.d} of ${parts} parts`,
      percent: g.share.toPercent(1),
    };
  });

  const notes: string[] = [];
  if (result.awlApplied) {
    notes.push(
      "The fixed shares came to more than the whole estate, so each is reduced in proportion (‘awl)."
    );
  }
  if (result.raddApplied) {
    // the engine returns the surplus to a spouse only when nobody else inherits
    const toSpouse = heirs.find(
      (h) => (h.key === "wives" || h.key === "husband") && h.basis === "radd"
    );
    // with other heirs present, a spouse keeps the fixed share and takes none of the surplus
    const spouse = heirs.find((h) => h.key === "wives" || h.key === "husband");
    const others = spouse
      ? `the heirs other than your ${spouse.key === "wives" ? "wife" : "husband"}`
      : "these heirs";
    notes.push(
      toSpouse
        ? `With no other relative to take the remainder, it returns to your ${
            toSpouse.key === "wives" ? "wife" : "husband"
          } (radd), the position of later Hanafi jurists. Brothers, sisters or uncles would change this.`
        : `With no closer relative to take the remainder, it returns to ${others} in proportion (radd). Brothers, sisters or uncles would change this.`
    );
  }
  if (hasRest) {
    notes.push("The remainder passes to your wider family. The interview asks who they are.");
  }

  return { rows, notes };
}
