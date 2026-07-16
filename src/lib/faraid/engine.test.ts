import { describe, expect, it } from "vitest";
import { calculateFaraid } from "./engine";
import { frac } from "./fraction";
import { emptyCensus, type HeirCensus } from "./types";

const census = (over: Partial<HeirCensus>): HeirCensus => ({
  ...emptyCensus(over.testatorSex ?? "male"),
  ...over,
});

function shareOf(result: ReturnType<typeof calculateFaraid>, key: string) {
  const s = result.shares.find((x) => x.key === key);
  return s ? s.share : frac(0);
}

describe("fara'id engine — classical golden cases", () => {
  it("'Umariyyatan I: husband + mother + father", () => {
    const r = calculateFaraid(
      census({ testatorSex: "female", spouseCount: 1, mother: true, father: true })
    );
    expect(shareOf(r, "husband").eq(frac(1, 2))).toBe(true);
    expect(shareOf(r, "mother").eq(frac(1, 6))).toBe(true);
    expect(shareOf(r, "father").eq(frac(1, 3))).toBe(true);
  });

  it("'Umariyyatan II: wife + mother + father", () => {
    const r = calculateFaraid(
      census({ testatorSex: "male", spouseCount: 1, mother: true, father: true })
    );
    expect(shareOf(r, "wives").eq(frac(1, 4))).toBe(true);
    expect(shareOf(r, "mother").eq(frac(1, 4))).toBe(true);
    expect(shareOf(r, "father").eq(frac(1, 2))).toBe(true);
  });

  it("al-Minbariyya: wife + two daughters + father + mother ('awl 24→27)", () => {
    const r = calculateFaraid(
      census({ spouseCount: 1, daughters: 2, father: true, mother: true })
    );
    expect(r.awlApplied).toBe(true);
    expect(shareOf(r, "wives").eq(frac(1, 9))).toBe(true); // "her eighth became a ninth"
    expect(shareOf(r, "daughters").eq(frac(16, 27))).toBe(true);
    expect(shareOf(r, "father").eq(frac(4, 27))).toBe(true);
    expect(shareOf(r, "mother").eq(frac(4, 27))).toBe(true);
  });

  it("'awl 6→7: husband + two full sisters", () => {
    const r = calculateFaraid(
      census({ testatorSex: "female", spouseCount: 1, fullSisters: 2 })
    );
    expect(r.awlApplied).toBe(true);
    expect(shareOf(r, "husband").eq(frac(3, 7))).toBe(true);
    expect(shareOf(r, "fullSisters").eq(frac(4, 7))).toBe(true);
  });

  it("'awl 12→13: husband + two daughters + father", () => {
    const r = calculateFaraid(
      census({ testatorSex: "female", spouseCount: 1, daughters: 2, father: true })
    );
    expect(shareOf(r, "husband").eq(frac(3, 13))).toBe(true);
    expect(shareOf(r, "daughters").eq(frac(8, 13))).toBe(true);
    expect(shareOf(r, "father").eq(frac(2, 13))).toBe(true);
  });

  it("radd: daughter + mother", () => {
    const r = calculateFaraid(census({ daughters: 1, mother: true }));
    expect(r.raddApplied).toBe(true);
    expect(shareOf(r, "daughters").eq(frac(3, 4))).toBe(true);
    expect(shareOf(r, "mother").eq(frac(1, 4))).toBe(true);
  });

  it("radd with spouse kept at fixed share: wife + daughter + mother", () => {
    const r = calculateFaraid(census({ spouseCount: 1, daughters: 1, mother: true }));
    expect(shareOf(r, "wives").eq(frac(1, 8))).toBe(true);
    expect(shareOf(r, "daughters").eq(frac(21, 32))).toBe(true);
    expect(shareOf(r, "mother").eq(frac(7, 32))).toBe(true);
  });

  it("typical family: wife + 2 sons + 1 daughter + both parents", () => {
    const r = calculateFaraid(
      census({ spouseCount: 1, sons: 2, daughters: 1, father: true, mother: true })
    );
    expect(shareOf(r, "wives").eq(frac(1, 8))).toBe(true);
    expect(shareOf(r, "father").eq(frac(1, 6))).toBe(true);
    expect(shareOf(r, "mother").eq(frac(1, 6))).toBe(true);
    expect(shareOf(r, "sons").eq(frac(13, 30))).toBe(true); // residue 13/24 × 4/5
    expect(shareOf(r, "daughters").eq(frac(13, 120))).toBe(true);
  });

  it("husband + son: quarter and residue", () => {
    const r = calculateFaraid(census({ testatorSex: "female", spouseCount: 1, sons: 1 }));
    expect(shareOf(r, "husband").eq(frac(1, 4))).toBe(true);
    expect(shareOf(r, "sons").eq(frac(3, 4))).toBe(true);
  });

  it("son excludes full brother", () => {
    const r = calculateFaraid(census({ spouseCount: 1, sons: 1, fullBrothers: 1 }));
    expect(shareOf(r, "sons").eq(frac(7, 8))).toBe(true);
    expect(shareOf(r, "fullBrothers").isZero()).toBe(true);
    const ex = r.shares.find((s) => s.key === "fullBrothers");
    expect(ex?.basis).toBe("excluded");
  });

  it("father excludes brothers, but they still push mother to one-sixth", () => {
    const r = calculateFaraid(census({ mother: true, father: true, fullBrothers: 2 }));
    expect(shareOf(r, "mother").eq(frac(1, 6))).toBe(true);
    expect(shareOf(r, "father").eq(frac(5, 6))).toBe(true);
    expect(shareOf(r, "fullBrothers").isZero()).toBe(true);
  });

  it("Hanafi grandfather: excludes full brother, takes residue", () => {
    const r = calculateFaraid(
      census({ mother: true, paternalGrandfather: true, fullBrothers: 1 })
    );
    expect(shareOf(r, "mother").eq(frac(1, 3))).toBe(true);
    expect(shareOf(r, "paternalGrandfather").eq(frac(2, 3))).toBe(true);
    expect(shareOf(r, "fullBrothers").isZero()).toBe(true);
  });

  it("granddaughter completes two-thirds beside one daughter, then radd", () => {
    const r = calculateFaraid(census({ daughters: 1, granddaughters: 1 }));
    expect(shareOf(r, "daughters").eq(frac(3, 4))).toBe(true);
    expect(shareOf(r, "granddaughters").eq(frac(1, 4))).toBe(true);
  });

  it("two daughters exclude granddaughters unless a grandson exists", () => {
    const r1 = calculateFaraid(census({ daughters: 2, granddaughters: 1, mother: true }));
    expect(shareOf(r1, "granddaughters").isZero()).toBe(true);
    const r2 = calculateFaraid(
      census({ daughters: 2, granddaughters: 1, grandsons: 1, mother: true })
    );
    // daughters 2/3, mother 1/6, residue 1/6 to son's children 2:1
    expect(shareOf(r2, "grandsons").eq(frac(1, 9))).toBe(true);
    expect(shareOf(r2, "granddaughters").eq(frac(1, 18))).toBe(true);
  });

  it("mushtaraka pattern (Hanafi): full brothers take nothing when fixed shares exhaust the estate", () => {
    const r = calculateFaraid(
      census({
        testatorSex: "female",
        spouseCount: 1,
        mother: true,
        maternalSiblings: 2,
        fullBrothers: 1,
      })
    );
    expect(shareOf(r, "husband").eq(frac(1, 2))).toBe(true);
    expect(shareOf(r, "mother").eq(frac(1, 6))).toBe(true);
    expect(shareOf(r, "maternalSiblings").eq(frac(1, 3))).toBe(true);
    expect(shareOf(r, "fullBrothers").isZero()).toBe(true);
    expect(r.trace.some((t) => t.step === "Mushtaraka note")).toBe(true);
  });

  it("spouse alone: whole estate by radd (later Hanafi position)", () => {
    const r = calculateFaraid(census({ spouseCount: 1 }));
    expect(shareOf(r, "wives").eq(frac(1, 1))).toBe(true);
    expect(r.raddApplied).toBe(true);
  });

  it("two wives share the eighth equally", () => {
    const r = calculateFaraid(census({ spouseCount: 2, sons: 1 }));
    const wives = r.shares.find((s) => s.key === "wives")!;
    expect(wives.share.eq(frac(1, 8))).toBe(true);
    expect(wives.perPerson.eq(frac(1, 16))).toBe(true);
  });

  it("full sister + paternal sister: sixth completes the two-thirds, then radd", () => {
    const r = calculateFaraid(census({ fullSisters: 1, paternalSisters: 1 }));
    expect(shareOf(r, "fullSisters").eq(frac(3, 4))).toBe(true);
    expect(shareOf(r, "paternalSisters").eq(frac(1, 4))).toBe(true);
  });

  it("sisters become residuaries with daughters ('asaba ma'a al-ghayr)", () => {
    const r = calculateFaraid(census({ daughters: 1, fullSisters: 1 }));
    expect(shareOf(r, "daughters").eq(frac(1, 2))).toBe(true);
    expect(shareOf(r, "fullSisters").eq(frac(1, 2))).toBe(true);
  });

  it("husband + full sister: two halves, no 'awl or radd", () => {
    const r = calculateFaraid(census({ testatorSex: "female", spouseCount: 1, fullSisters: 1 }));
    expect(shareOf(r, "husband").eq(frac(1, 2))).toBe(true);
    expect(shareOf(r, "fullSisters").eq(frac(1, 2))).toBe(true);
    expect(r.awlApplied).toBe(false);
    expect(r.raddApplied).toBe(false);
  });

  it("uterine siblings share the third equally regardless of sex", () => {
    const r = calculateFaraid(
      census({ testatorSex: "female", maternalSiblings: 3, mother: true, hasOtherAgnates: true })
    );
    const m = r.shares.find((s) => s.key === "maternalSiblings")!;
    expect(m.share.eq(frac(1, 3))).toBe(true);
    expect(m.perPerson.eq(frac(1, 9))).toBe(true);
  });

  it("no heirs at all → noHeirs flag (residue to charity under the will)", () => {
    const r = calculateFaraid(census({}));
    expect(r.noHeirs).toBe(true);
    expect(r.shares.length).toBe(0);
  });

  it("distant agnates take the residue when flagged", () => {
    const r = calculateFaraid(census({ spouseCount: 1, hasOtherAgnates: true }));
    expect(shareOf(r, "wives").eq(frac(1, 4))).toBe(true);
    expect(shareOf(r, "otherAgnates").eq(frac(3, 4))).toBe(true);
  });
});

