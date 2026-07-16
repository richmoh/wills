import { calculateFaraid } from "./faraid/engine";
import type { FaraidResult } from "./faraid/types";
import { heirLabel } from "./faraid/labels";
import type { WillData } from "./will-types";

export interface Clause {
  heading: string;
  paragraphs: string[];
  list?: string[];
}

export interface ShareRow {
  heir: string;
  names?: string;
  fraction: string;
  percent: string;
  perPerson?: string;
}

export interface ExtraDoc {
  id: string;
  title: string;
  intro?: string;
  sections: { heading: string; paragraphs?: string[]; list?: string[] }[];
}

export interface WillDocument {
  testatorName: string;
  testatorAddress: string;
  clauses: Clause[];
  shareRows: ShareRow[];
  result: FaraidResult;
  extras: ExtraDoc[];
}

const join = (names: string[]) =>
  names.filter((n) => n.trim()).join(", ");

export function buildWillDocument(d: WillData, isPremium: boolean): WillDocument {
  const result = calculateFaraid(d.census);
  const clauses: Clause[] = [];

  const spouseTitle =
    d.sex === "male" ? (d.census.spouseCount > 1 ? "wives" : "wife") : "husband";

  // 1 — declaration and revocation
  clauses.push({
    heading: "Declaration and revocation",
    paragraphs: [
      `I, ${d.fullName.toUpperCase()}, of ${d.address}${d.dateOfBirth ? `, born on ${formatDate(d.dateOfBirth)}` : ""}, being of sound mind and memory, declare this to be my last will and testament. I revoke all wills and testamentary dispositions previously made by me.`,
      `I am a Muslim. I bear witness that there is no god but Allah, alone and without partner, and that Muhammad (peace and blessings be upon him) is His servant and His Messenger. I direct that my estate be administered and distributed in accordance with this will and, to the fullest extent permitted by the law of England and Wales, in accordance with the Islamic law of inheritance (fara'id).`,
    ],
  });

  // 2 — executors
  const executors = d.executors.filter((e) => e.name.trim());
  const executorLines = executors.map(
    (e, i) =>
      `${i + 1}. ${e.name}${e.relationship ? ` (my ${e.relationship})` : ""}${e.address ? `, of ${e.address}` : ""}`
  );
  clauses.push({
    heading: "Appointment of executors and trustees",
    paragraphs: [
      executors.length > 1
        ? `I appoint the following persons jointly to be the executors and trustees of this will. If any of them is unable or unwilling to act, the remainder may act alone.`
        : `I appoint the following person to be the executor and trustee of this will.`,
      `I ask my executors to administer my estate in consultation, where any question of Islamic law arises, with a suitably qualified Islamic scholar or recognised fiqh body in the United Kingdom.`,
    ],
    list: executorLines,
  });

  // 3 — guardians
  const guardians = d.guardians.filter((g) => g.name.trim());
  if (d.hasMinorChildren && guardians.length > 0) {
    clauses.push({
      heading: "Guardianship of my children",
      paragraphs: [
        `If at my death any of my children is under eighteen and no person with parental responsibility for them survives me, I appoint the following person${guardians.length > 1 ? "s" : ""} to be their guardian${guardians.length > 1 ? "s" : ""}, and I express the wish that my children be raised in the religion of Islam:`,
      ],
      list: guardians.map(
        (g, i) =>
          `${i + 1}. ${g.name}${g.relationship ? ` (my ${g.relationship})` : ""}${g.address ? `, of ${g.address}` : ""}`
      ),
    });
  }

  // 4 — funeral directions
  if (d.islamicBurial) {
    clauses.push({
      heading: "Funeral and burial directions",
      paragraphs: [
        `I direct, so far as the law and circumstances permit, that upon my death: my body be washed (ghusl) and shrouded (kafan) according to Islamic rites by Muslims of my own sex; that the funeral prayer (salat al-janazah) be performed over me; that I be buried, not cremated, as soon as reasonably possible after my death, in a Muslim burial ground or the Muslim section of a cemetery; that my body not be subjected to a post-mortem examination or organ removal unless required by law; and that my funeral be simple and free of extravagance, in accordance with the sunnah.`,
      ],
    });
  }

  // 5 — debts first, including debts to Allah
  const debts: string[] = [];
  if (isPremium) {
    if (d.religiousDebts.unpaidZakat)
      debts.push("any zakat unpaid at my death, to be calculated and discharged before distribution;");
    if (d.religiousDebts.missedFastsFidya)
      debts.push("fidya in respect of fasts I did not observe and could not make up;");
    if (d.religiousDebts.hajjNotPerformed)
      debts.push("the cost of arranging for Hajj to be performed on my behalf (hajj badal) by a suitable person, Hajj having remained obligatory upon me;");
    if (d.religiousDebts.kaffarah)
      debts.push("any outstanding kaffarah (expiation) owed by me;");
    if (d.religiousDebts.notes.trim())
      debts.push(`and in this regard my executors shall have regard to my note: “${d.religiousDebts.notes.trim()}”`);
  }
  clauses.push({
    heading: "Payment of debts and expenses",
    paragraphs: [
      `My executors shall first pay my funeral and testamentary expenses and all debts owed by me. I remind my executors that in Islam the settlement of debts takes priority over every gift and share, and I direct that debts owed to Allah be discharged from my estate as debts, including:`.concat(
        debts.length === 0
          ? " any unpaid zakat, fidya, kaffarah, or the cost of Hajj on my behalf, should any such obligation remain upon me at my death."
          : ""
      ),
    ],
    list: debts.length > 0 ? debts : undefined,
  });

  // 6 — bequests (premium)
  const bequests = isPremium ? d.bequests.filter((b) => b.beneficiary.trim() && b.value.trim()) : [];
  if (bequests.length > 0) {
    clauses.push({
      heading: "Bequests (wasiyya)",
      paragraphs: [
        `Subject to the payment of my debts and expenses, I give the following bequests. If the aggregate value of the bequests in this clause would exceed one-third of my net estate, they shall abate proportionately so that the aggregate equals one-third, in accordance with the limit set by the Messenger of Allah (peace and blessings be upon him).`,
      ],
      list: bequests.map((b, i) => {
        const what =
          b.kind === "percentage"
            ? `${b.value} per cent of my net estate`
            : b.kind === "amount"
              ? `the sum of £${b.value}`
              : b.value;
        return `${i + 1}. To ${b.beneficiary}${b.beneficiaryType === "charity" ? " (charity)" : ""}: ${what}.`;
      }),
    });
  }

  // 7 — residue per fara'id
  const shareRows = buildShareRows(d, result);
  clauses.push({
    heading: "Residuary estate — the Islamic shares",
    paragraphs: [
      `I give the residue of my estate, after payment of the above, to my heirs under the Islamic law of inheritance in the shares set out below, which have been calculated according to the Qur'an (4:11, 4:12 and 4:176) and the sunnah on the basis of my family at the date of this will:`,
      `If the relatives who survive me differ from those listed — through birth, death, marriage or divorce after the date of this will — my executors shall instead distribute the residue among my heirs living at my death strictly according to the Islamic law of inheritance, taking the written determination of a suitably qualified Islamic scholar or recognised UK fiqh body as conclusive.`,
      result.noHeirs
        ? `If, as at present, no fara'id heir survives me, the residue shall pass under the following clause.`
        : `Any share of a beneficiary who is under eighteen at my death shall be held by my trustees on trust for that beneficiary absolutely, to be paid over on their attaining eighteen, with power in the meantime to apply income and capital for their maintenance, education and benefit.`,
    ],
  });

  // 8 — ultimate default
  clauses.push({
    heading: "Ultimate gift",
    paragraphs: [
      `If no beneficiary named or described in this will survives me, I give my entire estate to ${d.fallbackCharity.trim() || "a UK-registered Islamic charity chosen by my executors"} for its general charitable purposes, as ongoing charity (sadaqah jariyah) on my behalf.`,
    ],
  });

  // 9 — administration
  clauses.push({
    heading: "Administrative provisions",
    paragraphs: [
      `My trustees shall have the fullest powers of sale, retention, investment and management permitted by law, exercised so far as reasonably practicable in a manner consistent with Islamic principles, avoiding usurious investment of my estate.`,
      `If any heir dies after me but before my estate is distributed, that heir's share shall form part of their own estate. If the order of death between me and any heir cannot be established, that person shall not be treated as having survived me for the purposes of this will, so far as the law permits, in accordance with the Islamic rule.`,
      `If any provision of this will is found invalid, the remainder shall take effect as if the invalid provision were severed.`,
    ],
  });

  // extras — the rest of the pack
  const extras: ExtraDoc[] = [];

  extras.push(signingInstructions(d));

  if (isPremium) {
    if (d.letterOfWishes.trim()) {
      extras.push({
        id: "letter",
        title: "Letter of wishes",
        intro:
          "This letter is not part of the will and is not legally binding. It travels with the will to guide your family and executors.",
        sections: [
          {
            heading: `From ${d.fullName}`,
            paragraphs: d.letterOfWishes.trim().split(/\n{2,}/),
          },
        ],
      });
    }
    extras.push(executorPack(d, spouseTitle));
    extras.push(estateChecklist(d));
  }

  return {
    testatorName: d.fullName,
    testatorAddress: d.address,
    clauses,
    shareRows,
    result,
    extras,
  };
}

