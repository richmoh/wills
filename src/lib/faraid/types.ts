import type { Fraction } from "./fraction";

/**
 * The heir census: who survives the testator.
 * Grandchildren are through sons only (children of daughters are not fara'id
 * heirs in Sunni fiqh — they can be provided for via the wasiyya third).
 */
export interface HeirCensus {
  testatorSex: "male" | "female";
  /** 0 or 1 husband; 0–4 wives (they share the wife's portion equally) */
  spouseCount: number;
  sons: number;
  daughters: number;
  /** children of sons — only relevant when there are no sons */
  grandsons: number;
  granddaughters: number;
  father: boolean;
  mother: boolean;
  /** father's father — only relevant when father is deceased */
  paternalGrandfather: boolean;
  /** father's mother */
  paternalGrandmother: boolean;
  /** mother's mother */
  maternalGrandmother: boolean;
  fullBrothers: number;
  fullSisters: number;
  /** consanguine (same father, different mother) */
  paternalBrothers: number;
  paternalSisters: number;
  /** uterine (same mother) — sex makes no difference to their share */
  maternalSiblings: number;
  /** any remoter male-line relative: nephew, paternal uncle, male cousin */
  hasOtherAgnates: boolean;
  /**
   * any other blood relative (dhawu al-arham): daughters' children, sisters'
   * children, aunts, maternal uncles. They inherit only when there is no
   * fixed-share heir other than a spouse and no residuary heir.
   */
  hasDistantKindred: boolean;
}

export const emptyCensus = (
  testatorSex: "male" | "female" = "male"
): HeirCensus => ({
  testatorSex,
  spouseCount: 0,
  sons: 0,
  daughters: 0,
  grandsons: 0,
  granddaughters: 0,
  father: false,
  mother: false,
  paternalGrandfather: false,
  paternalGrandmother: false,
  maternalGrandmother: false,
  fullBrothers: 0,
  fullSisters: 0,
  paternalBrothers: 0,
  paternalSisters: 0,
  maternalSiblings: 0,
  hasOtherAgnates: false,
  hasDistantKindred: false,
});

export type HeirGroupKey =
  | "husband"
  | "wives"
  | "sons"
  | "daughters"
  | "grandsons"
  | "granddaughters"
  | "father"
  | "mother"
  | "paternalGrandfather"
  | "grandmothers"
  | "fullBrothers"
  | "fullSisters"
  | "paternalBrothers"
  | "paternalSisters"
  | "maternalSiblings"
  | "otherAgnates"
  | "distantKindred";

export type ShareBasis =
  | "quranic-share" // fixed fardh from Qur'an 4:11, 4:12, 4:176
  | "residuary" // 'asaba
  | "quranic-plus-residuary" // e.g. father's 1/6 + remainder
  | "radd" // fixed share increased by return of surplus
  | "distant-kindred" // dhawu al-arham, in the absence of sharers and residuaries
  | "excluded"; // present but excluded (hajb) — shown with zero share

export interface HeirShare {
  key: HeirGroupKey;
  /** number of people in this group (e.g. 3 daughters) */
  count: number;
  /** total share of this group */
  share: Fraction;
  /** share of each individual within the group */
  perPerson: Fraction;
  basis: ShareBasis;
  /** short human explanation, e.g. "One-eighth — wife's share when there are children (Qur'an 4:12)" */
  reason: string;
}

export interface TraceEntry {
  step: string;
  detail: string;
  /** e.g. "Qur'an 4:11" */
  source?: string;
}

export interface FaraidResult {
  shares: HeirShare[];
  trace: TraceEntry[];
  awlApplied: boolean;
  raddApplied: boolean;
  /** true when there are no fara'id heirs at all — residue passes to charity under the will */
  noHeirs: boolean;
  /** sanity check: total of all shares (must equal 1 unless noHeirs) */
  total: Fraction;
}
