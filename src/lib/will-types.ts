import type { HeirCensus } from "./faraid/types";
import { emptyCensus } from "./faraid/types";

export interface Person {
  name: string;
  relationship?: string;
  address?: string;
}

export interface Bequest {
  /** who receives it — a charity name or a person's full name */
  beneficiary: string;
  beneficiaryType: "charity" | "person";
  kind: "percentage" | "amount" | "item";
  /** percentage of net estate (0–33.33), pounds, or a description of the item */
  value: string;
  note?: string;
}

export interface ReligiousDebts {
  unpaidZakat: boolean;
  missedFastsFidya: boolean;
  hajjNotPerformed: boolean;
  kaffarah: boolean;
  notes: string;
}

export interface ComplexityFlags {
  /** "" until the question is answered */
  homeOwnership: "" | "none" | "sole" | "joint" | "tenants-in-common" | "unsure";
  businessAssets: boolean;
  foreignAssets: boolean;
  previousMarriage: boolean;
  expectsDispute: boolean;
}

/** Heir groups (beyond spouse, children and parents) the will can name individually. */
export const NAMED_GROUPS = [
  "grandsons",
  "granddaughters",
  "paternalGrandfather",
  "paternalGrandmother",
  "maternalGrandmother",
  "fullBrothers",
  "fullSisters",
  "paternalBrothers",
  "paternalSisters",
  "maternalSiblings",
] as const;
export type NamedGroup = (typeof NAMED_GROUPS)[number];

/**
 * The classes of remoter male-line relative, nearest first. Only the nearest
 * class living at death inherits, so the interview asks which it is.
 */
export const AGNATE_KINDS = [
  { value: "full-nephew", label: "A full brother's son", phrase: "my full brother's son" },
  { value: "paternal-nephew", label: "A paternal half-brother's son", phrase: "my paternal half-brother's son" },
  { value: "full-uncle", label: "My father's full brother", phrase: "my father's full brother" },
  { value: "paternal-uncle", label: "My father's paternal half-brother", phrase: "my father's paternal half-brother" },
  { value: "cousin", label: "A paternal uncle's son", phrase: "my paternal uncle's son" },
] as const;
export type AgnateKind = (typeof AGNATE_KINDS)[number]["value"];

export interface WillData {
  // testator
  fullName: string;
  address: string;
  dateOfBirth: string;
  sex: "male" | "female";
  maritalStatus: "married" | "single" | "divorced" | "widowed";
  spouseName: string;
  /**
   * Some close relatives are not Muslim. Under the agreed position of the four
   * Sunni schools they take no fara'id share, so the interview counts only
   * Muslim relatives and points to the bequest (wasiyya) for the others.
   */
  hasNonMuslimRelatives: boolean;

  /** who survives — only relatives who inherit under fara'id are counted */
  census: HeirCensus;
  /** display names so the will can say "my son Ahmed" */
  sonNames: string[];
  daughterNames: string[];
  fatherName: string;
  motherName: string;
  heirNames: Partial<Record<NamedGroup, string[]>>;
  /** nearest class of remoter male-line relative, when one may inherit */
  agnateKind: AgnateKind | "";
  agnateNames: string;
  /** free-text description of other blood relatives (dhawu al-arham) */
  distantKindredNames: string;
  hasMinorChildren: boolean;

  executors: Person[];
  guardians: Person[];

  islamicBurial: boolean;
  /** charity that takes the residue if no heir survives */
  fallbackCharity: string;

  // premium features
  bequests: Bequest[];
  religiousDebts: ReligiousDebts;
  letterOfWishes: string;

  complexity: ComplexityFlags;

  /** the interview step the user last had open, so they resume where they left off */
  lastStep: string;
}

export const emptyWillData = (): WillData => ({
  fullName: "",
  address: "",
  dateOfBirth: "",
  sex: "male",
  maritalStatus: "married",
  spouseName: "",
  hasNonMuslimRelatives: false,
  // default census must agree with the default marital status
  census: { ...emptyCensus("male"), spouseCount: 1 },
  sonNames: [],
  daughterNames: [],
  fatherName: "",
  motherName: "",
  heirNames: {},
  agnateKind: "",
  agnateNames: "",
  distantKindredNames: "",
  hasMinorChildren: false,
  executors: [],
  guardians: [],
  islamicBurial: true,
  fallbackCharity: "",
  bequests: [],
  religiousDebts: {
    unpaidZakat: false,
    missedFastsFidya: false,
    hajjNotPerformed: false,
    kaffarah: false,
    notes: "",
  },
  letterOfWishes: "",
  complexity: {
    homeOwnership: "",
    businessAssets: false,
    foreignAssets: false,
    previousMarriage: false,
    expectsDispute: false,
  },
  lastStep: "",
});

