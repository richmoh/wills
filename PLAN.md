# Islamic Will Generator — Project Plan

A website that interviews a user with as few questions as possible and produces a
professionally drafted will that is (a) valid and enforceable under the law of the
user's jurisdiction and (b) distributes the estate according to Islamic inheritance
law (fara'id), with the Islamic-specific clauses a Muslim will needs.

---

## 1. Honest feasibility assessment

**Buildable: yes.** The interview flow, the inheritance-share calculation engine, the
document generation, and the signing instructions can all be built and tested in
software. Real products in this space (template packs from mosques and Islamic
charities, a handful of online generators) prove the model works.

**Two things software alone cannot deliver, and the plan must account for them:**

1. **"Legal" is jurisdiction-specific.** There is no single will that is valid
   everywhere. Execution formalities (witnessing, signatures), spousal rights, and
   probate rules differ by country and, in the US, by state. The product must be
   built around a *jurisdiction module*, launch with one or two jurisdictions done
   properly, and add more over time.
2. **Professional sign-off.** To honestly call the output "professional and legal,"
   the templates should be reviewed once per jurisdiction by a qualified
   solicitor/attorney, and the fara'id engine and Islamic clauses reviewed by a
   qualified scholar or fatwa body. This is a one-time (per jurisdiction) external
   cost, not a per-user one. Until then, the site operates as a self-help document
   assembly tool with clear disclaimers — the same legal posture as LegalZoom-style
   services (this avoids unauthorized-practice-of-law problems in the US).

---

## 2. The core insight for "as few questions as possible"

Islamic inheritance law itself minimizes the interview. The **hajb (exclusion) rules**
mean the presence of certain heirs removes others from consideration entirely, so the
question flow can prune aggressively:

- If the deceased has a **son**, siblings, nephews, uncles, and grandchildren-through-
  sons are all excluded → never ask about them.
- If the **father** is alive, grandfathers and (in most cases) siblings are excluded.
- Maternal siblings are excluded by any descendant or male ascendant.

So the interview is a **decision tree, not a form**. A typical user (married, children,
maybe a living parent) answers roughly **12–18 questions total**, including executor,
guardianship, and funeral wishes. Only unusual family structures (no descendants, no
parents) get deeper questions about siblings and remoter kin.

Question groups, in order:

1. **You** — name, address, jurisdiction of residence (drives everything downstream).
2. **Family snapshot** — marital status; number of sons/daughters; parents alive?
   Branch from here only as needed.
3. **Executor (wasi)** — primary + backup.
4. **Guardians** for minor children (only asked if minors exist).
5. **Wasiyya (optional bequest)** — up to 1/3 of the estate to charity or to people
   who are not fara'id heirs (e.g., non-Muslim relatives, adopted children,
   grandchildren orphaned by a predeceased child). The UI enforces the 1/3 cap.
6. **Religious debts** — unpaid zakat, fidya, kaffarah, hajj not yet performed
   (yes/no checkboxes that insert instructions to the executor).
7. **Funeral wishes** — Islamic burial clause (ghusl, kafan, janazah, prompt burial,
   no cremation/embalming to the extent the law allows).
8. **Live preview** — a chart showing exactly who inherits what fraction, updating as
   answers change, with a plain-English explanation of each share. This builds trust
   and doubles as the audit trail for scholar review.

---

## 3. What the generated will contains

Standard structure of a fara'id-compliant will for a common-law jurisdiction:

1. Identification, declaration of faith, revocation of prior wills.
2. Appointment of executor(s) and, where useful, trustees.
3. Guardianship of minor children.
4. Funeral and burial directions per Islamic rites.
5. Payment of debts and expenses **first**, expressly including religious debts.
6. Wasiyya bequests (≤ 1/3 of the net estate, to non-heirs only by default; the
   classical rule is that a bequest to an existing heir requires the other heirs'
   consent — the UI explains this instead of silently allowing it).
7. **Residuary estate distributed per fara'id.** Two drafting strategies, both
   supported:
   - **Calculated shares (default):** the will names each beneficiary with their
     exact fraction as computed today, plus contingency clauses, plus a prominent
     instruction to re-generate the will after births, deaths, marriage, or divorce.
     Courts like this — it is certain.
   - **Schedule/formula clause:** the residue is left "in accordance with the Islamic
     rules of inheritance as set out in the attached Schedule," incorporating a
     standard fara'id table by reference. More durable across life changes; used by
     several established mosque/charity templates. Offered as an option with
     guidance on when each approach suits.
8. Simultaneous-death, minor-beneficiary (trust until majority), and severance
   clauses.
9. Attestation block + **step-by-step signing instructions** specific to the
   jurisdiction (see §5).

---

## 4. The fara'id engine (the technical heart)

A pure, dependency-free TypeScript package, `packages/faraid-engine`:

- **Exact rational arithmetic** (numerator/denominator integers) — never floats.
  Shares are fractions like 1/8, 2/3; floating point would be both wrong and
  embarrassing in scholar review.
- **Input:** the heir census (spouse and count of wives, sons, daughters, father,
  mother, grandparents, full/paternal/maternal siblings, etc.) plus madhhab setting.
- **Output:** a map of heir → fraction **and a rule trace** — the ordered list of
  rules applied ("mother takes 1/6 because descendants exist [Qur'an 4:11]",
  "'awl applied: shares summed to 27/24, scaled down proportionally"). The trace
  powers the live preview's explanations and makes scholar audit tractable.
