import type { HeirGroupKey } from "./faraid/types";

/**
 * The colour each heir group is drawn in, wherever shares appear (the home
 * page's calculator, the interview, My wills). A group keeps its colour as
 * answers change, and `text` is the colour that is legible on top of `fill`.
 */
export interface ShareColour {
  fill: string;
  text: string;
}

const WHITE = "#FFFFFF";
const INK = "#0F1F1A";

export const SHARE_COLOURS = {
  spouse: { fill: "#0B6E4F", text: WHITE }, // emerald
  sons: { fill: "#23408F", text: WHITE }, // indigo
  daughters: { fill: "#7FA3E0", text: INK }, // sky
  father: { fill: "#B8502A", text: WHITE }, // clay
  mother: { fill: "#E7B23F", text: INK }, // saffron
  other: { fill: "#B9C4BD", text: INK }, // wider family, or anything past the palette
} as const satisfies Record<string, ShareColour>;

const FIXED: Partial<Record<HeirGroupKey, ShareColour>> = {
  husband: SHARE_COLOURS.spouse,
  wives: SHARE_COLOURS.spouse,
  sons: SHARE_COLOURS.sons,
  daughters: SHARE_COLOURS.daughters,
  father: SHARE_COLOURS.father,
  mother: SHARE_COLOURS.mother,
};

// For the groups that only inherit in less common families. They are handed
// out in family order, so the same family always gets the same colours.
const SPARE: ShareColour[] = [
  { fill: "#6B4E9B", text: WHITE }, // violet
  { fill: "#2B7F8C", text: WHITE }, // teal
  { fill: "#A3486F", text: WHITE }, // plum
  { fill: "#5D6B2E", text: WHITE }, // olive green
];

export const HEIR_ORDER: HeirGroupKey[] = [
  "husband", "wives", "sons", "daughters", "grandsons", "granddaughters",
  "father", "mother", "paternalGrandfather", "grandmothers",
  "fullBrothers", "fullSisters", "paternalBrothers", "paternalSisters",
  "maternalSiblings", "otherAgnates", "distantKindred",
];

/** Colours for the given inheriting groups, keyed by group. */
export function shareColours(keys: HeirGroupKey[]): Map<HeirGroupKey, ShareColour> {
  const out = new Map<HeirGroupKey, ShareColour>();
  let spare = 0;
  for (const key of HEIR_ORDER) {
    if (!keys.includes(key)) continue;
    out.set(key, FIXED[key] ?? SPARE[spare++] ?? SHARE_COLOURS.other);
  }
  return out;
}