// ------------------------------------------------------------ normalising ---
// Stored answers are untrusted JSON: older drafts predate newer fields, and the
// API accepts whatever a client sends. Everything is coerced to the shape above
// so the engine and the document can never be handed a malformed value.

type Obj = Record<string, unknown>;
const obj = (v: unknown): Obj => (v && typeof v === "object" && !Array.isArray(v) ? (v as Obj) : {});
const str = (v: unknown, max = 200): string => (typeof v === "string" ? v.slice(0, max) : "");
const bool = (v: unknown, fallback = false): boolean => (typeof v === "boolean" ? v : fallback);
const int = (v: unknown, max: number): number =>
  typeof v === "number" && Number.isFinite(v) ? Math.min(Math.max(Math.floor(v), 0), max) : 0;
const oneOf = <T extends string>(v: unknown, options: readonly T[], fallback: T): T =>
  options.includes(v as T) ? (v as T) : fallback;
const names = (v: unknown, max: number): string[] =>
  Array.isArray(v) ? v.slice(0, max).map((n) => str(n, 120)) : [];
const people = (v: unknown, max: number): Person[] =>
  Array.isArray(v)
    ? v.slice(0, max).map((p) => {
        const o = obj(p);
        return { name: str(o.name, 120), relationship: str(o.relationship, 80), address: str(o.address, 200) };
      })
    : [];

export const isUuid = (v: unknown): v is string =>
  typeof v === "string" && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(v);

/** The most of any one kind of relative the interview accepts. */
export const MAX_COUNT = 20;

export function normalizeWillData(raw: unknown): WillData {
  const r = obj(raw);
  const base = emptyWillData();
  const sex = oneOf(r.sex, ["male", "female"] as const, base.sex);
  const maritalStatus = oneOf(
    r.maritalStatus,
    ["married", "single", "divorced", "widowed"] as const,
    base.maritalStatus
  );
  const c = obj(r.census);
  const maxSpouses = maritalStatus !== "married" ? 0 : sex === "male" ? 4 : 1;
  const census: HeirCensus = {
    testatorSex: sex,
    // a draft with no census yet takes the default (one spouse when married)
    spouseCount: "spouseCount" in c ? int(c.spouseCount, maxSpouses) : Math.min(1, maxSpouses),
    sons: int(c.sons, MAX_COUNT),
    daughters: int(c.daughters, MAX_COUNT),
    grandsons: int(c.grandsons, MAX_COUNT),
    granddaughters: int(c.granddaughters, MAX_COUNT),
    father: bool(c.father),
    mother: bool(c.mother),
    paternalGrandfather: bool(c.paternalGrandfather),
    paternalGrandmother: bool(c.paternalGrandmother),
    maternalGrandmother: bool(c.maternalGrandmother),
    fullBrothers: int(c.fullBrothers, MAX_COUNT),
    fullSisters: int(c.fullSisters, MAX_COUNT),
    paternalBrothers: int(c.paternalBrothers, MAX_COUNT),
    paternalSisters: int(c.paternalSisters, MAX_COUNT),
    maternalSiblings: int(c.maternalSiblings, MAX_COUNT),
    hasOtherAgnates: bool(c.hasOtherAgnates),
    hasDistantKindred: bool(c.hasDistantKindred),
  };

  const hn = obj(r.heirNames);
  const heirNames: WillData["heirNames"] = {};
  for (const g of NAMED_GROUPS) {
    const list = names(hn[g], MAX_COUNT);
    if (list.length > 0) heirNames[g] = list;
  }

  const rd = obj(r.religiousDebts);
  const cx = obj(r.complexity);

  return {
    fullName: str(r.fullName, 120),
    address: str(r.address, 300),
    dateOfBirth: /^\d{4}-\d{2}-\d{2}$/.test(str(r.dateOfBirth, 10)) ? str(r.dateOfBirth, 10) : "",
    sex,
    maritalStatus,
    spouseName: maritalStatus === "married" ? str(r.spouseName, 300) : "",
    hasNonMuslimRelatives: bool(r.hasNonMuslimRelatives),
    census,
    sonNames: names(r.sonNames, census.sons),
    daughterNames: names(r.daughterNames, census.daughters),
    fatherName: str(r.fatherName, 120),
    motherName: str(r.motherName, 120),
    heirNames,
    agnateKind: oneOf(r.agnateKind, ["", ...AGNATE_KINDS.map((k) => k.value)] as const, ""),
    agnateNames: str(r.agnateNames, 400),
    distantKindredNames: str(r.distantKindredNames, 400),
    hasMinorChildren: bool(r.hasMinorChildren) && census.sons + census.daughters > 0,
    executors: people(r.executors, 3),
    guardians: people(r.guardians, 2),
    islamicBurial: bool(r.islamicBurial, true),
    fallbackCharity: str(r.fallbackCharity, 200),
    bequests: Array.isArray(r.bequests)
      ? r.bequests.slice(0, 20).map((b) => {
          const o = obj(b);
          return {
            beneficiary: str(o.beneficiary, 200),
            beneficiaryType: oneOf(o.beneficiaryType, ["charity", "person"] as const, "charity"),
            kind: oneOf(o.kind, ["percentage", "amount", "item"] as const, "percentage"),
            value: str(o.value, 300),
          };
        })
      : [],
    religiousDebts: {
      unpaidZakat: bool(rd.unpaidZakat),
      missedFastsFidya: bool(rd.missedFastsFidya),
      hajjNotPerformed: bool(rd.hajjNotPerformed),
      kaffarah: bool(rd.kaffarah),
      notes: str(rd.notes, 1000),
    },
    letterOfWishes: str(r.letterOfWishes, 20000),
    complexity: {
      homeOwnership: oneOf(
        cx.homeOwnership,
        ["", "none", "sole", "joint", "tenants-in-common", "unsure"] as const,
        base.complexity.homeOwnership
      ),
      businessAssets: bool(cx.businessAssets),
      foreignAssets: bool(cx.foreignAssets),
      previousMarriage: bool(cx.previousMarriage),
      expectsDispute: bool(cx.expectsDispute),
    },
    lastStep: str(r.lastStep, 30),
  };
}