- **Rules implemented:** fixed Quranic shares (dhawu al-furud), residuary heirs
  ('asaba) with 2:1 male:female among children, exclusion (hajb), oversubscription
  ('awl), surplus return (radd), the two 'Umariyyatan mother-third-of-remainder
  cases, grandfather-with-siblings per selected madhhab.
- **Scope decision:** MVP implements the Sunni majority/consensus positions with a
  madhhab toggle where the four schools genuinely diverge (radd to spouse,
  grandfather vs. siblings). Ja'fari (Shia) inheritance differs structurally and is
  a Phase-2+ addition, clearly labelled until then.
- **Testing:** golden-case suite from classical fara'id textbooks and worked
  examples (dozens of canonical cases including the famous 'awl and mushtaraka
  cases); property tests (shares always sum to exactly 1 after 'awl/radd; excluded
  heirs never receive shares; adding a son never increases a sibling's share);
  cross-checks against established fara'id calculators.

---

## 5. The jurisdiction module

Each supported jurisdiction is a data + template pack: execution formalities, warning
rules, and clause variants. **Decision needed: which jurisdiction(s) first.** The
architecture is the same regardless; candidates:

- **England & Wales** — the easiest strong start. Near-total testamentary freedom
  makes fara'id compliance straightforward. Formalities: Wills Act 1837 s.9 (in
  writing; signed by the testator; two witnesses present at the same time; witnesses
  sign). Critical trap the product must enforce: **a beneficiary (or their spouse)
  who witnesses the will loses their gift** (s.15) — signing instructions must say
  witnesses must be independent adults. Known risk to disclose: family-provision
  claims under the Inheritance (Provision for Family and Dependants) Act 1975.
- **US states** — bigger market, more work: formalities vary by state; most require
  two witnesses; self-proving notarized affidavits recommended. Two structural
  conflicts to surface honestly: the **spousal elective share** (a surviving spouse
  can claim a statutory portion regardless of the will, which can exceed the fara'id
  spouse share) and **community property** in nine states. Mitigations exist
  (spousal waivers, lifetime planning) but need attorney involvement — the product
  should detect these situations and say so.
- **Canada / Australia** — provincial/state variation, generally two-witness
  regimes, strong family-provision claims in Australia.

**Universal education the product must provide** (this is where DIY wills actually
fail people): assets that pass *outside* the will — jointly-owned homes (joint
tenancy survivorship overrides the will; Muslim couples typically need to sever to
tenancy in common), life insurance and pension nominations. The output pack includes
a one-page "make your whole estate fara'id-compliant" checklist covering these.

**Complexity gating:** certain answers (estate over a threshold, business ownership,
foreign assets, previous marriages, agricultural land, a spouse likely to claim an
elective share) trigger a clear "this tool can produce your will, but you should have
a solicitor review it" banner. Professional honesty is a feature.

---

## 6. Architecture & stack

- **Monorepo:** `packages/faraid-engine` (pure TS), `packages/documents`
  (per-jurisdiction clause library + templates), `apps/web` (Next.js + TypeScript).
- **Privacy as the headline feature: everything runs client-side.** The interview,
  the fara'id calculation, and the PDF generation all happen in the browser. No
  account, no server storage, nothing about the user's family or estate ever leaves
  their device. Optionally let users download an encrypted JSON of their answers to
  re-load later for updates. This is both the right thing and a differentiator.
- **Document output:** print-quality PDF generated in-browser, plus a .docx export
  so a reviewing solicitor can edit. Output pack = will + signing instructions +
  witness guidance + the fara'id explanation sheet + the estate-alignment checklist.
- **Hosting:** static deployment (Vercel/Netlify/Cloudflare) — cheap, fast, and
  consistent with the no-server-data promise.
- **i18n:** English first; Arabic and Urdu strings are a straightforward later
  addition given the audience.
- **Accessibility:** WCAG AA; many users will be older.

## 7. Phases

| Phase | Deliverable |
|---|---|
| 0 | Decisions: first jurisdiction(s), Sunni-consensus scope, business model, product name/domain |
| 1 | Fara'id engine + full test suite + rule-trace explanations |
| 2 | Interview flow (decision tree) + live share preview with charts |
| 3 | Document templates for jurisdiction #1, PDF/.docx generation, signing-instruction pack |
| 4 | External review: solicitor (jurisdiction) + scholar (fiqh); disclaimers, T&Cs, privacy policy; polish |
| 5 | Launch; then additional jurisdictions, madhhab options, Ja'fari support, translations |

Phases 1–3 are pure software and can be built and demoed immediately. Phase 4's
external reviews are the only part requiring outside professionals.

## 8. Key risks, stated plainly

1. **Elective share / forced spousal rights (US)** can override fara'id shares — must
   be detected and disclosed, not hidden.
2. **Non-probate assets** silently defeat the will if not addressed — solved by the
   checklist and education, not the will document itself.
3. **Stale wills:** calculated shares go wrong when the family changes — mitigated by
   the schedule-clause option and loud "regenerate after life events" guidance.
4. **Sensitive rule areas** need careful UX, not silent automation: bequests to
   heirs (needs heirs' consent), non-Muslim relatives (not fara'id heirs — the
   wasiyya third is the classical instrument for providing for them), orphaned
   grandchildren (excluded classically; offer the wasiyya wajiba-style optional
   bequest), polygamous marriages (fiqh recognizes up to four wives sharing the
   wife's share; Western law recognizes one legal spouse — needs careful drafting).
5. **Unauthorized practice of law:** stay firmly a document-assembly tool with
   disclaimers; never generate individualized legal advice.

## 9. Open decisions (for Richard)

1. **First jurisdiction?** Recommendation: England & Wales if UK-based (simplest
   fara'id fit), otherwise the home US state.
2. **Default drafting strategy:** calculated shares (recommended default) vs.
   schedule clause — or offer both from day one.
3. **Business model:** free/charity (sadaqah jariyah), one-time fee, or freemium
   (free will, paid solicitor-review referral)?
4. **Scholar and solicitor contacts** for Phase 4 review — any existing
   relationships?
