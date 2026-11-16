"use client";

import { useEffect, useId, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { calculateFaraid } from "@/lib/faraid/engine";
import type { HeirCensus } from "@/lib/faraid/types";
import {
  askedCensus,
  BEQUEST_CAP_PERCENT,
  censusQuestions,
  firstIncompleteStep,
  percentBequestTotal as bequestTotal,
  validateStep as validate,
  visibleSteps,
  type StepDef,
  type StepId,
} from "@/lib/interview";
import {
  AGNATE_KINDS,
  solicitorFlags,
  type AgnateKind,
  type Bequest,
  type NamedGroup,
  type WillData,
} from "@/lib/will-types";
import { AppHeader } from "@/components/AppHeader";
import { ReviewShares, SharesPanel, SharesSummary } from "./SharePreview";
import {
  ChoiceField,
  CountField,
  NameList,
  PersonListEditor,
  REPEAT_BLOCK,
  RemoveButton,
  TextField,
  YesNo,
} from "./fields";

// ------------------------------------------------- how the steps are shown --

type GroupId = "family" | "wishes" | "finish";

const GROUPS: { id: GroupId; title: string }[] = [
  { id: "family", title: "Your family" },
  { id: "wishes", title: "Your wishes" },
  { id: "finish", title: "Finish" },
];

/** The short name of each step in the section list, and the group it sits in. */
const NAV: Record<StepId, { label: string; group: GroupId }> = {
  about: { label: "About you", group: "family" },
  marriage: { label: "Marriage", group: "family" },
  children: { label: "Children", group: "family" },
  grandchildren: { label: "Grandchildren", group: "family" },
  parents: { label: "Parents", group: "family" },
  grandparents: { label: "Grandparents", group: "family" },
  siblings: { label: "Brothers and sisters", group: "family" },
  agnates: { label: "Wider family", group: "family" },
  executors: { label: "Executors", group: "wishes" },
  guardians: { label: "Guardians", group: "wishes" },
  funeral: { label: "Funeral and burial", group: "wishes" },
  bequests: { label: "Bequests", group: "wishes" },
  debts: { label: "Religious debts", group: "wishes" },
  wishes: { label: "Letter of wishes", group: "wishes" },
  estate: { label: "Your estate", group: "finish" },
  review: { label: "Review and generate", group: "finish" },
};

const lowerFirst = (s: string) => s.charAt(0).toLowerCase() + s.slice(1);

/** Steps where the phone shows the shares above its buttons. */
const SHARES_ON_PHONE: StepId[] = [
  "children",
  "grandchildren",
  "parents",
  "grandparents",
  "siblings",
  "agnates",
];

const FAMILY_STEPS: StepId[] = [
  "marriage",
  "children",
  "grandchildren",
  "parents",
  "grandparents",
  "siblings",
  "agnates",
];

export function WillWizard({
  willId,
  initialData,
  isPremium,
}: {
  willId: string;
  initialData: WillData;
  isPremium: boolean;
}) {
  const router = useRouter();
  const [data, setData] = useState<WillData>(initialData);
  // resume on the step the user last had open
  const [stepIndex, setStepIndex] = useState(() =>
    Math.max(0, visibleSteps(initialData).findIndex((s) => s.id === initialData.lastStep))
  );
  // the furthest step reached in this sitting: the section list ticks what is behind it
  const [furthest, setFurthest] = useState(stepIndex);
  const [saveState, setSaveState] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [stepError, setStepError] = useState<string | null>(null);
  const [generating, setGenerating] = useState(false);
  const [sheetOpen, setSheetOpen] = useState(false);
  const sheetId = useId();
  const [grandchildrenOpen, setGrandchildrenOpen] = useState(
    initialData.census.grandsons + initialData.census.granddaughters > 0
  );

  const steps = visibleSteps(data);
  const step = steps[Math.min(stepIndex, steps.length - 1)];
  const isReview = step.id === "review";
  // the census as asked: answers to questions that are no longer shown are ignored
  const census = useMemo(() => askedCensus(data.census), [data.census]);
  const q = censusQuestions(census);

  const set = (patch: Partial<WillData>) => setData((d) => ({ ...d, ...patch }));
  const setCensus = (patch: Partial<HeirCensus>) =>
    setData((d) => ({ ...d, census: { ...d.census, ...patch } }));
  const setNames = (group: NamedGroup, list: string[]) =>
    setData((d) => ({ ...d, heirNames: { ...d.heirNames, [group]: list } }));
  const namesOf = (group: NamedGroup) => data.heirNames[group] ?? [];

  // ----- autosave (debounced, flushed when the page is left) -----
  const firstRender = useRef(true);
  const pending = useRef<WillData | null>(null);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    if (firstRender.current) {
      firstRender.current = false;
      return;
    }
    pending.current = data;
    setSaveState("saving");
    const t = setTimeout(async () => {
      try {
        const res = await fetch(`/api/wills/${willId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ data }),
        });
        if (res.ok && pending.current === data) pending.current = null;
        setSaveState(res.ok ? "saved" : "error");
      } catch {
        setSaveState("error");
      }
    }, 900);
    saveTimer.current = t;
    return () => clearTimeout(t);
  }, [data, willId]);

  useEffect(() => {
    const flush = () => {
      if (!pending.current) return;
      fetch(`/api/wills/${willId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ data: pending.current }),
        keepalive: true,
      }).catch(() => {});
      pending.current = null;
    };
    window.addEventListener("pagehide", flush);
    return () => {
      window.removeEventListener("pagehide", flush);
      flush();
    };
  }, [willId]);

  const result = useMemo(() => {
    try {
      return calculateFaraid(census);
    } catch {
      return null;
    }
  }, [census]);

  const percentBequestTotal = bequestTotal(data);

  // an explanation of why the step cannot be left must not be missed, least
  // of all on a phone, where the buttons sit below the questions
  const errorRef = useRef<HTMLParagraphElement | null>(null);
  useEffect(() => {
    if (stepError) errorRef.current?.scrollIntoView({ block: "center" });
  }, [stepError]);

  const goTo = (index: number) => {
    const i = Math.max(0, Math.min(index, steps.length - 1));
    setStepError(null);
    setSheetOpen(false);
    setStepIndex(i);
    setFurthest((f) => Math.max(f, i));
    set({ lastStep: steps[i].id });
    window.scrollTo({ top: 0 });
  };
  const goNext = () => {
    const err = validate(step.id, data, isPremium);
    if (err) {
      setStepError(err);
      return;
    }
    goTo(stepIndex + 1);
  };
  const goBack = () => goTo(stepIndex - 1);

  const generate = async () => {
    // every required answer is re-checked, however the user reached this step
    const missing = firstIncompleteStep(data, isPremium);
    if (missing) {
      goTo(steps.findIndex((s) => s.id === missing.id));
      setStepError(missing.message);
      return;
    }
    setGenerating(true);
    // a draft autosave still waiting to fire would land after the will is
    // generated and quietly turn it back into a draft
    if (saveTimer.current) clearTimeout(saveTimer.current);
    pending.current = null;
    try {
      const res = await fetch(`/api/wills/${willId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ data, status: "complete" }),
      });
      if (res.ok) {
        pending.current = null;
        router.push(`/will/${willId}/document`);
        return;
      }
      const body = await res.json().catch(() => ({}));
      setStepError(body.error ?? "Something went wrong saving your will. Please try again.");
    } catch {
      setStepError("Something went wrong saving your will. Please try again.");
    }
    setGenerating(false);
  };

  // ------------------------------------------------------------- rendering --
  const group = GROUPS.find((g) => g.id === NAV[step.id].group)!;
  const nextStep = steps[stepIndex + 1];
  const sharesOnPhone = SHARES_ON_PHONE.includes(step.id) && !!result && !result.noHeirs;
  // A new will starts as "married", so the engine would show a wife taking
  // everything before the person has said a word. The picture waits until
  // they have been past the marriage step, or have told us of any relative.
  const fam = data.census;
  const sharesStarted =
    furthest > steps.findIndex((s) => s.id === "marriage") ||
    fam.sons + fam.daughters + fam.grandsons + fam.granddaughters > 0 ||
    fam.fullBrothers + fam.fullSisters + fam.paternalBrothers + fam.paternalSisters + fam.maternalSiblings > 0 ||
    fam.father || fam.mother || fam.paternalGrandfather || fam.paternalGrandmother || fam.maternalGrandmother ||
    fam.hasOtherAgnates || fam.hasDistantKindred;

  const saveStatus = (
    <span
      aria-live="polite"
      data-save-state={saveState}
      className={`items-center gap-2 text-ink-soft ${
        isReview && saveState !== "saving" && saveState !== "error" ? "hidden" : "hidden lg:flex"
      }`}
    >
      {saveState === "saving" && "Saving…"}
      {saveState === "error" && (
        <span className="font-semibold text-clay">Not saved. Check your connection.</span>
      )}
      {(saveState === "idle" || saveState === "saved") && (
        <>
          <Tick />
          All answers saved
        </>
      )}
    </span>
  );

  const header = (
    <>
      <AppHeader
        compactLogo
        width={isReview ? "max-w-[1240px]" : "max-w-[1360px]"}
        below={
          <div className="px-[clamp(20px,4vw,48px)] pb-2.5 lg:hidden">
            <div
              role="progressbar"
              aria-label="Interview progress"
              aria-valuemin={0}
              aria-valuemax={steps.length}
              aria-valuenow={stepIndex + 1}
              className="h-1.5 rounded-[3px] bg-line"
            >
              <div
                className="h-1.5 rounded-[3px] bg-emerald transition-[width] duration-300"
                style={{ width: `${((stepIndex + 1) / steps.length) * 100}%` }}
              />
            </div>
          </div>
        }
      >
        <span
          className={`text-[15px] font-semibold text-ink-soft md:text-[16px] md:font-normal ${
            isReview ? "" : "lg:hidden"
          }`}
        >
          {isReview ? (
            <>
              Step {stepIndex + 1} of {steps.length}
              <span className="hidden md:inline"> &middot; Review and generate</span>
            </>
          ) : (
            <>
              {group.title} &middot; {stepIndex + 1} of {steps.length}
            </>
          )}
        </span>
        <div className="flex items-center gap-x-6 text-[16px]">
          {saveStatus}
          <Link
            href="/dashboard"
            className="btn-ghost !hidden !px-[18px] !py-[11px] md:!inline-flex"
          >
            Save and finish later
          </Link>
          <Link href="/dashboard" className="px-1 py-3 text-[15px] font-bold no-underline md:hidden">
            Save &amp; exit
          </Link>
        </div>
      </AppHeader>
      {saveState === "error" && (
        <p
          role="status"
          className="bg-clay px-5 py-2 text-center text-[15px] font-semibold text-white lg:hidden"
        >
          Not saved. Check your connection.
        </p>
      )}
    </>
  );

  if (isReview) {
    return (
      <>
        {header}
        <main className="mx-auto w-full max-w-[1240px] px-[clamp(20px,4vw,48px)] pt-6 pb-20 md:pt-12 md:pb-24">
          <h1 className="h-page">Check your answers</h1>
          <p className="mt-3 mb-8 max-w-[640px] text-ink-soft md:mb-10">
            This is exactly what goes into your will. Change anything now; you can
            also change it later and print a new one.
          </p>
          <div className="flex flex-wrap items-start gap-x-10 gap-y-8">
            <div className="flex min-w-0 flex-[999_1_520px] flex-col gap-5">{renderReview()}</div>
            <aside
              aria-label="Your shares, and generating your will"
              className="flex min-w-0 flex-[1_1_380px] flex-col gap-5"
            >
              <ReviewShares result={result} data={data} />
              {renderGenerate()}
              {stepError && (
                <p ref={errorRef} className="note-error" role="alert">
                  {stepError}
                </p>
              )}
              <button type="button" onClick={goBack} className="btn-ghost self-start">
                Back
              </button>
            </aside>
          </div>
        </main>
      </>
    );
  }

  return (
    <>
      {header}
      <div
        className={`mx-auto flex w-full max-w-[1360px] flex-wrap items-start gap-x-12 gap-y-8 px-[clamp(20px,4vw,48px)] pt-5 md:pt-10 md:pb-20 ${
          sharesOnPhone ? "pb-[250px]" : "pb-[130px]"
        }`}
      >
        <nav
          aria-label="Interview sections"
          className="hidden min-w-[200px] flex-[0_1_230px] text-[16px] lg:block"
        >
          {GROUPS.map((g) => {
            const items = steps
              .map((s, i) => ({ s, i }))
              .filter(({ s }) => NAV[s.id].group === g.id);
            if (items.length === 0) return null;
            return (
              <div key={g.id} className="mb-6 last:mb-0">
                <p className="mb-2 text-[14px] font-bold tracking-[0.08em] text-ink-soft uppercase">
                  {g.title}
                </p>
                <ol className="flex flex-col">
                  {items.map(({ s, i }) => (
                    <li key={s.id}>{renderNavItem(s, i)}</li>
                  ))}
                </ol>
              </div>
            );
          })}
        </nav>

        <main className="min-w-0 flex-[999_1_440px] md:rounded-3xl md:border md:border-line md:bg-white md:p-[clamp(24px,3.4vw,48px)]">
          <h1 className="text-[28px] leading-[1.1] font-extrabold tracking-[-0.03em] md:text-[clamp(30px,3vw,40px)] md:leading-[1.08]">
            {step.title}
          </h1>
          {step.intro && (
            <div className="mt-3.5 flex gap-3.5 rounded-xl bg-indigo-tint px-3.5 py-3 text-[15px] leading-[1.45] text-indigo-ink md:mt-5 md:rounded-[14px] md:px-5 md:py-4 md:text-[17px] md:leading-[1.6]">
              <svg
                aria-hidden="true"
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#23408F"
                strokeWidth="2.2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="mt-[3px] hidden flex-none md:block"
              >
                <circle cx="12" cy="12" r="9" />
                <path d="M12 11v6M12 7.5v.5" />
              </svg>
              <p>
                <strong>Why we ask.</strong> {step.intro}
              </p>
            </div>
          )}

          <div className="mt-5 flex flex-col gap-7 md:mt-8">
            {data.hasNonMuslimRelatives && FAMILY_STEPS.includes(step.id) && <MuslimOnlyNote />}
            {renderStep()}
          </div>

          {stepError && (
            <p ref={errorRef} className="note-error mt-7" role="alert">
              {stepError}
            </p>
          )}

          <div className="mt-10 hidden flex-wrap justify-between gap-3 border-t border-line pt-7 md:flex">
            {stepIndex > 0 && (
              <button type="button" onClick={goBack} className="btn-ghost !rounded-[14px] !px-6 !py-4 !text-[18px]">
                Back
              </button>
            )}
            <button type="button" onClick={goNext} className="btn-primary btn-lg ml-auto !px-8 !py-4">
              Continue{nextStep ? ` to ${lowerFirst(NAV[nextStep.id].label)}` : ""}
            </button>
          </div>
        </main>

        <aside
          aria-label="Your shares so far"
          className="hidden min-w-0 flex-[1_1_340px] md:block xl:sticky xl:top-6 xl:max-h-[calc(100vh-48px)] xl:overflow-y-auto"
        >
          <SharesPanel
            result={sharesStarted ? result : null}
            data={data}
            familyAnswered={NAV[step.id].group !== "family"}
          />
        </aside>
      </div>

      {/* on a phone the shares and the way forward stay in view */}
      <div className="fixed inset-x-0 bottom-0 z-30 flex flex-col gap-3 rounded-t-[20px] border-t border-line bg-white px-5 pt-3.5 pb-[max(20px,env(safe-area-inset-bottom))] shadow-[0_-12px_30px_-20px_rgba(15,31,26,0.4)] md:hidden">
        {sharesOnPhone && (
          <SharesSummary
            result={result}
            data={data}
            open={sheetOpen}
            onToggle={() => setSheetOpen((o) => !o)}
            panelId={sheetId}
          />
        )}
        <div className="flex gap-2.5">
          {stepIndex > 0 && (
            <button
              type="button"
              onClick={goBack}
              className="flex h-14 flex-none items-center justify-center rounded-[14px] border-[1.5px] border-field px-5 font-bold"
            >
              Back
            </button>
          )}
          <button
            type="button"
            onClick={goNext}
            className="flex h-14 flex-1 items-center justify-center rounded-[14px] bg-emerald text-[18px] font-bold text-white"
          >
            Continue
          </button>
        </div>
      </div>
    </>
  );

  function renderNavItem(s: StepDef, i: number) {
    const current = i === stepIndex;
    // A step can be opened from the list once nothing required is missing
    // before it. It is ticked once it has been passed in this sitting.
    const blockedAt = steps.findIndex((x) => validate(x.id, data, isPremium) !== null);
    const reached = i <= furthest || blockedAt === -1 || i <= blockedAt;
    const done = i <= furthest && !current && validate(s.id, data, isPremium) === null;
    const inner = (
      <>
        {done ? (
          <Tick />
        ) : (
          <span aria-hidden="true" className="w-[18px] flex-none text-center">
            {i + 1}
          </span>
        )}
        <span className="min-w-0">{NAV[s.id].label}</span>
        {s.premium && !isPremium && (
          <span className="self-center rounded-full bg-saffron-tint px-2 py-0.5 text-[13px] leading-normal font-bold text-saffron-ink">
            Pack
          </span>
        )}
      </>
    );
    if (current)
      return (
        <span
          aria-current="step"
          className="flex items-center gap-2.5 rounded-[10px] bg-ink px-3 py-2.5 font-bold text-white"
        >
          {inner}
        </span>
      );
    if (reached)
      return (
        <button
          type="button"
          onClick={() => goTo(i)}
          className="flex w-full items-center gap-2.5 rounded-[10px] px-3 py-2.5 text-left text-ink hover:bg-white"
        >
          {inner}
        </button>
      );
    return <span className="flex items-center gap-2.5 px-3 py-2.5 text-ink-soft">{inner}</span>;
  }

  function renderStep() {
    switch (step.id) {
      case "about":
        return (
          <>
            <TextField
              label="Full legal name"
              value={data.fullName}
              onChange={(v) => set({ fullName: v })}
              placeholder="As it appears on your passport"
            />
            <TextField
              label="Home address"
              value={data.address}
              onChange={(v) => set({ address: v })}
              placeholder="Street, town, postcode"
            />
            <TextField
              label="Date of birth"
              type="date"
              value={data.dateOfBirth}
              onChange={(v) => set({ dateOfBirth: v })}
            />
            <ChoiceField
              label="Are you male or female?"
              hint="The Qur'anic shares differ, so the will needs to know."
              value={data.sex}
              onChange={(v) => {
                set({ sex: v });
                setCensus({
                  testatorSex: v,
                  spouseCount:
                    data.maritalStatus === "married"
                      ? v === "female"
                        ? 1
                        : Math.max(1, Math.min(data.census.spouseCount || 1, 4))
                      : 0,
                });
              }}
              options={[
                { value: "male", label: "Male" },
                { value: "female", label: "Female" },
              ]}
            />
            <YesNo
              label="Are any of your close relatives not Muslim?"
              hint="Your husband or wife, children, parents, brothers or sisters."
              value={data.hasNonMuslimRelatives}
              onChange={(v) => {
                set({ hasNonMuslimRelatives: v });
                // without the follow-up questions a married person has at least one inheriting spouse
                if (!v && data.maritalStatus === "married" && data.census.spouseCount === 0)
                  setCensus({ spouseCount: 1 });
              }}
            />
            {data.hasNonMuslimRelatives && (
              <p className="note-info max-w-[640px]">
                The four Sunni schools agree that a relative who is not Muslim
                does not take a fixed share of a Muslim&rsquo;s estate. In the
                family questions that follow, count only your Muslim relatives.
                You can still provide for the others through a bequest
                (wasiyya) of up to one-third of your estate.
              </p>
            )}
          </>
        );

      case "marriage":
        return (
          <>
            <ChoiceField
              label="What is your marital status?"
              value={data.maritalStatus}
              onChange={(v) => {
                set({ maritalStatus: v, spouseName: v === "married" ? data.spouseName : "" });
                setCensus({
                  spouseCount: v === "married" ? (data.sex === "male" ? Math.max(1, data.census.spouseCount) : 1) : 0,
                });
              }}
              options={[
                { value: "married", label: "Married" },
                { value: "single", label: "Single" },
                { value: "divorced", label: "Divorced" },
                { value: "widowed", label: "Widowed" },
              ]}
            />
            {data.maritalStatus === "married" && (
              <>
                {data.sex === "male" && (
                  <CountField
                    label={data.hasNonMuslimRelatives ? "Wives who are Muslim" : "Number of wives"}
                    hint={
                      data.hasNonMuslimRelatives
                        ? "Only a Muslim wife takes the wife's share"
                        : "An Islamic marriage may include up to four"
                    }
                    value={data.census.spouseCount}
                    max={4}
                    onChange={(v) => setCensus({ spouseCount: Math.max(data.hasNonMuslimRelatives ? 0 : 1, v) })}
                  />
                )}
                {data.sex === "female" && data.hasNonMuslimRelatives && (
                  <YesNo
                    label="Is your husband Muslim?"
                    value={data.census.spouseCount === 1}
                    onChange={(v) => setCensus({ spouseCount: v ? 1 : 0 })}
                  />
                )}
                {data.census.spouseCount > 0 ? (
                  <TextField
                    label={data.sex === "male" ? (data.census.spouseCount > 1 ? "Wives' full names" : "Wife's full name") : "Husband's full name"}
                    value={data.spouseName}
                    onChange={(v) => set({ spouseName: v })}
                    placeholder={data.census.spouseCount > 1 ? "Separate names with commas" : "Full legal name"}
                  />
                ) : (
                  <p className="note-warn max-w-[640px]">
                    Your {data.sex === "male" ? "wife" : "husband"} will not take
                    a fixed share. You can provide for{" "}
                    {data.sex === "male" ? "her" : "him"}{" "}with a bequest of up
                    to one-third in the bequests step. Because English law lets
                    a spouse claim reasonable provision, a solicitor&rsquo;s
                    advice is strongly recommended.
                  </p>
                )}
              </>
            )}
          </>
        );

      case "children":
        return (
          <>
            <div className={COUNT_GRID}>
              <CountField
                label="Sons living"
                value={data.census.sons}
                onChange={(v) => {
                  setCensus({ sons: v });
                  set({ sonNames: data.sonNames.slice(0, v) });
                }}
              />
              <CountField
                label="Daughters living"
                value={data.census.daughters}
                onChange={(v) => {
                  setCensus({ daughters: v });
                  set({ daughterNames: data.daughterNames.slice(0, v) });
                }}
              />
            </div>
            <NameList
              label="Sons' names"
              names={data.sonNames}
              count={data.census.sons}
              onChange={(v) => set({ sonNames: v })}
            />
            <NameList
              label="Daughters' names"
              names={data.daughterNames}
              count={data.census.daughters}
              onChange={(v) => set({ daughterNames: v })}
            />
            {data.census.sons + data.census.daughters > 0 && (
              <YesNo
                label="Are any of your children under 18?"
                hint="If so, your will should appoint guardians."
                value={data.hasMinorChildren}
                onChange={(v) => set({ hasMinorChildren: v })}
              />
            )}
          </>
        );

      case "grandchildren":
        return (
          <>
            <YesNo
              label="Did a son of yours pass away leaving children of his own?"
              value={grandchildrenOpen}
              onChange={(v) => {
                setGrandchildrenOpen(v);
                if (!v) setCensus({ grandsons: 0, granddaughters: 0 });
              }}
            />
            {grandchildrenOpen && (
              <>
                <div className={COUNT_GRID}>
                  <CountField
                    label="His sons (your grandsons)"
                    value={data.census.grandsons}
                    onChange={(v) => setCensus({ grandsons: v })}
                  />
                  <CountField
                    label="His daughters (your granddaughters)"
                    value={data.census.granddaughters}
                    onChange={(v) => setCensus({ granddaughters: v })}
                  />
                </div>
                <NameList label="Grandsons' names" names={namesOf("grandsons")} count={data.census.grandsons} onChange={(v) => setNames("grandsons", v)} />
                <NameList label="Granddaughters' names" names={namesOf("granddaughters")} count={data.census.granddaughters} onChange={(v) => setNames("granddaughters", v)} />
              </>
            )}
          </>
        );

      case "parents":
        return (
          <>
            <YesNo
              label="Is your father living?"
              value={data.census.father}
              onChange={(v) => setCensus({ father: v, paternalGrandfather: v ? false : data.census.paternalGrandfather })}
            />
            {data.census.father && (
              <TextField label="Father's full name" value={data.fatherName} onChange={(v) => set({ fatherName: v })} />
            )}
            <YesNo
              label="Is your mother living?"
              value={data.census.mother}
              onChange={(v) => setCensus({ mother: v })}
            />
            {data.census.mother && (
              <TextField label="Mother's full name" value={data.motherName} onChange={(v) => set({ motherName: v })} />
            )}
          </>
        );

      case "grandparents":
        return (
          <>
            {q.paternalGrandfather && (
              <YesNo
                label="Is your father's father living?"
                value={data.census.paternalGrandfather}
                onChange={(v) => setCensus({ paternalGrandfather: v })}
              />
            )}
            {q.paternalGrandfather && data.census.paternalGrandfather && (
              <NameList label="His full name" names={namesOf("paternalGrandfather")} count={1} onChange={(v) => setNames("paternalGrandfather", v)} />
            )}
            {q.maternalGrandmother && (
              <YesNo
                label="Is your mother's mother living?"
                value={data.census.maternalGrandmother}
                onChange={(v) => setCensus({ maternalGrandmother: v })}
              />
            )}
            {q.maternalGrandmother && data.census.maternalGrandmother && (
              <NameList label="Her full name" names={namesOf("maternalGrandmother")} count={1} onChange={(v) => setNames("maternalGrandmother", v)} />
            )}
            {q.paternalGrandmother && (
              <YesNo
                label="Is your father's mother living?"
                value={data.census.paternalGrandmother}
                onChange={(v) => setCensus({ paternalGrandmother: v })}
              />
            )}
            {q.paternalGrandmother && data.census.paternalGrandmother && (
              <NameList label="Her full name" names={namesOf("paternalGrandmother")} count={1} onChange={(v) => setNames("paternalGrandmother", v)} />
            )}
          </>
        );

      case "siblings":
        return (
          <>
            <div className={COUNT_GRID}>
              <CountField
                label="Full brothers"
                hint="Same father and mother as you"
                value={data.census.fullBrothers}
                onChange={(v) => setCensus({ fullBrothers: v })}
              />
              <CountField
                label="Full sisters"
                hint="Same father and mother as you"
                value={data.census.fullSisters}
                onChange={(v) => setCensus({ fullSisters: v })}
              />
              <CountField
                label="Half-brothers through your father"
                hint="Same father, different mother"
                value={data.census.paternalBrothers}
                onChange={(v) => setCensus({ paternalBrothers: v })}
              />
              <CountField
                label="Half-sisters through your father"
                hint="Same father, different mother"
                value={data.census.paternalSisters}
                onChange={(v) => setCensus({ paternalSisters: v })}
              />
              {q.maternalSiblings && (
                <CountField
                  label="Half-brothers and half-sisters through your mother"
                  hint="Same mother, different father. They share equally"
                  value={data.census.maternalSiblings}
                  onChange={(v) => setCensus({ maternalSiblings: v })}
                />
              )}
            </div>
            <p className="text-[16px] text-ink-soft">Count only those who are living.</p>
            {q.siblingsInherit && (
              <>
                <NameList label="Full brothers' names" names={namesOf("fullBrothers")} count={census.fullBrothers} onChange={(v) => setNames("fullBrothers", v)} />
                <NameList label="Full sisters' names" names={namesOf("fullSisters")} count={census.fullSisters} onChange={(v) => setNames("fullSisters", v)} />
                <NameList label="Paternal half-brothers' names" names={namesOf("paternalBrothers")} count={census.paternalBrothers} onChange={(v) => setNames("paternalBrothers", v)} />
                <NameList label="Paternal half-sisters' names" names={namesOf("paternalSisters")} count={census.paternalSisters} onChange={(v) => setNames("paternalSisters", v)} />
                <NameList label="Maternal half-siblings' names" names={namesOf("maternalSiblings")} count={census.maternalSiblings} onChange={(v) => setNames("maternalSiblings", v)} />
              </>
            )}
          </>
        );

      case "agnates":
        return (
          <>
            {q.agnates && (
              <YesNo
                label="Do you have any of these living relatives: a brother's son, a paternal uncle, or a paternal uncle's son?"
                hint="They can inherit any remainder when closer heirs are absent."
                value={data.census.hasOtherAgnates}
                onChange={(v) => {
                  setCensus({ hasOtherAgnates: v });
                  if (!v) set({ agnateKind: "", agnateNames: "" });
                }}
              />
            )}
            {q.agnates && census.hasOtherAgnates && (
              <>
                <ChoiceField<AgnateKind | "">
                  label="Which is the closest you have?"
                  hint="Choose the first in this list that applies. Only the nearest inherits."
                  value={data.agnateKind}
                  onChange={(v) => set({ agnateKind: v })}
                  options={AGNATE_KINDS.map((k) => ({ value: k.value, label: k.label }))}
                />
                <TextField
                  label="Their full name(s)"
                  hint="So your will can name them. Separate names with commas."
                  value={data.agnateNames}
                  onChange={(v) => set({ agnateNames: v })}
                />
              </>
            )}
            {q.distantKindred && (
              <YesNo
                label="Do you have any other living blood relatives?"
                hint="For example a daughter's children, a sister's children, aunts, or your mother's brothers."
                value={data.census.hasDistantKindred}
                onChange={(v) => {
                  setCensus({ hasDistantKindred: v });
                  if (!v) set({ distantKindredNames: "" });
                }}
              />
            )}
            {q.distantKindred && census.hasDistantKindred && (
              <>
                <TextField
                  label="Who are they?"
                  hint="Names, and how each is related to you."
                  value={data.distantKindredNames}
                  onChange={(v) => set({ distantKindredNames: v })}
                  placeholder="e.g. Aisha Khan (my daughter's daughter)"
                />
                <p className="note-warn max-w-[640px]">
                  In the Hanafi school these relatives (dhawu al-arham) inherit
                  when no closer heir survives. The rules for dividing the
                  estate between them are intricate and this service does not
                  calculate them: your will leaves that remainder to them as a
                  scholar determines. Please ask a scholar and a solicitor to
                  review your will before you sign it.
                </p>
              </>
            )}
          </>
        );

      case "executors":
        return (
          <>
            <p className="max-w-[640px] text-ink-soft">
              Your executors (awsiya&rsquo;) gather your estate, pay your debts,
              including religious ones, and distribute the shares. Choose
              people you trust; two is usual, and you can add a reserve.
            </p>
            <PersonListEditor
              people={data.executors}
              onChange={(p) => set({ executors: p })}
              max={3}
              addLabel={data.executors.length === 0 ? "Add an executor" : "Add another executor"}
            />
          </>
        );

      case "guardians":
        return (
          <>
            <p className="max-w-[640px] text-ink-soft">
              Guardians take parental responsibility for your children under 18
              if no one with parental responsibility survives you. Most people
              choose practising family members who share your values.
            </p>
            <PersonListEditor
              people={data.guardians}
              onChange={(p) => set({ guardians: p })}
              max={2}
              addLabel={data.guardians.length === 0 ? "Add a guardian" : "Add a second guardian"}
            />
          </>
        );

      case "funeral":
        return (
          <>
            <YesNo
              label="Include Islamic funeral and burial directions?"
              hint="Ghusl, kafan, janazah prayer, and burial without cremation, as soon as possible."
              value={data.islamicBurial}
              onChange={(v) => set({ islamicBurial: v })}
            />
            <TextField
              label="Charity of last resort"
              hint="Receives your estate only if no family member survives you."
              value={data.fallbackCharity}
              onChange={(v) => set({ fallbackCharity: v })}
              placeholder="e.g. Islamic Relief UK, National Zakat Foundation"
            />
          </>
        );

      case "bequests":
        if (!isPremium) return <PremiumLock feature="Charitable bequests let you leave up to one-third of your estate to charities, your masjid, or loved ones who are not fixed-share heirs, including non-Muslim relatives, adopted children and grandchildren through daughters." />;
        return <BequestsEditor bequests={data.bequests} onChange={(b) => set({ bequests: b })} total={percentBequestTotal} />;

      case "debts":
        if (!isPremium) return <PremiumLock feature="The religious-debts schedule instructs your executors to settle unpaid zakat, fidya for missed fasts and kaffarah, and to arrange Hajj on your behalf. Debts to Allah are paid before the estate is shared." />;
        return (
          <>
            <YesNo label="Do you have unpaid zakat?" value={data.religiousDebts.unpaidZakat} onChange={(v) => set({ religiousDebts: { ...data.religiousDebts, unpaidZakat: v } })} />
            <YesNo label="Do you have missed fasts to compensate (fidya)?" value={data.religiousDebts.missedFastsFidya} onChange={(v) => set({ religiousDebts: { ...data.religiousDebts, missedFastsFidya: v } })} />
            <YesNo label="Is Hajj still obligatory on you (not yet performed)?" value={data.religiousDebts.hajjNotPerformed} onChange={(v) => set({ religiousDebts: { ...data.religiousDebts, hajjNotPerformed: v } })} />
            <YesNo label="Any outstanding kaffarah (expiation)?" value={data.religiousDebts.kaffarah} onChange={(v) => set({ religiousDebts: { ...data.religiousDebts, kaffarah: v } })} />
            <TextField
              label="Notes for your executors"
              hint="Optional: amounts, calculations, who to consult."
              value={data.religiousDebts.notes}
              onChange={(v) => set({ religiousDebts: { ...data.religiousDebts, notes: v } })}
            />
          </>
        );

      case "wishes":
        if (!isPremium) return <PremiumLock feature="A letter of wishes travels with your will: guidance to your executors and family on raising your children in the deen, your funeral preferences, forgiveness you seek, and anything in your heart." />;
        return (
          <div>
            <label htmlFor="letter-of-wishes" className="label">
              Your letter of wishes
            </label>
            <textarea
              id="letter-of-wishes"
              className="input min-h-48"
              aria-describedby="letter-of-wishes-hint"
              value={data.letterOfWishes}
              onChange={(e) => set({ letterOfWishes: e.target.value })}
              placeholder="Assalamu alaykum to my family…"
            />
            <p id="letter-of-wishes-hint" className="hint mt-2">
              Not legally binding, but deeply valued.
            </p>
          </div>
        );

      case "estate":
        return (
          <>
            <ChoiceField
              label="Do you own your home?"
              value={data.complexity.homeOwnership}
              onChange={(v) => set({ complexity: { ...data.complexity, homeOwnership: v } })}
              options={[
                { value: "none", label: "No" },
                { value: "sole", label: "Yes — in my name only" },
                { value: "joint", label: "Yes — as joint tenants" },
                { value: "tenants-in-common", label: "Yes — as tenants in common" },
                { value: "unsure", label: "Yes — jointly, not sure how" },
              ]}
            />
            <YesNo label="Do you own a business or business assets?" value={data.complexity.businessAssets} onChange={(v) => set({ complexity: { ...data.complexity, businessAssets: v } })} />
            <YesNo label="Do you have property or assets outside the UK?" value={data.complexity.foreignAssets} onChange={(v) => set({ complexity: { ...data.complexity, foreignAssets: v } })} />
            <YesNo label="Have you been married before, or do you have stepchildren?" value={data.complexity.previousMarriage} onChange={(v) => set({ complexity: { ...data.complexity, previousMarriage: v } })} />
            <YesNo label="Do you think anyone may challenge your will?" value={data.complexity.expectsDispute} onChange={(v) => set({ complexity: { ...data.complexity, expectsDispute: v } })} />
          </>
        );

      case "review":
        return null; // drawn by renderReview: the review has its own page layout
    }
  }

  // ------------------------------------------------------------ the review --

  /** What each step contributed, as label and value pairs. */
  function answersFor(id: StepId): Answer[] {
    const c = census;
    const nonEmpty = (list: (string | undefined)[] | undefined) =>
      (list ?? []).map((n) => (n ?? "").trim()).filter(Boolean);
    const namesOrCount = (names: string[], count: number) => {
      const given = nonEmpty(names);
      if (given.length === count) return given.join(", ");
      return given.length > 0 ? `${count} (${given.join(", ")} named)` : String(count);
    };
    const people = (list: { name: string; relationship?: string }[]) =>
      list
        .filter((p) => p.name.trim())
        .map((p) => (p.relationship?.trim() ? `${p.name.trim()}, your ${p.relationship.trim()}` : p.name.trim()));
    const listed = (items: string[], none: string) =>
      items.length === 0 ? none : items.length === 1 ? items[0] : (
        <ul className="flex flex-col gap-0.5">
          {items.map((x) => (
            <li key={x}>{x}</li>
          ))}
        </ul>
      );

    switch (id) {
      case "about":
        return [
          { label: "Full legal name", value: data.fullName.trim() || "Not given" },
          { label: "Date of birth", value: longDate(data.dateOfBirth) ?? "Not given" },
          { label: "Address", value: data.address.trim() || "Not given", wide: true },
        ];
      case "marriage": {
        if (data.maritalStatus !== "married")
          return [{ label: "Marital status", value: data.maritalStatus.charAt(0).toUpperCase() + data.maritalStatus.slice(1) }];
        const spouse = data.sex === "male" ? "wife" : "husband";
        if (c.spouseCount === 0)
          return [{ label: "Marital status", value: `Married. Your ${spouse} takes no fixed share` }];
        return [
          {
            label: data.sex === "male" ? (c.spouseCount > 1 ? "Wives" : "Wife") : "Husband",
            value: data.spouseName.trim() || "Name not given",
          },
        ];
      }
      case "children": {
        if (c.sons + c.daughters === 0) return [{ label: "Children", value: "None" }];
        const out: Answer[] = [];
        if (c.sons > 0) out.push({ label: c.sons > 1 ? "Sons" : "Son", value: namesOrCount(data.sonNames, c.sons) });
        if (c.daughters > 0) out.push({ label: c.daughters > 1 ? "Daughters" : "Daughter", value: namesOrCount(data.daughterNames, c.daughters) });
        if (data.hasMinorChildren) out.push({ label: "Children under 18", value: "Yes" });
        return out;
      }
      case "grandchildren": {
        if (c.grandsons + c.granddaughters === 0) return [{ label: "Grandchildren through a son", value: "None" }];
        const out: Answer[] = [];
        if (c.grandsons > 0) out.push({ label: "Grandsons through a son", value: namesOrCount(namesOf("grandsons"), c.grandsons) });
        if (c.granddaughters > 0) out.push({ label: "Granddaughters through a son", value: namesOrCount(namesOf("granddaughters"), c.granddaughters) });
        return out;
      }
      case "parents": {
        const living = [
          c.father && (data.fatherName.trim() ? `Father, ${data.fatherName.trim()}` : "Father"),
          c.mother && (data.motherName.trim() ? `Mother, ${data.motherName.trim()}` : "Mother"),
        ].filter(Boolean) as string[];
        return [{ label: "Parents living", value: listed(living, "Neither") }];
      }
      case "grandparents": {
        const one = (on: boolean, who: string, group: NamedGroup) => {
          const name = nonEmpty(namesOf(group))[0];
          return on && (name ? `${who}, ${name}` : who);
        };
        const living = [
          q.paternalGrandfather && one(c.paternalGrandfather, "Father's father", "paternalGrandfather"),
          q.maternalGrandmother && one(c.maternalGrandmother, "Mother's mother", "maternalGrandmother"),
          q.paternalGrandmother && one(c.paternalGrandmother, "Father's mother", "paternalGrandmother"),
        ].filter(Boolean) as string[];
        return [{ label: "Grandparents living", value: listed(living, "None") }];
      }
      case "siblings": {
        const n = (count: number, one: string, many: string) => (count > 0 ? `${count} ${count === 1 ? one : many}` : null);
        const all = [
          n(c.fullBrothers, "full brother", "full brothers"),
          n(c.fullSisters, "full sister", "full sisters"),
          n(c.paternalBrothers, "half-brother through your father", "half-brothers through your father"),
          n(c.paternalSisters, "half-sister through your father", "half-sisters through your father"),
          n(c.maternalSiblings, "half-sibling through your mother", "half-siblings through your mother"),
        ].filter(Boolean) as string[];
        return [{ label: "Brothers and sisters", value: listed(all, "None") }];
      }
      case "agnates": {
        const out: Answer[] = [];
        if (q.agnates)
          out.push({
            label: "Male-line relatives",
            value: c.hasOtherAgnates
              ? [AGNATE_KINDS.find((k) => k.value === data.agnateKind)?.label, data.agnateNames.trim()]
                  .filter(Boolean)
                  .join(": ") || "Yes"
              : "None",
          });
        if (q.distantKindred)
          out.push({
            label: "Other blood relatives",
            value: c.hasDistantKindred ? data.distantKindredNames.trim() || "Yes" : "None",
          });
        return out;
      }
      case "executors": {
        const named = people(data.executors);
        return [{ label: named.length > 1 ? "Executors" : "Executor", value: listed(named, "None named yet") }];
      }
      case "guardians": {
        const named = people(data.guardians);
        return [{ label: named.length > 1 ? "Guardians for your children" : "Guardian for your children", value: listed(named, "None named yet") }];
      }
      case "funeral":
        return [
          { label: "Islamic funeral and burial", value: data.islamicBurial ? "Included" : "Not included" },
          { label: "If no heir survives you", value: data.fallbackCharity.trim() || "No charity chosen" },
        ];
      case "bequests": {
        const made = data.bequests.filter((b) => b.beneficiary.trim());
        return [
          {
            label: "Bequests",
            value: made.length === 0 ? "None" : `${made.length}, to ${made.map((b) => b.beneficiary.trim()).join(", ")}${percentBequestTotal > 0 ? ` (${percentBequestTotal.toFixed(1)}% of your estate)` : ""}`,
          },
        ];
      }
      case "debts": {
        const r = data.religiousDebts;
        const owed = [r.unpaidZakat && "Unpaid zakat", r.missedFastsFidya && "Fidya for missed fasts", r.hajjNotPerformed && "Hajj", r.kaffarah && "Kaffarah"].filter(Boolean) as string[];
        return [{ label: "Religious debts", value: listed(owed, "None recorded") }];
      }
      case "wishes":
        return [{ label: "Letter of wishes", value: data.letterOfWishes.trim() ? "Written" : "Not written" }];
      case "estate": {
        const home = {
          "": "Not answered",
          none: "You do not own it",
          sole: "Owned in your name only",
          joint: "Owned as joint tenants",
          "tenants-in-common": "Owned as tenants in common",
          unsure: "Owned jointly, not sure how",
        }[data.complexity.homeOwnership];
        const x = data.complexity;
        const also = [x.businessAssets && "A business", x.foreignAssets && "Assets outside the UK", x.previousMarriage && "An earlier marriage or stepchildren", x.expectsDispute && "A possible challenge to the will"].filter(Boolean) as string[];
        return [
          { label: "Your home", value: home },
          ...(also.length > 0 ? [{ label: "Also in your estate or family", value: listed(also, "") }] : []),
        ];
      }
      default:
        return [];
    }
  }

  function renderReview() {
    const flags = solicitorFlags(data);
    const rowsFor = (ids: StepId[]) =>
      steps
        .map((s, i) => ({ s, i }))
        .filter(({ s }) => ids.includes(s.id) && (!s.premium || isPremium))
        .map(({ s, i }) => ({ s, i, answers: answersFor(s.id) }))
        .filter((r) => r.answers.length > 0);

    const skipped = (
      [
        ["grandchildren", "grandchildren through a son"],
        ["grandparents", "your grandparents"],
        ["siblings", "your brothers and sisters"],
        ["agnates", "your wider family"],
      ] as [StepId, string][]
    )
      .filter(([id]) => !steps.some((s) => s.id === id))
      .map(([, name]) => name);

    const named = data.executors.filter((e) => e.name.trim());

    const card = (title: string, ids: StepId[], note?: React.ReactNode) => {
      const rows = rowsFor(ids);
      if (rows.length === 0 && !note) return null;
      return (
        <section className="rounded-[20px] border border-line bg-white px-[clamp(20px,2.6vw,32px)] py-7">
          <h2 className="h-card">{title}</h2>
          <div className="mt-3 flex flex-col gap-3.5">
            {rows.map(({ s, i, answers }) => (
              <div
                key={s.id}
                className="flex items-start justify-between gap-4 border-t border-line pt-3.5 first:border-t-0 first:pt-0"
              >
                <dl className="grid min-w-0 flex-1 grid-cols-[repeat(auto-fit,minmax(min(220px,100%),1fr))] gap-x-8 gap-y-3.5">
                  {answers.map((a) => (
                    <div key={a.label} className={a.wide ? "col-span-full" : ""}>
                      <dt className="text-[15px] text-ink-soft">{a.label}</dt>
                      <dd className="font-semibold break-words">{a.value}</dd>
                    </div>
                  ))}
                </dl>
                <button
                  type="button"
                  aria-label={`Edit ${s.title}`}
                  onClick={() => goTo(i)}
                  className="-my-2 min-h-11 flex-none px-1 font-bold text-emerald underline underline-offset-[0.18em] hover:text-emerald-dark"
                >
                  Edit
                </button>
              </div>
            ))}
          </div>
          {note}
        </section>
      );
    };

    return (
      <>
        {card("About you", ["about"])}
        {card(
          "Your family",
          ["marriage", "children", "grandchildren", "parents", "grandparents", "siblings", "agnates"],
          skipped.length > 0 && (
            <p className="mt-4 border-t border-line pt-3.5 text-[16px] text-ink-soft">
              Not asked, because closer relatives come before them:{" "}
              {skipped.join(", ").replace(/, ([^,]*)$/, " and $1")}.
            </p>
          )
        )}
        {card(
          "The people you trust",
          ["executors", "guardians"],
          named.length === 1 && (
            <p className="mt-4 rounded-xl bg-indigo-tint px-4 py-3 text-[16px] text-indigo-ink">
              You have named one executor. A second, as a reserve, is worth
              adding in case {named[0].name.trim().split(/\s+/)[0]} cannot act.
            </p>
          )
        )}
        {card(
          "Your wishes and your estate",
          ["funeral", "bequests", "debts", "wishes", "estate"],
          !isPremium && (
            <p className="mt-4 border-t border-line pt-3.5 text-[16px] text-ink-soft">
              Bequests, the religious-debts schedule and a letter of wishes come
              with the Complete Will Pack. <Link href="/pricing">See what it adds</Link>
            </p>
          )
        )}
        {flags.length > 0 && (
          <section className="rounded-[20px] border-[1.5px] border-saffron-deep bg-saffron-tint px-[clamp(20px,2.6vw,32px)] py-7 text-saffron-ink">
            <h2 className="h-card">
              {flags.length === 1 ? "One thing" : `${flags.length} things`} your will
              cannot settle alone
            </h2>
            <p className="mt-2.5 text-[16px]">
              Worth a solicitor&rsquo;s eye. You can still generate your will.
            </p>
            <ul className="mt-3 flex list-disc flex-col gap-2.5 pl-5">
              {flags.map((f, i) => (
                <li key={i}>{f}</li>
              ))}
            </ul>
          </section>
        )}
      </>
    );
  }

  /** The last panel: what is still missing, or the button that writes the will. */
  function renderGenerate() {
    const outstanding = firstIncompleteStep(data, isPremium);
    return (
      <section className="flex flex-col gap-[18px] rounded-[20px] bg-deep px-[clamp(20px,2.4vw,32px)] py-8 text-white">
        {outstanding ? (
          <>
            <h2 className="text-[24px] leading-tight font-bold tracking-[-0.02em]">
              One thing is still needed
            </h2>
            <p className="text-mist">{outstanding.message}</p>
            <button
              type="button"
              className="btn-gold btn-lg"
              onClick={() => {
                goTo(steps.findIndex((s) => s.id === outstanding.id));
                setStepError(outstanding.message);
              }}
            >
              Go to {lowerFirst(NAV[outstanding.id].label)}
            </button>
          </>
        ) : (
          <>
            <h2 className="text-[24px] leading-tight font-bold tracking-[-0.02em]">
              Everything needed is here
            </h2>
            <p className="text-mist">
              We will write your will and your signing instructions. Nothing is
              final until you sign it on paper.
            </p>
            <button
              type="button"
              onClick={generate}
              disabled={generating}
              className="rounded-[14px] bg-saffron px-6 py-[18px] text-center text-[20px] font-extrabold text-ink transition-colors hover:bg-saffron-deep disabled:cursor-not-allowed disabled:opacity-70"
            >
              {generating ? "Preparing your will…" : "Generate my will"}
            </button>
          </>
        )}
        <p className="text-[15px] text-mist">
          Wasiyyah is a self-help service, not a law firm. Read every clause
          before you sign.
        </p>
      </section>
    );
  }
}

interface Answer {
  label: string;
  value: React.ReactNode;
  /** takes the full width of its card */
  wide?: boolean;
}

/** Counts sit two to a row on a wide screen, and stack as rows on a phone. */
const COUNT_GRID = "grid gap-3 md:grid-cols-[repeat(auto-fit,minmax(250px,1fr))] md:gap-x-10 md:gap-y-7";

/** "1984-03-11" as "11 March 1984"; null when no date was given. */
function longDate(iso: string): string | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso);
  if (!m) return null;
  return new Date(Date.UTC(+m[1], +m[2] - 1, +m[3])).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  });
}

function Tick() {
  return (
    <svg
      aria-hidden="true"
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="#0B6E4F"
      strokeWidth="3"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="flex-none"
    >
      <path d="M5 12.5l4.5 4.5L19 7.5" />
    </svg>
  );
}

function MuslimOnlyNote() {
  return (
    <p className="max-w-[640px] rounded-xl bg-indigo-tint px-4 py-3 text-[16px] text-indigo-ink">
      Count only relatives who are Muslim. Those who are not take no fixed
      share, and can be provided for in the bequests step.
    </p>
  );
}

function PremiumLock({ feature }: { feature: string }) {
  return (
    <div className="rounded-[20px] border-[1.5px] border-saffron-deep bg-saffron-tint p-6 text-saffron-ink">
      <h2 className="h-card">Part of the Complete Will Pack</h2>
      <p className="mt-2.5 max-w-[600px]">{feature}</p>
      <p className="mt-2.5">
        You can skip this step. Your free will is complete without it.
      </p>
      <Link href="/pricing" className="btn-dark mt-5">
        See the Complete Will Pack
      </Link>
    </div>
  );
}

const segment = (on: boolean) =>
  `min-h-12 flex-1 rounded-xl border-[1.5px] px-3 py-2 text-[16px] leading-snug font-bold transition-colors ${
    on ? "border-emerald bg-emerald text-white" : "border-field bg-white text-ink hover:border-ink"
  }`;

function BequestsEditor({
  bequests,
  onChange,
  total,
}: {
  bequests: Bequest[];
  onChange: (b: Bequest[]) => void;
  total: number;
}) {
  const update = (i: number, patch: Partial<Bequest>) =>
    onChange(bequests.map((b, j) => (j === i ? { ...b, ...patch } : b)));
  const overCap = total > BEQUEST_CAP_PERCENT + 0.01;
  return (
    <div className="flex flex-col gap-5">
      <p className="max-w-[640px] text-ink-soft">
        Up to one-third of your estate may be left outside the fixed shares: to
        charity as sadaqah jariyah, or to people who are not fixed-share heirs
        (grandchildren through a daughter, adopted children, non-Muslim
        relatives). A bequest to someone who is already an heir requires the
        other heirs&rsquo; consent after your death.
      </p>
      <p
        className={`rounded-xl px-4 py-3 text-[16px] font-semibold ${
          overCap ? "border-[1.5px] border-clay bg-white text-clay" : "bg-emerald-tint text-ink"
        }`}
      >
        Percentage bequests so far: {total.toFixed(1)}% of the one-third limit (33.3%)
      </p>
      {bequests.map((b, i) => (
        <div key={i} className={REPEAT_BLOCK}>
          <div className="mb-4 flex items-center justify-between gap-4">
            <span className="font-bold">Bequest {i + 1}</span>
            <RemoveButton
              label={`Remove bequest ${i + 1}`}
              onClick={() => onChange(bequests.filter((_, j) => j !== i))}
            />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block">
              <span className="label">Who receives it</span>
              <input
                className="input"
                value={b.beneficiary}
                placeholder="Charity or person's full name"
                onChange={(e) => update(i, { beneficiary: e.target.value })}
              />
            </label>
            <div role="group" aria-label="They are a">
              <span className="label">They are a…</span>
              <div className="flex gap-2">
                {(["charity", "person"] as const).map((t) => (
                  <button
                    key={t}
                    type="button"
                    aria-pressed={b.beneficiaryType === t}
                    onClick={() => update(i, { beneficiaryType: t })}
                    className={`${segment(b.beneficiaryType === t)} capitalize`}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>
            <div role="group" aria-label="Type of gift">
              <span className="label">Type of gift</span>
              <div className="flex gap-2">
                {(
                  [
                    { v: "percentage", t: "% of estate" },
                    { v: "amount", t: "£ amount" },
                    { v: "item", t: "Specific item" },
                  ] as const
                ).map(({ v, t }) => (
                  <button
                    key={v}
                    type="button"
                    aria-pressed={b.kind === v}
                    onClick={() => update(i, { kind: v })}
                    className={segment(b.kind === v)}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>
            <label className="block">
              <span className="label">
                {b.kind === "percentage" ? "Percentage (max 33.3 in total)" : b.kind === "amount" ? "Amount in pounds" : "Describe the item"}
              </span>
              <input
                className="input"
                value={b.value}
                inputMode={b.kind === "item" ? "text" : "decimal"}
                placeholder={b.kind === "percentage" ? "e.g. 10" : b.kind === "amount" ? "e.g. 5000" : "e.g. my library of Islamic books"}
                onChange={(e) => update(i, { value: e.target.value })}
              />
            </label>
          </div>
        </div>
      ))}
      <button
        type="button"
        className="btn-ghost self-start"
        onClick={() =>
          onChange([
            ...bequests,
            { beneficiary: "", beneficiaryType: "charity", kind: "percentage", value: "" },
          ])
        }
      >
        + Add a bequest
      </button>
    </div>
  );
}
