"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { calculateFaraid } from "@/lib/faraid/engine";
import type { HeirCensus } from "@/lib/faraid/types";
import { solicitorFlags, type Bequest, type WillData } from "@/lib/will-types";
import { SharePreview } from "./SharePreview";
import {
  ChoiceField,
  CountField,
  NameList,
  PersonListEditor,
  TextField,
  YesNo,
} from "./fields";

type StepId =
  | "about"
  | "marriage"
  | "children"
  | "grandchildren"
  | "parents"
  | "grandparents"
  | "siblings"
  | "agnates"
  | "executors"
  | "guardians"
  | "funeral"
  | "bequests"
  | "debts"
  | "wishes"
  | "estate"
  | "review";

interface StepDef {
  id: StepId;
  title: string;
  intro?: string;
  premium?: boolean;
}

function visibleSteps(d: WillData): StepDef[] {
  const c = d.census;
  const noMaleLine =
    c.sons === 0 && c.grandsons === 0 && !c.father && !c.paternalGrandfather;
  const steps: (StepDef | false)[] = [
    { id: "about", title: "About you" },
    { id: "marriage", title: "Your marriage" },
    { id: "children", title: "Your children" },
    c.sons === 0 && {
      id: "grandchildren",
      title: "Grandchildren through a son",
      intro:
        "In Islamic law, the children of a son who passed away before you can inherit in his place. Children of daughters are provided for differently (through the optional bequest).",
    },
    { id: "parents", title: "Your parents" },
    (!c.father || !c.mother) && {
      id: "grandparents",
      title: "Your grandparents",
      intro: "A grandparent can inherit when the parent through whom they are related has passed away.",
    },
    noMaleLine && {
      id: "siblings",
      title: "Your siblings",
      intro:
        "Because you have no son, no father and no paternal grandfather living, your siblings may inherit. If your family changes, regenerate your will and this updates automatically.",
    },
    noMaleLine &&
      c.fullBrothers === 0 &&
      c.paternalBrothers === 0 && {
        id: "agnates",
        title: "Wider family",
      },
    { id: "executors", title: "Your executors" },
    d.hasMinorChildren && { id: "guardians", title: "Guardians for your children" },
    { id: "funeral", title: "Funeral & burial wishes" },
    { id: "bequests", title: "Charitable bequests (wasiyya)", premium: true },
    { id: "debts", title: "Religious debts", premium: true },
    { id: "wishes", title: "Letter of wishes", premium: true },
    { id: "estate", title: "About your estate" },
    { id: "review", title: "Review & generate" },
  ];
  return steps.filter(Boolean) as StepDef[];
}

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
  const [stepIndex, setStepIndex] = useState(0);
  const [saveState, setSaveState] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [stepError, setStepError] = useState<string | null>(null);
  const [generating, setGenerating] = useState(false);

  const steps = visibleSteps(data);
  const step = steps[Math.min(stepIndex, steps.length - 1)];

  const set = (patch: Partial<WillData>) => setData((d) => ({ ...d, ...patch }));
  const setCensus = (patch: Partial<HeirCensus>) =>
    setData((d) => ({ ...d, census: { ...d.census, ...patch } }));

  // ----- autosave (debounced) -----
  const firstRender = useRef(true);
  useEffect(() => {
    if (firstRender.current) {
      firstRender.current = false;
      return;
    }
    setSaveState("saving");
    const t = setTimeout(async () => {
      try {
        const res = await fetch(`/api/wills/${willId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ data }),
        });
        setSaveState(res.ok ? "saved" : "error");
      } catch {
        setSaveState("error");
      }
    }, 900);
    return () => clearTimeout(t);
  }, [data, willId]);

  const result = useMemo(() => {
    try {
      return calculateFaraid(data.census);
    } catch {
      return null;
    }
  }, [data.census]);

  const showShares = ["children", "grandchildren", "parents", "grandparents", "siblings", "agnates", "review"].includes(step.id);

  const percentBequestTotal = data.bequests
    .filter((b) => b.kind === "percentage")
    .reduce((acc, b) => acc + (parseFloat(b.value) || 0), 0);

  const validateStep = (): string | null => {
    if (step.id === "about") {
      if (data.fullName.trim().length < 2) return "Please enter your full legal name.";
      if (data.address.trim().length < 5) return "Please enter your address — the will must identify you clearly.";
    }
    if (step.id === "executors") {
      const named = data.executors.filter((e) => e.name.trim().length > 1);
      if (named.length === 0) return "Please appoint at least one executor.";
    }
    if (step.id === "guardians") {
      const named = data.guardians.filter((g) => g.name.trim().length > 1);
      if (named.length === 0) return "Please appoint at least one guardian for your children under 18.";
    }
    if (step.id === "bequests" && isPremium && percentBequestTotal > 100 / 3 + 1e-9) {
      return `Bequests may not exceed one-third of your estate (currently ${percentBequestTotal.toFixed(1)}%). This is the limit the Prophet ﷺ set — "a third, and a third is much".`;
    }
    return null;
  };

  const goNext = () => {
    const err = validateStep();
    if (err) {
      setStepError(err);
      return;
    }
    setStepError(null);
    setStepIndex((i) => Math.min(i + 1, steps.length - 1));
    window.scrollTo({ top: 0 });
  };
  const goBack = () => {
    setStepError(null);
    setStepIndex((i) => Math.max(i - 1, 0));
    window.scrollTo({ top: 0 });
  };

  const generate = async () => {
    setGenerating(true);
    try {
      const res = await fetch(`/api/wills/${willId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ data, status: "complete" }),
      });
      if (res.ok) {
        router.push(`/will/${willId}/document`);
        return;
      }
    } catch {}
    setGenerating(false);
    setStepError("Something went wrong saving your will — please try again.");
  };

  // ------------------------------------------------------------- rendering --
  return (
    <div className="mx-auto max-w-6xl px-4 pb-24 sm:px-6">
      {/* progress */}
      <div className="sticky top-16 z-30 -mx-4 bg-paper/90 px-4 py-3 backdrop-blur sm:-mx-6 sm:px-6">
        <div className="flex items-center justify-between text-xs font-medium text-ink/55">
          <span>
            Step {stepIndex + 1} of {steps.length} — {step.title}
          </span>
          <span aria-live="polite">
            {saveState === "saving" && "Saving…"}
            {saveState === "saved" && "Saved ✓"}
            {saveState === "error" && <span className="text-red-700">Not saved — check your connection</span>}
          </span>
        </div>
        <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-ink/8">
          <div
            className="h-full rounded-full bg-forest-600 transition-all duration-300"
            style={{ width: `${((stepIndex + 1) / steps.length) * 100}%` }}
          />
        </div>
      </div>

      <div className="mt-6 grid gap-8 lg:grid-cols-[1fr_380px]">
        <div>
          <h1 className="font-display text-2xl font-semibold text-forest-900 sm:text-3xl">
            {step.title}
          </h1>
          {step.intro && (
            <p className="mt-2 max-w-xl text-sm leading-6 text-ink/60">{step.intro}</p>
          )}

          <div className="mt-6 space-y-6">
            {renderStep()}
          </div>

          {stepError && (
            <p className="mt-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800" role="alert">
              {stepError}
            </p>
          )}

          <div className="mt-8 flex items-center gap-3">
            {stepIndex > 0 && (
              <button type="button" onClick={goBack} className="btn-ghost">
                Back
              </button>
            )}
            {step.id !== "review" ? (
              <button type="button" onClick={goNext} className="btn-primary">
                Continue
              </button>
            ) : (
              <button
                type="button"
                onClick={generate}
                disabled={generating}
                className="btn-gold"
              >
                {generating ? "Preparing your will…" : "Generate my will"}
              </button>
            )}
          </div>
        </div>

        {/* live shares panel */}
        <aside className="hidden lg:block">
          {showShares && result && (
            <div className="sticky top-36">
              <SharePreview result={result} />
            </div>
          )}
        </aside>
      </div>

      {/* mobile shares */}
      {showShares && result && (
        <div className="mt-8 lg:hidden">
          <SharePreview result={result} />
        </div>
      )}
    </div>
  );

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
              hint="the Qur'anic shares differ, so the will needs to know"
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
                    label="Number of wives"
                    hint="an Islamic marriage may include up to four"
                    value={data.census.spouseCount}
                    max={4}
                    onChange={(v) => setCensus({ spouseCount: Math.max(1, v) })}
                  />
                )}
                <TextField
                  label={data.sex === "male" ? (data.census.spouseCount > 1 ? "Wives' full names" : "Wife's full name") : "Husband's full name"}
                  value={data.spouseName}
                  onChange={(v) => set({ spouseName: v })}
                  placeholder={data.census.spouseCount > 1 ? "Separate names with commas" : "Full legal name"}
                />
              </>
            )}
          </>
        );

      case "children":
        return (
          <>
            <div className="grid gap-5 sm:grid-cols-2">
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
                hint="if so, your will should appoint guardians"
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
              value={data.census.grandsons + data.census.granddaughters > 0}
              onChange={(v) => {
                if (!v) setCensus({ grandsons: 0, granddaughters: 0 });
                else setCensus({ grandsons: Math.max(1, data.census.grandsons) });
              }}
            />
            {data.census.grandsons + data.census.granddaughters > 0 && (
              <div className="grid gap-5 sm:grid-cols-2">
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
            {!data.census.father && (
              <YesNo
                label="Is your father's father living?"
                value={data.census.paternalGrandfather}
                onChange={(v) => setCensus({ paternalGrandfather: v })}
              />
            )}
            {!data.census.mother && (
              <YesNo
                label="Is your mother's mother living?"
                value={data.census.maternalGrandmother}
                onChange={(v) => setCensus({ maternalGrandmother: v })}
              />
            )}
            {!data.census.father && !data.census.mother && (
              <YesNo
                label="Is your father's mother living?"
                value={data.census.paternalGrandmother}
                onChange={(v) => setCensus({ paternalGrandmother: v })}
              />
            )}
          </>
        );

      case "siblings": {
        const noDescendants =
          data.census.sons + data.census.daughters + data.census.grandsons + data.census.granddaughters === 0;
        return (
          <>
            <div className="grid gap-5 sm:grid-cols-2">
              <CountField
                label="Full brothers"
                hint="same father and mother"
                value={data.census.fullBrothers}
                onChange={(v) => setCensus({ fullBrothers: v })}
              />
              <CountField
                label="Full sisters"
                value={data.census.fullSisters}
                onChange={(v) => setCensus({ fullSisters: v })}
              />
              <CountField
                label="Half-brothers (same father)"
                value={data.census.paternalBrothers}
                onChange={(v) => setCensus({ paternalBrothers: v })}
              />
              <CountField
                label="Half-sisters (same father)"
                value={data.census.paternalSisters}
                onChange={(v) => setCensus({ paternalSisters: v })}
              />
            </div>
            {noDescendants && (
              <CountField
                label="Half-siblings from your mother"
                hint="brothers and sisters share equally"
                value={data.census.maternalSiblings}
                onChange={(v) => setCensus({ maternalSiblings: v })}
              />
            )}
          </>
        );
      }

      case "agnates":
        return (
          <YesNo
            label="Do you have any of these living relatives: a brother's son, a paternal uncle, or a paternal uncle's son?"
            hint="they can inherit any remainder when closer heirs are absent"
            value={data.census.hasOtherAgnates}
            onChange={(v) => setCensus({ hasOtherAgnates: v })}
          />
        );

      case "executors":
        return (
          <>
            <p className="max-w-xl text-sm leading-6 text-ink/60">
              Your executors (awsiya&rsquo;) gather your estate, pay your debts
              — including religious ones — and distribute the shares. Choose
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
            <p className="max-w-xl text-sm leading-6 text-ink/60">
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
              hint="ghusl, kafan, janazah prayer, burial without cremation, as soon as possible"
              value={data.islamicBurial}
              onChange={(v) => set({ islamicBurial: v })}
            />
            <TextField
              label="Charity of last resort"
              hint="receives your estate only if no family member survives you"
              value={data.fallbackCharity}
              onChange={(v) => set({ fallbackCharity: v })}
              placeholder="e.g. Islamic Relief UK, National Zakat Foundation"
            />
          </>
        );

      case "bequests":
        if (!isPremium) return <PremiumLock feature="Charitable bequests let you leave up to one-third of your estate to charities, your masjid, or loved ones who are not fixed-share heirs — including non-Muslim relatives, adopted children and grandchildren through daughters." />;
        return <BequestsEditor bequests={data.bequests} onChange={(b) => set({ bequests: b })} total={percentBequestTotal} />;

      case "debts":
        if (!isPremium) return <PremiumLock feature="The religious-debts schedule instructs your executors to settle unpaid zakat, fidya for missed fasts, kaffarah, and to arrange Hajj on your behalf — debts to Allah are paid before the estate is shared." />;
        return (
          <>
            <YesNo label="Do you have unpaid zakat?" value={data.religiousDebts.unpaidZakat} onChange={(v) => set({ religiousDebts: { ...data.religiousDebts, unpaidZakat: v } })} />
            <YesNo label="Do you have missed fasts to compensate (fidya)?" value={data.religiousDebts.missedFastsFidya} onChange={(v) => set({ religiousDebts: { ...data.religiousDebts, missedFastsFidya: v } })} />
            <YesNo label="Is Hajj still obligatory on you (not yet performed)?" value={data.religiousDebts.hajjNotPerformed} onChange={(v) => set({ religiousDebts: { ...data.religiousDebts, hajjNotPerformed: v } })} />
            <YesNo label="Any outstanding kaffarah (expiation)?" value={data.religiousDebts.kaffarah} onChange={(v) => set({ religiousDebts: { ...data.religiousDebts, kaffarah: v } })} />
            <TextField
              label="Notes for your executors"
              hint="optional — amounts, calculations, who to consult"
              value={data.religiousDebts.notes}
              onChange={(v) => set({ religiousDebts: { ...data.religiousDebts, notes: v } })}
            />
          </>
        );

      case "wishes":
        if (!isPremium) return <PremiumLock feature="A letter of wishes travels with your will: guidance to your executors and family on raising your children in the deen, your funeral preferences, forgiveness you seek, and anything in your heart." />;
        return (
          <div>
            <label className="label">Your letter of wishes <span className="font-normal text-ink/45">— not legally binding, but deeply valued</span></label>
            <textarea
              className="input min-h-48"
              value={data.letterOfWishes}
              onChange={(e) => set({ letterOfWishes: e.target.value })}
              placeholder="Assalamu alaykum to my family…"
            />
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
                { value: "sole", label: "Yes — in my name" },
                { value: "joint", label: "Yes — jointly" },
                { value: "tenants-in-common", label: "Yes — tenants in common" },
                { value: "unsure", label: "Yes — not sure how" },
              ]}
            />
            <YesNo label="Do you own a business or business assets?" value={data.complexity.businessAssets} onChange={(v) => set({ complexity: { ...data.complexity, businessAssets: v } })} />
            <YesNo label="Do you have property or assets outside the UK?" value={data.complexity.foreignAssets} onChange={(v) => set({ complexity: { ...data.complexity, foreignAssets: v } })} />
            <YesNo label="Have you been married before, or do you have stepchildren?" value={data.complexity.previousMarriage} onChange={(v) => set({ complexity: { ...data.complexity, previousMarriage: v } })} />
            <YesNo label="Do you think anyone may challenge your will?" value={data.complexity.expectsDispute} onChange={(v) => set({ complexity: { ...data.complexity, expectsDispute: v } })} />
          </>
        );

      case "review": {
        const flags = solicitorFlags(data);
        return (
          <>
            <div className="card">
              <h3 className="font-display text-lg font-semibold text-forest-900">Summary</h3>
              <dl className="mt-3 grid gap-x-6 gap-y-2 text-sm sm:grid-cols-2">
                <div><dt className="text-ink/50">Name</dt><dd className="font-medium">{data.fullName || "—"}</dd></div>
                <div><dt className="text-ink/50">Marital status</dt><dd className="font-medium capitalize">{data.maritalStatus}</dd></div>
                <div><dt className="text-ink/50">Children</dt><dd className="font-medium">{data.census.sons} son(s), {data.census.daughters} daughter(s)</dd></div>
                <div><dt className="text-ink/50">Executors</dt><dd className="font-medium">{data.executors.filter((e) => e.name).map((e) => e.name).join(", ") || "—"}</dd></div>
                {data.hasMinorChildren && (
                  <div><dt className="text-ink/50">Guardians</dt><dd className="font-medium">{data.guardians.filter((g) => g.name).map((g) => g.name).join(", ") || "—"}</dd></div>
                )}
                {isPremium && data.bequests.length > 0 && (
                  <div><dt className="text-ink/50">Bequests</dt><dd className="font-medium">{data.bequests.length} — {percentBequestTotal.toFixed(1)}% of estate</dd></div>
                )}
              </dl>
            </div>
            {flags.length > 0 && (
              <div className="rounded-2xl border border-gold-300 bg-gold-100/60 p-5">
                <h3 className="font-display text-base font-semibold text-forest-900">
                  Worth a solicitor&rsquo;s eye
                </h3>
                <p className="mt-1 text-xs text-ink/60">
                  Your will is still valid — these are things a will alone cannot fix.
                </p>
                <ul className="mt-3 list-disc space-y-2 pl-5 text-sm leading-6 text-ink/75">
                  {flags.map((f, i) => (
                    <li key={i}>{f}</li>
                  ))}
                </ul>
              </div>
            )}
          </>
        );
      }
    }
  }
}