function buildShareRows(d: WillData, result: FaraidResult): ShareRow[] {
  const namesFor = (key: string): string | undefined => {
    switch (key) {
      case "husband":
      case "wives":
        return d.spouseName.trim() || undefined;
      case "sons":
        return join(d.sonNames) || undefined;
      case "daughters":
        return join(d.daughterNames) || undefined;
      case "father":
        return d.fatherName.trim() || undefined;
      case "mother":
        return d.motherName.trim() || undefined;
      default:
        return undefined;
    }
  };
  return result.shares
    .filter((s) => !s.share.isZero())
    .map((s) => ({
      heir: heirLabel(s.key, s.count),
      names: namesFor(s.key),
      fraction: s.share.toString(),
      percent: s.share.toPercent(2),
      perPerson: s.count > 1 ? `${s.perPerson.toString()} each` : undefined,
    }));
}

function signingInstructions(d: WillData): ExtraDoc {
  return {
    id: "signing",
    title: "How to sign your will — read before signing",
    intro:
      "A will is only valid in England & Wales if it is signed exactly as the Wills Act 1837 requires. Follow these steps precisely.",
    sections: [
      {
        heading: "Choose your two witnesses",
        list: [
          "Both witnesses must be adults (18+) with capacity, physically present together with you.",
          "CRITICAL: a witness — or the husband/wife/civil partner of a witness — must NOT be a beneficiary of this will. If they witness it, their gift fails (Wills Act 1837, s.15). Do not use your spouse, children, parents or any heir. Neighbours, colleagues or friends who receive nothing under the will are ideal.",
          "Your executors may witness only if they receive nothing under the will — safer to choose others.",
        ],
      },
      {
        heading: "The signing ceremony",
        list: [
          "Gather with both witnesses in one room. Nobody leaves until all three signatures are complete.",
          "1. Check the date is filled in.",
          "2. You sign on the testator line, in ink, while both witnesses watch you sign.",
          "3. Witness one signs, adds their full name, address and occupation, while you and witness two watch.",
          "4. Witness two does the same, while you and witness one watch.",
          "Do not use pencil. Do not sign counterparts separately. Initial any hand-corrections, and have both witnesses initial them too.",
        ],
      },
      {
        heading: "Afterwards",
        list: [
          "Store the signed original somewhere safe and dry — with your solicitor, your bank, or the Probate Service's will storage (HM Courts & Tribunals).",
          `Tell your executor${d.executors.filter((e) => e.name).length > 1 ? "s" : ""} where the original is kept. A copy is not enough for probate.`,
          "Do not attach anything to the will with staples, clips or pins once signed — marks raise questions at probate.",
          "Review your will after every birth, death, marriage, divorce or house purchase. Marriage revokes a will automatically unless made in contemplation of that marriage.",
        ],
      },
    ],
  };
}

