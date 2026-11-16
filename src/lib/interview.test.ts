import { describe, expect, it } from "vitest";
import { calculateFaraid } from "./faraid/engine";
import { frac } from "./faraid/fraction";
import { emptyCensus, type HeirCensus } from "./faraid/types";
import { askedCensus, censusQuestions, firstIncompleteStep, visibleSteps } from "./interview";
import { emptyWillData, mirrorWillData, normalizeWillData, type WillData } from "./will-types";

const census = (over: Partial<HeirCensus>): HeirCensus => ({
  ...emptyCensus(over.testatorSex ?? "male"),
  ...over,
});

const will = (over: Partial<HeirCensus>, rest: Partial<WillData> = {}): WillData => ({
  ...emptyWillData(),
  ...rest,
  sex: over.testatorSex ?? "male",
  census: census(over),
});

/** The inheriting shares as a comparable string, e.g. "father:5/6 mother:1/6". */
const shares = (c: HeirCensus) =>
  calculateFaraid(c)
    .shares.filter((s) => !s.share.isZero())
    .map((s) => `${s.key}:${s.share.toString()}`)
    .sort()
    .join(" ");

const stepIds = (d: WillData) => visibleSteps(d).map((s) => s.id);

describe("interview — siblings are counted whenever they can change a share", () => {
  it("asks about siblings when both parents are living and there are no children", () => {
    const d = will({ spouseCount: 0, father: true, mother: true });
    expect(stepIds(d)).toContain("siblings");
    expect(censusQuestions(askedCensus(d.census)).siblingsInherit).toBe(false);
  });

  it("parents and two brothers: mother one-sixth, father five-sixths", () => {
    const c = askedCensus(census({ father: true, mother: true, fullBrothers: 2 }));
    expect(c.fullBrothers).toBe(2); // not discarded as a hidden answer
    expect(shares(c)).toBe("father:5/6 mother:1/6");
  });

  it("wife, parents and two siblings: 1/4, 1/6, 7/12 — not the 'Umariyyatan split", () => {
    const c = askedCensus(
      census({ spouseCount: 1, father: true, mother: true, fullSisters: 1, maternalSiblings: 1 })
    );
    const r = calculateFaraid(c);
    const of = (k: string) => r.shares.find((s) => s.key === k)!.share;
    expect(of("wives").eq(frac(1, 4))).toBe(true);
    expect(of("mother").eq(frac(1, 6))).toBe(true);
    expect(of("father").eq(frac(7, 12))).toBe(true);
  });

  it("grandfather in the father's place: siblings still reduce the mother", () => {
    const d = will({ mother: true, paternalGrandfather: true, paternalBrothers: 2, spouseCount: 0 });
    expect(stepIds(d)).toContain("siblings");
    expect(shares(askedCensus(d.census))).toBe("mother:1/6 paternalGrandfather:5/6");
  });

  it("skips siblings when a son survives — they cannot change anything", () => {
    const d = will({ sons: 1, mother: true, father: true });
    expect(stepIds(d)).not.toContain("siblings");
  });

  it("skips siblings when the father survives and the mother does not", () => {
    const d = will({ father: true, spouseCount: 0 });
    expect(stepIds(d)).not.toContain("siblings");
  });
});

describe("interview — pruning never hides a question that matters", () => {
  let seed = 20261113;
  const rnd = (n: number) => {
    seed = (seed * 1103515245 + 12345) % 2147483648;
    return seed % n;
  };
  const randomCensus = (): HeirCensus => {
    const testatorSex = rnd(2) === 0 ? "male" : "female";
    // sparse families are the interesting ones, so most counts are usually zero
    const few = (max: number) => (rnd(3) === 0 ? rnd(max) : 0);
    const maybe = () => rnd(3) === 0;
    return census({
      testatorSex,
      spouseCount: testatorSex === "male" ? rnd(3) : rnd(2),
      sons: few(3),
      daughters: few(4),
      grandsons: few(3),
      granddaughters: few(3),
      father: maybe(),
      mother: maybe(),
      paternalGrandfather: maybe(),
      paternalGrandmother: maybe(),
      maternalGrandmother: maybe(),
      fullBrothers: few(3),
      fullSisters: few(3),
      paternalBrothers: few(3),
      paternalSisters: few(3),
      maternalSiblings: few(3),
      hasOtherAgnates: maybe(),
      hasDistantKindred: maybe(),
    });
  };

  it("clearing every unasked answer leaves every share unchanged (20,000 random families)", () => {
    for (let i = 0; i < 20000; i++) {
      const c = randomCensus();
      const asked = askedCensus(c);
      if (shares(c) !== shares(asked)) {
        throw new Error(
          `interview hides a question that changes the result:\n full  ${JSON.stringify(c)} → ${shares(c)}\n asked ${JSON.stringify(asked)} → ${shares(asked)}`
        );
      }
    }
  });

  it("askedCensus is stable: applying it twice changes nothing", () => {
    for (let i = 0; i < 2000; i++) {
      const once = askedCensus(randomCensus());
      expect(askedCensus(once)).toEqual(once);
    }
  });

  it("everyone the interview counted appears in the result, with a share or a reason", () => {
    const groups = [
      "sons", "daughters", "grandsons", "granddaughters", "fullBrothers", "fullSisters",
      "paternalBrothers", "paternalSisters", "maternalSiblings",
    ] as const;
    for (let i = 0; i < 5000; i++) {
      const c = askedCensus(randomCensus());
      const r = calculateFaraid(c);
      for (const g of groups) {
        if (c[g] > 0 && !r.shares.some((s) => s.key === g)) {
          throw new Error(`${g} missing from result for ${JSON.stringify(c)}`);
        }
      }
    }
  });
});

