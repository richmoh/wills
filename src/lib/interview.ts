import type { HeirCensus } from "./faraid/types";
import type { WillData } from "./will-types";

/**
 * The interview's decision tree, kept free of React so it can be tested.
 *
 * The exclusion (hajb) rules let the interview skip relatives who cannot
 * inherit. A question may only be skipped when its answer could not change
 * anyone's share — `interview.test.ts` checks that against the engine for
 * thousands of random families.
 */

export type StepId =
  | "about"
  | "marriage"
  | "children"
  | "grandchildren"
  | "parents"
  | "grandparents"
  | "siblings"
  | "agnates"
  | "executors"
  | "guardians"
  | "funeral"
  | "bequests"
  | "debts"
  | "wishes"
  | "estate"
  | "review";

export interface StepDef {
  id: StepId;
  title: string;
  intro?: string;
  premium?: boolean;
}

export interface CensusQuestions {
  /** children of a son who died — only when no son survives */
  grandchildren: boolean;
  paternalGrandfather: boolean;
  maternalGrandmother: boolean;
  paternalGrandmother: boolean;
  /** the siblings step as a whole */
  siblings: boolean;
  /** siblings can inherit (as opposed to only reducing the mother's share) */
  siblingsInherit: boolean;
  maternalSiblings: boolean;
  /** remoter male-line relatives */
  agnates: boolean;
  /** other blood relatives (dhawu al-arham) */
  distantKindred: boolean;
}

/** Which family questions matter, given the answers so far. Expects an `askedCensus`. */
export function censusQuestions(c: HeirCensus): CensusQuestions {
  const noDescendants = c.sons + c.daughters + c.grandsons + c.granddaughters === 0;
  const femaleDescendants = c.daughters + c.granddaughters > 0;
  const noMaleLine =
    c.sons === 0 && c.grandsons === 0 && !c.father && !c.paternalGrandfather;

  // Two or more siblings reduce the mother from a third to a sixth even when a
  // father or grandfather excludes them, so they must still be counted.
  const siblingsReduceMother = noDescendants && c.mother && !noMaleLine;
  const siblings = noMaleLine || siblingsReduceMother;

  const sistersTakeRemainder =
    femaleDescendants && c.fullSisters + c.paternalSisters > 0;
  const agnates =
    noMaleLine && c.fullBrothers === 0 && c.paternalBrothers === 0 && !sistersTakeRemainder;

  const nobodyButSpouse =
    noDescendants &&
    !c.father &&
    !c.mother &&
    !c.paternalGrandfather &&
    !c.paternalGrandmother &&
    !c.maternalGrandmother &&
    c.fullBrothers + c.fullSisters + c.paternalBrothers + c.paternalSisters + c.maternalSiblings === 0;

  return {
    grandchildren: c.sons === 0,
    paternalGrandfather: !c.father,
    maternalGrandmother: !c.mother,
    paternalGrandmother: !c.father && !c.mother,
    siblings,
    siblingsInherit: noMaleLine,
    maternalSiblings: siblings && noDescendants,
    agnates,
    distantKindred: nobodyButSpouse && !c.hasOtherAgnates,
  };
}

/**
 * The census as the interview actually asked it: any answer whose question is
 * no longer shown (because an earlier answer changed) is cleared, so a stale,
 * hidden answer can never reach the will.
 */
export function askedCensus(census: HeirCensus): HeirCensus {
  const c = { ...census };
  if (c.sons > 0) {
    c.grandsons = 0;
    c.granddaughters = 0;
  }
  if (c.father) c.paternalGrandfather = false;
  if (c.mother) c.maternalGrandmother = false;
  if (c.father || c.mother) c.paternalGrandmother = false;

  let q = censusQuestions(c);
  if (!q.siblings) {
    c.fullBrothers = 0;
    c.fullSisters = 0;
    c.paternalBrothers = 0;
    c.paternalSisters = 0;
  }
  if (!q.maternalSiblings) c.maternalSiblings = 0;

  q = censusQuestions(c);
  if (!q.agnates) c.hasOtherAgnates = false;
  q = censusQuestions(c);
  if (!q.distantKindred) c.hasDistantKindred = false;
  return c;
}