function executorPack(d: WillData, spouseTitle: string): ExtraDoc {
  return {
    id: "executors",
    title: "Executor guidance — a note for those you have trusted",
    intro: `${d.fullName} has appointed you executor of an Islamic will. This note explains the order of duties.`,
    sections: [
      {
        heading: "The Islamic order of administration",
        list: [
          "1. Funeral first — simple, according to the sunnah, paid from the estate before anything else. Burial should not be delayed.",
          "2. Debts second — all debts to people, and debts to Allah (unpaid zakat, fidya, kaffarah, Hajj on the deceased's behalf) are paid before any gift or share. The will's schedule lists what the deceased identified.",
          "3. Bequests third — the wasiyya gifts in the will, capped at one-third of the net estate.",
          "4. The heirs' shares last — distributed exactly in the fractions set out in the will. Do not adjust them by personal judgement; if the family has changed since the will was signed, obtain a written fara'id determination from a qualified scholar or UK fiqh body as the will directs.",
        ],
      },
      {
        heading: "The legal side (England & Wales)",
        list: [
          "You will usually need a Grant of Probate from HM Courts & Tribunals before banks and the Land Registry will act on your instructions. Apply online at gov.uk/applying-for-probate.",
          "Value the estate, report to HMRC where required, and settle any inheritance tax before distribution. Estates passing to a spouse are generally exempt; take advice where the estate approaches the nil-rate band (£325,000).",
          "Keep accounts of everything: heirs under fara'id are entitled to exact fractions, so precise records protect you.",
          `Assets owned jointly (for example a family home held as joint tenants with the ${spouseTitle}) pass automatically to the co-owner and are NOT part of the estate the will distributes — check title before calculating shares.`,
        ],
      },
    ],
  };
}

