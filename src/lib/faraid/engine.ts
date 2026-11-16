import { Fraction, frac, sum } from "./fraction";
import type {
  FaraidResult,
  HeirCensus,
  HeirGroupKey,
  HeirShare,
  TraceEntry,
} from "./types";

/**
 * Sunni fara'id calculation.
 *
 * Where the four schools agree, the consensus rule is applied. Where they
 * genuinely differ, the Hanafi position is applied and the trace says so:
 *  - the paternal grandfather stands in the father's place and excludes siblings;
 *  - in the mushtaraka case full brothers are not merged with uterine siblings;
 *  - surplus is returned (radd) to the surviving spouse when there is no other
 *    sharer or residuary heir.
 * Every applied rule is recorded in the trace for scholar review.
 */
export function calculateFaraid(census: HeirCensus): FaraidResult {
  validate(census);

  const trace: TraceEntry[] = [];
  const shares = new Map<HeirGroupKey, { share: Fraction; basis: HeirShare["basis"]; reason: string }>();
  const excluded: { key: HeirGroupKey; reason: string }[] = [];

  const c = census;
  const hasMaleDesc = c.sons > 0 || c.grandsons > 0;
  const hasDesc =
    c.sons + c.daughters + c.grandsons + c.granddaughters > 0;
  // for the mother's one-sixth rule, siblings count even if themselves excluded
  const siblingHeadcount =
    c.fullBrothers +
    c.fullSisters +
    c.paternalBrothers +
    c.paternalSisters +
    c.maternalSiblings;
  const fatherPresent = c.father;
  const grandfatherActs = !c.father && c.paternalGrandfather;
  const fatherOrGF = fatherPresent || grandfatherActs;

  // ---------------------------------------------------------------- hajb ---
  const note = (key: HeirGroupKey, reason: string) => {
    excluded.push({ key, reason });
    trace.push({ step: "Exclusion (hajb)", detail: reason });
  };

  const grandchildrenExcluded = c.sons > 0;
  if (grandchildrenExcluded && (c.grandsons > 0 || c.granddaughters > 0)) {
    if (c.grandsons > 0) note("grandsons", "Grandsons are excluded by a surviving son.");
    if (c.granddaughters > 0) note("granddaughters", "Granddaughters are excluded by a surviving son.");
  }
  const granddaughtersBlockedByTwoDaughters =
    !grandchildrenExcluded &&
    c.granddaughters > 0 &&
    c.daughters >= 2 &&
    c.grandsons === 0;
  if (granddaughtersBlockedByTwoDaughters) {
    note(
      "granddaughters",
      "Granddaughters are excluded because two or more daughters already take the two-thirds allotted to female descendants and no grandson is present to make them residuary heirs."
    );
  }

  if (c.paternalGrandfather && c.father) {
    note("paternalGrandfather", "The paternal grandfather is excluded by the father.");
  }

  const paternalGrandmotherEligible =
    c.paternalGrandmother && !c.mother && !c.father;
  const maternalGrandmotherEligible = c.maternalGrandmother && !c.mother;
  if (c.paternalGrandmother && !paternalGrandmotherEligible) {
    note(
      "grandmothers",
      c.mother
        ? "The paternal grandmother is excluded by the mother."
        : "The paternal grandmother is excluded by the father (majority position)."
    );
  }
  if (c.maternalGrandmother && !maternalGrandmotherEligible && c.mother) {
    note("grandmothers", "The maternal grandmother is excluded by the mother.");
  }

  const fullSiblingsExcluded = fatherOrGF || hasMaleDesc;
  if (fullSiblingsExcluded && c.fullBrothers + c.fullSisters > 0) {
    const reason = hasMaleDesc
      ? "Full siblings are excluded by a male descendant (son or son's son)."
      : fatherPresent
        ? "Full siblings are excluded by the father."
        : "Full siblings are excluded by the paternal grandfather (Hanafi position; other schools apportion — noted for scholar review).";
    if (c.fullBrothers > 0) note("fullBrothers", reason);
    if (c.fullSisters > 0) note("fullSisters", reason);
  }

  const maternalSiblingsExcluded = hasDesc || fatherOrGF;
  if (maternalSiblingsExcluded && c.maternalSiblings > 0) {
    note(
      "maternalSiblings",
      hasDesc
        ? "Maternal (uterine) siblings are excluded by any descendant."
        : "Maternal (uterine) siblings are excluded by the father or paternal grandfather."
    );
  }

  // ---------------------------------------------------------- fixed shares ---
  const spouseKey: HeirGroupKey = c.testatorSex === "male" ? "wives" : "husband";
  let spouseShare = Fraction.ZERO;
  if (c.spouseCount > 0) {
    if (spouseKey === "husband") {
      spouseShare = hasDesc ? frac(1, 4) : frac(1, 2);
      shares.set("husband", {
        share: spouseShare,
        basis: "quranic-share",
        reason: hasDesc
          ? "One-quarter — the husband's share when the deceased leaves descendants."
          : "One-half — the husband's share when the deceased leaves no descendants.",
      });
    } else {
      spouseShare = hasDesc ? frac(1, 8) : frac(1, 4);
      shares.set("wives", {
        share: spouseShare,
        basis: "quranic-share",
        reason:
          (hasDesc
            ? "One-eighth — the wife's share when the deceased leaves descendants"
            : "One-quarter — the wife's share when the deceased leaves no descendants") +
          (c.spouseCount > 1 ? `, divided equally between ${c.spouseCount} wives.` : "."),
      });
    }
    trace.push({
      step: "Spouse",
      detail: `${spouseKey === "husband" ? "Husband" : "Wife"} takes ${spouseShare.toString()}.`,
      source: "Qur'an 4:12",
    });
  }

  if (c.mother) {
    let motherShare: Fraction;
    let reason: string;
    if (hasDesc || siblingHeadcount >= 2) {
      motherShare = frac(1, 6);
      reason = hasDesc
        ? "One-sixth — the mother's share when the deceased leaves descendants."
        : "One-sixth — the mother's share when the deceased leaves two or more siblings.";
    } else if (c.spouseCount > 0 && fatherPresent) {
      // al-'Umariyyatan: mother takes one-third of what remains after the spouse
      motherShare = Fraction.ONE.sub(spouseShare).mul(frac(1, 3));
      reason =
        "One-third of the remainder after the spouse's share (the 'Umariyyatan rule, so the mother does not receive more than the father).";
      trace.push({
        step: "'Umariyyatan",
        detail: `Spouse, mother and father survive with no descendants: the mother takes one-third of the remainder (${motherShare.toString()}), the father the rest.`,
      });
    } else {
      motherShare = frac(1, 3);
      reason = "One-third — the mother's share when the deceased leaves no descendants and fewer than two siblings.";
    }
    shares.set("mother", { share: motherShare, basis: "quranic-share", reason });
    trace.push({ step: "Mother", detail: `Mother takes ${motherShare.toString()}.`, source: "Qur'an 4:11" });
  }

  const eligibleGrandmothers =
    (paternalGrandmotherEligible ? 1 : 0) + (maternalGrandmotherEligible ? 1 : 0);
  if (eligibleGrandmothers > 0) {
    shares.set("grandmothers", {
      share: frac(1, 6),
      basis: "quranic-share",
      reason:
        eligibleGrandmothers === 2
          ? "One-sixth shared equally between the two grandmothers."
          : "One-sixth — the grandmother's share in the absence of the mother.",
    });
    trace.push({ step: "Grandmother(s)", detail: "Grandmother(s) take one-sixth (by sunnah)." });
  }

  // father / acting grandfather: fixed sixth when there are descendants
  if (fatherPresent || grandfatherActs) {
    const key: HeirGroupKey = fatherPresent ? "father" : "paternalGrandfather";
    const label = fatherPresent ? "father" : "paternal grandfather (in the father's place)";
    if (hasMaleDesc) {
      shares.set(key, {
        share: frac(1, 6),
        basis: "quranic-share",
        reason: `One-sixth — the ${label}'s share when the deceased leaves a male descendant.`,
      });
      trace.push({ step: "Father/grandfather", detail: `The ${label} takes a fixed one-sixth.`, source: "Qur'an 4:11" });
    } else if (hasDesc) {
      shares.set(key, {
        share: frac(1, 6),
        basis: "quranic-plus-residuary",
        reason: `One-sixth plus any remainder — the ${label}'s entitlement when the deceased leaves only female descendants.`,
      });
      trace.push({
        step: "Father/grandfather",
        detail: `The ${label} takes one-sixth plus the remainder (female descendants only).`,
        source: "Qur'an 4:11",
      });
    }
    // no descendants: pure residuary — handled in the 'asaba stage
  }

  // daughters and son's daughters
  if (c.sons === 0 && c.daughters > 0) {
    const share = c.daughters === 1 ? frac(1, 2) : frac(2, 3);
    shares.set("daughters", {
      share,
      basis: "quranic-share",
      reason:
        c.daughters === 1
          ? "One-half — the share of an only daughter with no sons."
          : "Two-thirds shared equally — the share of two or more daughters with no sons.",
    });
    trace.push({ step: "Daughters", detail: `Daughter(s) take ${share.toString()}.`, source: "Qur'an 4:11" });
  }
  const granddaughtersFixedEligible =
    !grandchildrenExcluded &&
    !granddaughtersBlockedByTwoDaughters &&
    c.granddaughters > 0 &&
    c.grandsons === 0;
  if (granddaughtersFixedEligible) {
    let share: Fraction;
    let reason: string;
    if (c.daughters === 1) {
      share = frac(1, 6);
      reason = "One-sixth — completing the two-thirds allotted to female descendants alongside one daughter.";
    } else if (c.granddaughters === 1) {
      share = frac(1, 2);
      reason = "One-half — the share of an only son's daughter with no daughters or sons.";
    } else {
      share = frac(2, 3);
      reason = "Two-thirds shared equally — the share of two or more sons' daughters with no daughters or sons.";
    }
    shares.set("granddaughters", { share, basis: "quranic-share", reason });
    trace.push({ step: "Son's daughters", detail: `Son's daughter(s) take ${share.toString()}.` });
  }

  // sisters' fixed shares (kalala: no descendants, no father/grandfather)
  const fullSistersFixedEligible =
    !fullSiblingsExcluded && !hasDesc && c.fullSisters > 0 && c.fullBrothers === 0;
  if (fullSistersFixedEligible) {
    const share = c.fullSisters === 1 ? frac(1, 2) : frac(2, 3);
    shares.set("fullSisters", {
      share,
      basis: "quranic-share",
      reason:
        c.fullSisters === 1
          ? "One-half — the share of an only full sister in kalala (no descendants or father)."
          : "Two-thirds shared equally — the share of two or more full sisters in kalala.",
    });
    trace.push({ step: "Full sisters", detail: `Full sister(s) take ${share.toString()}.`, source: "Qur'an 4:176" });
  }

  const paternalSiblingsExcludedBase =
    fatherOrGF || hasMaleDesc || c.fullBrothers > 0;
  // a full sister made residuary by a daughter or son's daughter stands in a
  // full brother's place and excludes the paternal half-siblings
  const femaleDescInherits =
    c.daughters > 0 || (c.granddaughters > 0 && !grandchildrenExcluded);
  const fullSisterResiduary =
    !fullSiblingsExcluded && c.fullBrothers === 0 && c.fullSisters > 0 && femaleDescInherits;
  if (c.paternalBrothers + c.paternalSisters > 0) {
    const reason = hasMaleDesc
      ? "Paternal half-siblings are excluded by a male descendant."
      : fatherOrGF
        ? "Paternal half-siblings are excluded by the father or paternal grandfather."
        : c.fullBrothers > 0
          ? "Paternal half-siblings are excluded by a full brother."
          : fullSisterResiduary
            ? "Paternal half-siblings are excluded by a full sister who takes the remainder alongside the daughters."
            : null;
    if (reason) {
      if (c.paternalBrothers > 0) note("paternalBrothers", reason);
      if (c.paternalSisters > 0) note("paternalSisters", reason);
    }
  }

  let paternalSistersFixed = false;
  if (
    !paternalSiblingsExcludedBase &&
    !hasDesc &&
    c.paternalSisters > 0 &&
    c.paternalBrothers === 0
  ) {
    if (c.fullSisters >= 2) {
      note(
        "paternalSisters",
        "Paternal half-sisters are excluded because two or more full sisters already take the two-thirds and no paternal brother is present."
      );
    } else if (c.fullSisters === 1) {
      shares.set("paternalSisters", {
        share: frac(1, 6),
        basis: "quranic-share",
        reason: "One-sixth — completing the two-thirds allotted to sisters alongside one full sister.",
      });
      paternalSistersFixed = true;
      trace.push({ step: "Paternal sisters", detail: "Paternal half-sister(s) take one-sixth, completing the sisters' two-thirds." });
    } else {
      const share = c.paternalSisters === 1 ? frac(1, 2) : frac(2, 3);
      shares.set("paternalSisters", {
        share,
        basis: "quranic-share",
        reason:
          c.paternalSisters === 1
            ? "One-half — the share of an only paternal half-sister in kalala."
            : "Two-thirds shared equally — the share of two or more paternal half-sisters in kalala.",
      });
      paternalSistersFixed = true;
      trace.push({ step: "Paternal sisters", detail: `Paternal half-sister(s) take ${share.toString()}.`, source: "Qur'an 4:176" });
    }
  }

  if (!maternalSiblingsExcluded && c.maternalSiblings > 0) {
    const share = c.maternalSiblings === 1 ? frac(1, 6) : frac(1, 3);
    shares.set("maternalSiblings", {
      share,
      basis: "quranic-share",
      reason:
        c.maternalSiblings === 1
          ? "One-sixth — the share of a single uterine sibling."
          : "One-third shared equally (brothers and sisters alike) — the share of two or more uterine siblings.",
    });
    trace.push({ step: "Uterine siblings", detail: `Maternal sibling(s) take ${share.toString()}.`, source: "Qur'an 4:12" });
  }

  // ------------------------------------------------------------ 'awl check ---
  let fixedTotal = sum([...shares.values()].map((s) => s.share));
  let awlApplied = false;
  if (fixedTotal.gt(Fraction.ONE)) {
    awlApplied = true;
    const scale = Fraction.ONE.div(fixedTotal);
    trace.push({
      step: "'Awl (proportional abatement)",
      detail: `Fixed shares total ${fixedTotal.toString()}, more than the whole estate. All shares are scaled down proportionally by ${scale.toString()}.`,
    });
    for (const [k, v] of shares) {
      shares.set(k, { ...v, share: v.share.mul(scale) });
    }
    fixedTotal = Fraction.ONE;
  }

  // ------------------------------------------------------------- residue ----
  let residue = Fraction.ONE.sub(fixedTotal);
  const fixedSharesExhaustEstate = residue.isZero();
  let raddApplied = false;

  const setResiduary = (key: HeirGroupKey, share: Fraction, reason: string) => {
    const existing = shares.get(key);
    if (existing) {
      shares.set(key, {
        share: existing.share.add(share),
        basis: "quranic-plus-residuary",
        reason: existing.reason + " " + reason,
      });
    } else {
      shares.set(key, { share, basis: "residuary", reason });
    }
  };

  /** Split `amount` between a male group and female group at 2:1 per head. */
  const splitTwoToOne = (
    amount: Fraction,
    males: number,
    maleKey: HeirGroupKey,
    maleReason: string,
    females: number,
    femaleKey: HeirGroupKey,
    femaleReason: string
  ) => {
    const units = frac(2 * males + females);
    const maleShare = amount.mul(frac(2 * males)).div(units);
    const femaleShare = amount.mul(frac(females)).div(units);
    if (males > 0) setResiduary(maleKey, maleShare, maleReason);
    if (females > 0) setResiduary(femaleKey, femaleShare, femaleReason);
  };

  if (!residue.isZero() && residue.gt(Fraction.ZERO)) {
    const femaleDescPresent = femaleDescInherits;

    if (c.sons > 0) {
      splitTwoToOne(
        residue,
        c.sons,
        "sons",
        "Residue of the estate as residuary heirs, two shares to each son for every one share to a daughter (Qur'an 4:11).",
        c.daughters,
        "daughters",
        "Residue alongside the sons, one share to each daughter for every two to a son (Qur'an 4:11)."
      );
      trace.push({ step: "Residuaries ('asaba)", detail: `Children take the residue of ${residue.toString()} at two-to-one.`, source: "Qur'an 4:11" });
    } else if (c.grandsons > 0) {
      splitTwoToOne(
        residue,
        c.grandsons,
        "grandsons",
        "Residue as residuary heirs (sons' sons), two-to-one with sons' daughters.",
        c.granddaughters,
        "granddaughters",
        "Residue alongside the sons' sons at two-to-one (made residuary by them)."
      );
      trace.push({ step: "Residuaries ('asaba)", detail: `Sons' children take the residue of ${residue.toString()} at two-to-one.` });
    } else if (fatherPresent) {
      setResiduary("father", residue, hasDesc ? "Plus the remainder as residuary heir." : "The remainder as residuary heir (no descendants).");
      trace.push({ step: "Residuaries ('asaba)", detail: `Father takes the residue of ${residue.toString()}.` });
    } else if (grandfatherActs) {
      setResiduary("paternalGrandfather", residue, hasDesc ? "Plus the remainder as residuary heir." : "The remainder as residuary heir, standing in the father's place.");
      trace.push({ step: "Residuaries ('asaba)", detail: `Paternal grandfather takes the residue of ${residue.toString()}.` });
    } else if (!fullSiblingsExcluded && c.fullBrothers > 0) {
      splitTwoToOne(
        residue,
        c.fullBrothers,
        "fullBrothers",
        "Residue as residuary heirs, two-to-one with full sisters (Qur'an 4:176).",
        c.fullSisters,
        "fullSisters",
        "Residue alongside full brothers at two-to-one (Qur'an 4:176)."
      );
      trace.push({ step: "Residuaries ('asaba)", detail: `Full siblings take the residue of ${residue.toString()} at two-to-one.`, source: "Qur'an 4:176" });
    } else if (!fullSiblingsExcluded && c.fullSisters > 0 && femaleDescPresent) {
      setResiduary(
        "fullSisters",
        residue,
        "Residue as residuary heirs alongside the daughters ('asaba ma'a al-ghayr), shared equally."
      );
      trace.push({ step: "Residuaries ('asaba)", detail: `Full sisters take the residue of ${residue.toString()} as residuaries with the daughters.` });
    } else if (!paternalSiblingsExcludedBase && !(c.fullSisters > 0 && femaleDescPresent) && c.paternalBrothers > 0) {
      splitTwoToOne(
        residue,
        c.paternalBrothers,
        "paternalBrothers",
        "Residue as residuary heirs, two-to-one with paternal half-sisters.",
        c.paternalSisters,
        "paternalSisters",
        "Residue alongside paternal half-brothers at two-to-one."
      );
      trace.push({ step: "Residuaries ('asaba)", detail: `Paternal half-siblings take the residue of ${residue.toString()} at two-to-one.` });
    } else if (
      !paternalSiblingsExcludedBase &&
      c.paternalSisters > 0 &&
      femaleDescPresent &&
      !paternalSistersFixed &&
      c.fullSisters === 0
    ) {
      setResiduary(
        "paternalSisters",
        residue,
        "Residue as residuary heirs alongside the daughters ('asaba ma'a al-ghayr), shared equally."
      );
      trace.push({ step: "Residuaries ('asaba)", detail: `Paternal half-sisters take the residue of ${residue.toString()} as residuaries with the daughters.` });
    } else if (c.hasOtherAgnates) {
      setResiduary(
        "otherAgnates",
        residue,
        "Residue to the nearest male-line relative(s) in the established fiqh order (nephew, then paternal uncle, then cousin). The executor must identify the nearest class living at death."
      );
      trace.push({ step: "Residuaries ('asaba)", detail: `Residue of ${residue.toString()} passes to the nearest agnatic relative(s).` });
    } else if (
      c.hasDistantKindred &&
      [...shares.keys()].every((k) => k === "husband" || k === "wives")
    ) {
      // ------------------------------------------------- dhawu al-arham ----
      shares.set("distantKindred", {
        share: residue,
        basis: "distant-kindred",
        reason:
          "The remainder passes to the other blood relatives (dhawu al-arham), because no fixed-share heir other than a spouse and no residuary heir survives (Hanafi and Hanbali position). Their order and shares follow detailed rules — the executor must obtain a scholar's written determination.",
      });
      trace.push({
        step: "Distant kindred (dhawu al-arham)",
        detail: `No sharer other than a spouse and no residuary heir survives; the remainder of ${residue.toString()} passes to the other blood relatives. This engine does not apportion between them — flagged for scholar determination.`,
      });
    } else if (shares.size > 0) {
      // ------------------------------------------------------------ radd ----
      raddApplied = true;
      const nonSpouse = [...shares.entries()].filter(([k]) => k !== "husband" && k !== "wives");
      if (nonSpouse.length > 0) {
        const nonSpouseTotal = sum(nonSpouse.map(([, v]) => v.share));
        const target = Fraction.ONE.sub(spouseShare);
        for (const [k, v] of nonSpouse) {
          const newShare = v.share.div(nonSpouseTotal).mul(target);
          shares.set(k, {
            ...v,
            share: newShare,
            basis: "radd",
            reason: v.reason + " Increased pro-rata by the return (radd) of the undistributed surplus.",
          });
        }
        trace.push({
          step: "Radd (return of surplus)",
          detail: `No residuary heir survives; the surplus of ${residue.toString()} returns pro-rata to the sharers other than the spouse.`,
        });
      } else {
        // spouse alone
        const v = shares.get(spouseKey)!;
        shares.set(spouseKey, {
          ...v,
          share: Fraction.ONE,
          basis: "radd",
          reason: v.reason + " Plus the surplus by return (radd) — the position adopted by later Hanafi jurists where no other heir survives.",
        });
        trace.push({
          step: "Radd (return of surplus)",
          detail: "Only the spouse survives; the whole estate passes to the spouse (later Hanafi position; classically the surplus went to the public treasury).",
        });
      }
      residue = Fraction.ZERO;
    }
  }

  // mushtaraka information note
  if (
    c.fullBrothers > 0 &&
    !fullSiblingsExcluded &&
    c.maternalSiblings >= 2 &&
    !maternalSiblingsExcluded &&
    (shares.get("fullBrothers")?.share ?? Fraction.ZERO).isZero()
  ) {
    trace.push({
      step: "Mushtaraka note",
      detail:
        "The full brothers receive nothing because the fixed shares exhaust the estate (Hanafi and Hanbali position). The Maliki and Shafi'i schools would let them share the uterine siblings' third — flagged for scholar review.",
    });
  }

  // --------------------------------------------------------------- output ---
  const countOf = (key: HeirGroupKey): number => {
    switch (key) {
      case "husband": return 1;
      case "wives": return c.spouseCount;
      case "sons": return c.sons;
      case "daughters": return c.daughters;
      case "grandsons": return c.grandsons;
      case "granddaughters": return c.granddaughters;
      case "father": return 1;
      case "mother": return 1;
      case "paternalGrandfather": return 1;
      case "grandmothers": return eligibleGrandmothers || 1;
      case "fullBrothers": return c.fullBrothers;
      case "fullSisters": return c.fullSisters;
      case "paternalBrothers": return c.paternalBrothers;
      case "paternalSisters": return c.paternalSisters;
      case "maternalSiblings": return c.maternalSiblings;
      case "otherAgnates": return 1;
      case "distantKindred": return 1;
    }
  };

  // every relative entered must appear in the result: with a share, or with the
  // reason they take nothing
  const present: [HeirGroupKey, boolean][] = [
    ["sons", c.sons > 0],
    ["daughters", c.daughters > 0],
    ["grandsons", c.grandsons > 0],
    ["granddaughters", c.granddaughters > 0],
    ["fullBrothers", c.fullBrothers > 0],
    ["fullSisters", c.fullSisters > 0],
    ["paternalBrothers", c.paternalBrothers > 0],
    ["paternalSisters", c.paternalSisters > 0],
    ["maternalSiblings", c.maternalSiblings > 0],
    ["otherAgnates", c.hasOtherAgnates],
    ["distantKindred", c.hasDistantKindred],
  ];
  for (const [key, isPresent] of present) {
    if (!isPresent) continue;
    const got = shares.get(key);
    if ((got && !got.share.isZero()) || excluded.some((e) => e.key === key)) continue;
    excluded.push({
      key,
      reason:
        key === "distantKindred"
          ? "Other blood relatives inherit only when there is no fixed-share heir (other than a spouse) and no residuary heir."
          : key === "otherAgnates"
            ? "Nearer heirs take the whole estate, so the more distant male-line relatives receive nothing."
            : fixedSharesExhaustEstate
              ? "The fixed shares use up the whole estate, so nothing remains for the residuary heirs."
              : "Nearer heirs take the whole estate.",
    });
  }

  const result: HeirShare[] = [...shares.entries()]
    .filter(([, v]) => !v.share.isZero())
    .map(([key, v]) => {
      const count = countOf(key);
      return {
        key,
        count,
        share: v.share,
        perPerson: v.share.div(frac(count)),
        basis: v.basis,
        reason: v.reason,
      };
    })
    .sort((a, b) => b.share.cmp(a.share));

  for (const ex of excluded) {
    if (!shares.has(ex.key) || shares.get(ex.key)!.share.isZero()) {
      result.push({
        key: ex.key,
        count: countOf(ex.key),
        share: Fraction.ZERO,
        perPerson: Fraction.ZERO,
        basis: "excluded",
        reason: ex.reason,
      });
    }
  }

  const total = sum(result.map((r) => r.share));
  const noHeirs = shares.size === 0;
  if (!noHeirs && !total.eq(Fraction.ONE)) {
    throw new Error(
      `fara'id engine invariant violated: shares total ${total.toString()} — census ${JSON.stringify(census)}`
    );
  }
  if (noHeirs) {
    trace.push({
      step: "No fara'id heirs",
      detail:
        "No qualifying heir survives. Under the will the residue passes to the chosen charity in the way of Allah.",
    });
  }

  return { shares: result, trace, awlApplied, raddApplied, noHeirs, total };
}

function validate(c: HeirCensus) {
  const counts = [
    c.spouseCount, c.sons, c.daughters, c.grandsons, c.granddaughters,
    c.fullBrothers, c.fullSisters, c.paternalBrothers, c.paternalSisters,
    c.maternalSiblings,
  ];
  if (counts.some((x) => x < 0 || !Number.isInteger(x))) {
    throw new Error("Heir counts must be non-negative integers");
  }
  if (c.testatorSex === "male" && c.spouseCount > 4) {
    throw new Error("At most four wives");
  }
  if (c.testatorSex === "female" && c.spouseCount > 1) {
    throw new Error("At most one husband");
  }
}