function PremiumLock({ feature }: { feature: string }) {
  return (
    <div className="rounded-2xl border-2 border-dashed border-gold-400/60 bg-gold-100/40 p-6">
      <div className="flex items-start gap-4">
        <div className="rounded-full bg-gold-500/20 p-2.5 text-xl" aria-hidden>
          ✦
        </div>
        <div>
          <h3 className="font-display text-lg font-semibold text-forest-900">
            Part of the Complete Will Pack
          </h3>
          <p className="mt-2 max-w-lg text-sm leading-6 text-ink/70">{feature}</p>
          <p className="mt-2 text-sm text-ink/60">
            You can skip this step — your free will is complete without it.
          </p>
          <Link href="/pricing" className="btn-gold mt-4 !py-2.5">
            Upgrade once — keep it forever
          </Link>
        </div>
      </div>
    </div>
  );
}

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
  const overCap = total > 100 / 3 + 1e-9;
  return (
    <div className="space-y-5">
      <p className="max-w-xl text-sm leading-6 text-ink/60">
        Up to one-third of your estate may be left outside the fixed shares —
        to charity as sadaqah jariyah, or to people who are not fixed-share
        heirs (grandchildren through a daughter, adopted children, non-Muslim
        relatives). A bequest to someone who is already an heir requires the
        other heirs&rsquo; consent after your death.
      </p>
      <div
        className={`rounded-xl px-4 py-3 text-sm font-medium ${
          overCap ? "bg-red-50 text-red-800 border border-red-200" : "bg-forest-50 text-forest-800"
        }`}
      >
        Percentage bequests so far: {total.toFixed(1)}% of the one-third limit (33.3%)
      </div>
      {bequests.map((b, i) => (
        <div key={i} className="rounded-xl border border-ink/10 bg-paper p-4">
          <div className="mb-3 flex items-center justify-between">
            <span className="text-sm font-semibold text-forest-900">Bequest {i + 1}</span>
            <button
              type="button"
              className="text-xs font-medium text-ink/50 hover:text-red-700"
              onClick={() => onChange(bequests.filter((_, j) => j !== i))}
            >
              Remove
            </button>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <span className="label">Who receives it</span>
              <input
                className="input"
                value={b.beneficiary}
                placeholder="Charity or person's full name"
                onChange={(e) => update(i, { beneficiary: e.target.value })}
              />
            </div>
            <div>
              <span className="label">They are a…</span>
              <div className="flex gap-2">
                {(["charity", "person"] as const).map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => update(i, { beneficiaryType: t })}
                    className={`flex-1 rounded-xl border px-3 py-2.5 text-sm font-semibold capitalize transition ${
                      b.beneficiaryType === t
                        ? "border-forest-700 bg-forest-800 text-white"
                        : "border-ink/15 bg-white text-ink/70"
                    }`}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>
            <div>
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
                    onClick={() => update(i, { kind: v })}
                    className={`flex-1 rounded-xl border px-2 py-2.5 text-xs font-semibold transition ${
                      b.kind === v
                        ? "border-forest-700 bg-forest-800 text-white"
                        : "border-ink/15 bg-white text-ink/70"
                    }`}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>
            <div>
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
            </div>
          </div>
        </div>
      ))}
      <button
        type="button"
        className="btn-ghost !py-2.5 text-sm"
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