function estateChecklist(d: WillData): ExtraDoc {
  const home = d.complexity.homeOwnership;
  return {
    id: "checklist",
    title: "Make your whole estate follow your will — action checklist",
    intro:
      "A will only controls assets that pass through your estate. These steps bring the rest of your affairs into line with your Islamic shares.",
    sections: [
      {
        heading: "Your home",
        list: [
          home === "joint"
            ? "You told us your home is owned as JOINT TENANTS: on death it passes automatically to the co-owner, bypassing your will and the fara'id shares entirely. To fix this, sever the joint tenancy into a TENANCY IN COMMON (Land Registry form SEV — free, no solicitor strictly required) so your share passes under your will."
            : home === "unsure"
              ? "Check how your home is owned: download the title from the Land Registry (£7). If it shows a joint tenancy, sever it into a tenancy in common (form SEV) so your share passes under your will."
              : "If you buy property jointly in future, hold it as tenants in common so your share passes under your will.",
        ],
      },
      {
        heading: "Money that bypasses wills",
        list: [
          "Pensions: death benefits pass by the scheme's nomination, not your will. Complete or update each scheme's 'expression of wish' form to match your Islamic shares, or nominate your estate.",
          "Life insurance: check whether the policy is written in trust and who the beneficiaries are; align them with your shares or your estate.",
          "Joint bank accounts pass to the surviving holder automatically — keep balances modest or document the true ownership of the funds.",
          "Death-in-service benefits from your employer follow a nomination form — update it.",
        ],
      },
      {
        heading: "Keep it living",
        list: [
          "Tell your executors where the signed original will is stored.",
          "Keep a simple asset list (accounts, properties, pensions, debts owed to and by you) with your will — it halves your executors' work.",
          "Regenerate your will after every birth, death, marriage or divorce in the family. Marriage revokes an existing will automatically.",
          "Pay zakat promptly each year — unpaid zakat becomes a debt on your estate.",
        ],
      },
    ],
  };
}

function formatDate(iso: string): string {
  try {
    return new Date(iso + "T00:00:00").toLocaleDateString("en-GB", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  } catch {
    return iso;
  }
}
