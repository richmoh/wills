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
  homeOwnership: "none" | "sole" | "joint" | "tenants-in-common" | "unsure";
  businessAssets: boolean;
  foreignAssets: boolean;
  previousMarriage: boolean;
  expectsDispute: boolean;
}

export interface WillData {
  // testator
  fullName: string;
  address: string;
  dateOfBirth: string;
  sex: "male" | "female";
  maritalStatus: "married" | "single" | "divorced" | "widowed";
  spouseName: string;

  census: HeirCensus;
  /** display names so the will can say "my son Ahmed" */
  sonNames: string[];
  daughterNames: string[];
  fatherName: string;
  motherName: string;
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
}

export const emptyWillData = (): WillData => ({
  fullName: "",
  address: "",
  dateOfBirth: "",
  sex: "male",
  maritalStatus: "married",
  spouseName: "",
  // default census must agree with the default marital status
  census: { ...emptyCensus("male"), spouseCount: 1 },
  sonNames: [],
  daughterNames: [],
  fatherName: "",
  motherName: "",
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
    homeOwnership: "unsure",
    businessAssets: false,
    foreignAssets: false,
    previousMarriage: false,
    expectsDispute: false,
  },
});

/** Estates that should see a solicitor get flagged, never blocked. */
export function solicitorFlags(d: WillData): string[] {
  const flags: string[] = [];
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
