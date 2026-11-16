import type { HeirGroupKey } from "./types";

export const HEIR_LABELS: Record<HeirGroupKey, { singular: string; plural: string; arabic?: string }> = {
  husband: { singular: "Husband", plural: "Husband" },
  wives: { singular: "Wife", plural: "Wives" },
  sons: { singular: "Son", plural: "Sons" },
  daughters: { singular: "Daughter", plural: "Daughters" },
  grandsons: { singular: "Son's son", plural: "Sons' sons" },
  granddaughters: { singular: "Son's daughter", plural: "Sons' daughters" },
  father: { singular: "Father", plural: "Father" },
  mother: { singular: "Mother", plural: "Mother" },
  paternalGrandfather: { singular: "Paternal grandfather", plural: "Paternal grandfather" },
  grandmothers: { singular: "Grandmother", plural: "Grandmothers" },
  fullBrothers: { singular: "Full brother", plural: "Full brothers" },
  fullSisters: { singular: "Full sister", plural: "Full sisters" },
  paternalBrothers: { singular: "Paternal half-brother", plural: "Paternal half-brothers" },
  paternalSisters: { singular: "Paternal half-sister", plural: "Paternal half-sisters" },
  maternalSiblings: { singular: "Maternal (uterine) sibling", plural: "Maternal (uterine) siblings" },
  otherAgnates: { singular: "Nearest male-line relative", plural: "Nearest male-line relatives" },
  distantKindred: { singular: "Other blood relatives (dhawu al-arham)", plural: "Other blood relatives (dhawu al-arham)" },
};

export function heirLabel(key: HeirGroupKey, count: number): string {
  const l = HEIR_LABELS[key];
  return count > 1 ? `${count} ${l.plural.toLowerCase()}` : l.singular;
}