/**
 * A starting point for the spouse's will: the couple's shared details carried
 * over, everything personal to the other spouse (parents, siblings, wishes)
 * left for them to answer. Only offered for a marriage of two people.
 */
export function mirrorWillData(src: WillData): WillData {
  const m = emptyWillData();
  const sex = src.sex === "male" ? "female" : "male";
  return {
    ...m,
    fullName: src.spouseName.trim(),
    address: src.address,
    sex,
    maritalStatus: "married",
    spouseName: src.fullName.trim(),
    census: {
      ...emptyCensus(sex),
      spouseCount: 1,
      sons: src.census.sons,
      daughters: src.census.daughters,
    },
    sonNames: [...src.sonNames],
    daughterNames: [...src.daughterNames],
    hasMinorChildren: src.hasMinorChildren,
    guardians: src.guardians.map((g) => ({ ...g })),
    islamicBurial: src.islamicBurial,
    fallbackCharity: src.fallbackCharity,
    complexity: { ...src.complexity },
  };
}

export const canMirror = (d: WillData): boolean =>
  d.maritalStatus === "married" && d.census.spouseCount === 1 && d.spouseName.trim().length > 1;

/** Estates that should see a solicitor get flagged, never blocked. */
export function solicitorFlags(d: WillData): string[] {
  const flags: string[] = [];
  const spouse = d.sex === "male" ? "wife" : "husband";
  if (d.maritalStatus === "married" && d.census.spouseCount === 0) {
    flags.push(
      `Your ${spouse} takes no fixed share under this will. As your legal spouse they could still ask a court for provision under the Inheritance (Provision for Family and Dependants) Act 1975 — consider providing for them through a bequest, and take a solicitor's advice.`
    );
  }
  if (d.hasNonMuslimRelatives) {
    flags.push(
      "Some of your close relatives are not Muslim and so take no fixed share. You can provide for them through a bequest of up to one-third; a child or dependant left out of a will can bring a claim under the 1975 Act, so advice is worthwhile."
    );
  }
  if (d.census.hasDistantKindred && !d.census.hasOtherAgnates) {
    flags.push(
      "Part of your estate may pass to your wider blood relatives (dhawu al-arham). The rules for dividing it between them are intricate and this service does not calculate them — ask a scholar to set out the shares, and a solicitor to name those relatives in your will."
    );
  }
  if (d.complexity.homeOwnership === "joint") {
    flags.push(
      "You own your home as joint tenants. On death it passes automatically to the co-owner, outside your will. To let your Islamic shares apply to your home, the joint tenancy should be severed to a tenancy in common — a solicitor can do this quickly and cheaply."
    );
  }
  if (d.complexity.homeOwnership === "unsure") {
    flags.push(
      "You are unsure how your home is owned. If it is a joint tenancy it will bypass your will entirely — worth checking with the Land Registry or a solicitor."
    );
  }
  if (d.complexity.businessAssets) {
    flags.push("You own business assets — a solicitor should review how they pass under the will.");
  }
  if (d.complexity.foreignAssets) {
    flags.push("You hold assets abroad — foreign property may need a separate local will.");
  }
  if (d.complexity.previousMarriage) {
    flags.push(
      "A previous marriage or stepchildren can lead to claims under the Inheritance (Provision for Family and Dependants) Act 1975 — professional advice is recommended."
    );
  }
  if (d.complexity.expectsDispute) {
    flags.push("You expect the will may be challenged — have a solicitor review and consider a capacity assessment when signing.");
  }
  return flags;
}