describe("interview — wider family", () => {
  it("asks about male-line relatives only when nobody nearer takes the remainder", () => {
    expect(stepIds(will({ spouseCount: 1 }))).toContain("agnates");
    expect(stepIds(will({ fullBrothers: 1 }))).not.toContain("agnates");
    // a sister beside a daughter takes the remainder herself
    expect(stepIds(will({ daughters: 1, fullSisters: 1 }))).not.toContain("agnates");
    expect(stepIds(will({ daughters: 1 }))).toContain("agnates");
  });

  it("offers the distant-kindred question only when no one but a spouse inherits", () => {
    expect(censusQuestions(census({ spouseCount: 1 })).distantKindred).toBe(true);
    expect(censusQuestions(census({ spouseCount: 1, hasOtherAgnates: true })).distantKindred).toBe(false);
    expect(censusQuestions(census({ mother: true })).distantKindred).toBe(false);
  });

  it("a hidden distant-kindred answer is discarded once a nearer heir is entered", () => {
    const c = askedCensus(census({ hasDistantKindred: true, daughters: 1 }));
    expect(c.hasDistantKindred).toBe(false);
  });
});

describe("interview — completeness before generating", () => {
  const complete = (): WillData => ({
    ...emptyWillData(),
    fullName: "Bilal Ahmed",
    address: "12 Example Road, Birmingham",
    executors: [{ name: "Imran Khan" }],
  });

  it("a complete will has nothing outstanding", () => {
    expect(firstIncompleteStep(complete(), false)).toBeNull();
  });

  it("points at the first step that still needs an answer", () => {
    expect(firstIncompleteStep({ ...complete(), fullName: "" }, false)?.id).toBe("about");
    expect(firstIncompleteStep({ ...complete(), executors: [] }, false)?.id).toBe("executors");
  });

  it("requires guardians only when there are children under 18", () => {
    const d = { ...complete(), hasMinorChildren: true, census: census({ sons: 1, spouseCount: 1 }) };
    expect(firstIncompleteStep(d, false)?.id).toBe("guardians");
    expect(firstIncompleteStep({ ...d, guardians: [{ name: "Fatima Khan" }] }, false)).toBeNull();
  });

  it("enforces the one-third cap on percentage bequests (premium only)", () => {
    const d: WillData = {
      ...complete(),
      bequests: [
        { beneficiary: "Islamic Relief", beneficiaryType: "charity", kind: "percentage", value: "20" },
        { beneficiary: "Local masjid", beneficiaryType: "charity", kind: "percentage", value: "15" },
      ],
    };
    expect(firstIncompleteStep(d, true)?.id).toBe("bequests");
    expect(firstIncompleteStep(d, false)).toBeNull(); // not part of a free will
    d.bequests[1].value = "13.33";
    expect(firstIncompleteStep(d, true)).toBeNull();
  });

  it("rejects a bequest with a non-numeric amount", () => {
    const d: WillData = {
      ...complete(),
      bequests: [{ beneficiary: "Aunt Sara", beneficiaryType: "person", kind: "amount", value: "lots" }],
    };
    expect(firstIncompleteStep(d, true)?.id).toBe("bequests");
  });
});

describe("stored answers are normalised before use", () => {
  it("survives nulls, wrong types and missing fields", () => {
    for (const junk of [null, undefined, 7, "x", [], { census: null }, { executors: "nobody", census: { sons: "3" } }]) {
      const d = normalizeWillData(junk);
      expect(() => calculateFaraid(askedCensus(d.census))).not.toThrow();
      expect(Array.isArray(d.executors)).toBe(true);
    }
  });

  it("keeps the census consistent with sex and marital status", () => {
    expect(normalizeWillData({ sex: "female", census: { spouseCount: 3 } }).census.spouseCount).toBe(1);
    expect(normalizeWillData({ maritalStatus: "widowed", census: { spouseCount: 1 } }).census.spouseCount).toBe(0);
    expect(normalizeWillData({ sex: "female" }).census.testatorSex).toBe("female");
    expect(normalizeWillData({ census: { sons: 999, daughters: -2, fullBrothers: 1.7 } }).census).toMatchObject({
      sons: 20,
      daughters: 0,
      fullBrothers: 1,
    });
  });

  it("an older draft without the newer fields keeps its answers", () => {
    const d = normalizeWillData({ fullName: "A B", census: { sons: 2, spouseCount: 1, hasOtherAgnates: true } });
    expect(d.fullName).toBe("A B");
    expect(d.census.sons).toBe(2);
    expect(d.census.hasDistantKindred).toBe(false);
    expect(d.heirNames).toEqual({});
  });
});

describe("mirror will", () => {
  it("swaps the couple and carries over only what they share", () => {
    const src: WillData = {
      ...emptyWillData(),
      fullName: "Bilal Ahmed",
      spouseName: "Maryam Ahmed",
      address: "12 Example Road",
      census: census({ spouseCount: 1, sons: 2, daughters: 1, father: true, fullBrothers: 1 }),
      sonNames: ["Yusuf", "Idris"],
      fatherName: "Ahmed senior",
      executors: [{ name: "Imran Khan" }],
      letterOfWishes: "private",
    };
    const m = mirrorWillData(src);
    expect(m.fullName).toBe("Maryam Ahmed");
    expect(m.spouseName).toBe("Bilal Ahmed");
    expect(m.sex).toBe("female");
    expect(m.census).toMatchObject({ testatorSex: "female", spouseCount: 1, sons: 2, daughters: 1, father: false, fullBrothers: 0 });
    expect(m.sonNames).toEqual(["Yusuf", "Idris"]);
    expect(m.fatherName).toBe("");
    expect(m.letterOfWishes).toBe("");
    expect(m.executors).toEqual([]);
  });
});