export function visibleSteps(d: WillData): StepDef[] {
  const c = askedCensus(d.census);
  const q = censusQuestions(c);
  const steps: (StepDef | false)[] = [
    { id: "about", title: "About you" },
    { id: "marriage", title: "Your marriage" },
    { id: "children", title: "Your children" },
    q.grandchildren && {
      id: "grandchildren",
      title: "Grandchildren through a son",
      intro:
        "In Islamic law, the children of a son who passed away before you can inherit in his place. Children of daughters are provided for differently (through the optional bequest).",
    },
    { id: "parents", title: "Your parents" },
    (q.paternalGrandfather || q.maternalGrandmother) && {
      id: "grandparents",
      title: "Your grandparents",
      intro: "A grandparent can inherit when the parent through whom they are related has passed away.",
    },
    q.siblings && {
      id: "siblings",
      title: "Your brothers and sisters",
      intro: q.siblingsInherit
        ? "Because you have no son, father or paternal grandfather living, your brothers and sisters may inherit."
        : "Your brothers and sisters will not inherit while your father (or his father) is living — but if you have two or more, your mother's share changes from a third to a sixth, so we need to count them.",
    },
    (q.agnates || q.distantKindred) && {
      id: "agnates",
      title: "Wider family",
      intro: "When closer heirs are absent, what remains passes to more distant relatives.",
    },
    { id: "executors", title: "Your executors" },
    d.hasMinorChildren &&
      d.census.sons + d.census.daughters > 0 && { id: "guardians", title: "Guardians for your children" },
    { id: "funeral", title: "Funeral & burial wishes" },
    { id: "bequests", title: "Charitable bequests (wasiyya)", premium: true },
    { id: "debts", title: "Religious debts", premium: true },
    { id: "wishes", title: "Letter of wishes", premium: true },
    { id: "estate", title: "About your estate" },
    { id: "review", title: "Review & generate" },
  ];
  return steps.filter(Boolean) as StepDef[];
}

// ------------------------------------------------------------- validation ---

/** One-third, as a percentage, with a little room for "33.34". */
export const BEQUEST_CAP_PERCENT = 100 / 3;

export const percentBequestTotal = (d: WillData): number =>
  d.bequests
    .filter((b) => b.kind === "percentage")
    .reduce((acc, b) => acc + (parseFloat(b.value) || 0), 0);

/** Why a step cannot be left yet, or null when it is complete. */
export function validateStep(id: StepId, d: WillData, isPremium: boolean): string | null {
  switch (id) {
    case "about":
      if (d.fullName.trim().length < 2) return "Please enter your full legal name.";
      if (d.address.trim().length < 5)
        return "Please enter your address — the will must identify you clearly.";
      return null;
    case "executors":
      if (d.executors.filter((e) => e.name.trim().length > 1).length === 0)
        return "Please appoint at least one executor.";
      return null;
    case "guardians":
      if (d.guardians.filter((g) => g.name.trim().length > 1).length === 0)
        return "Please appoint at least one guardian for your children under 18.";
      return null;
    case "bequests": {
      if (!isPremium) return null;
      for (const b of d.bequests) {
        if (!b.beneficiary.trim() && !b.value.trim()) continue; // an empty row is ignored
        if (!b.beneficiary.trim()) return "Please say who receives each bequest, or remove the empty one.";
        if (b.kind === "item") {
          if (!b.value.trim()) return `Please describe the item you are leaving to ${b.beneficiary.trim()}.`;
          continue;
        }
        const n = Number(b.value.replace(/[£,%\s]/g, ""));
        if (!Number.isFinite(n) || n <= 0)
          return `Please enter ${b.kind === "percentage" ? "a percentage" : "an amount in pounds"} greater than zero for ${b.beneficiary.trim()}.`;
      }
      const total = percentBequestTotal(d);
      if (total > BEQUEST_CAP_PERCENT + 0.01)
        return `Bequests may not exceed one-third of your estate (currently ${total.toFixed(1)}%). This is the limit the Prophet ﷺ set — "a third, and a third is much".`;
      return null;
    }
    default:
      return null;
  }
}

/** The first step that still needs attention before a will can be generated. */
export function firstIncompleteStep(
  d: WillData,
  isPremium: boolean
): { id: StepId; message: string } | null {
  for (const s of visibleSteps(d)) {
    const message = validateStep(s.id, d, isPremium);
    if (message) return { id: s.id, message };
  }
  return null;
}