describe("fara'id engine — invariants over randomized censuses", () => {
  // deterministic LCG so failures are reproducible
  let seed = 20260716;
  const rnd = (n: number) => {
    seed = (seed * 1103515245 + 12345) % 2147483648;
    return seed % n;
  };

  it("shares always total exactly 1 whenever any heir exists (2,000 random censuses)", () => {
    for (let i = 0; i < 2000; i++) {
      const testatorSex = rnd(2) === 0 ? "male" : "female";
      const c = census({
        testatorSex,
        spouseCount: testatorSex === "male" ? rnd(3) : rnd(2),
        sons: rnd(4),
        daughters: rnd(4),
        grandsons: rnd(3),
        granddaughters: rnd(3),
        father: rnd(2) === 1,
        mother: rnd(2) === 1,
        paternalGrandfather: rnd(2) === 1,
        paternalGrandmother: rnd(2) === 1,
        maternalGrandmother: rnd(2) === 1,
        fullBrothers: rnd(3),
        fullSisters: rnd(3),
        paternalBrothers: rnd(3),
        paternalSisters: rnd(3),
        maternalSiblings: rnd(3),
        hasOtherAgnates: rnd(2) === 1,
      });
      // the engine throws internally if the total is not exactly 1
      const r = calculateFaraid(c);
      if (!r.noHeirs) {
        expect(r.total.eq(frac(1))).toBe(true);
      }
      // excluded rows carry zero and a reason
      for (const s of r.shares) {
        if (s.basis === "excluded") {
          expect(s.share.isZero()).toBe(true);
          expect(s.reason.length).toBeGreaterThan(0);
        }
      }
    }
  });
});
