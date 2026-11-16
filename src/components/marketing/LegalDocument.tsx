import { SideNav } from "./SideNav";

export type LegalSection = {
  /** the section's id, which the contents list links to */
  id: string;
  heading: string;
  /** its name in the contents list, when that differs from the heading */
  label?: string;
  body: React.ReactNode;
};

// one block of the text; the rules between blocks come from the column
const block = "space-y-4 py-8 first:pt-0 last:pb-0";

/**
 * Terms and Privacy, laid out like the Questions page: the title and a
 * contents list on the left, the text on the right at a readable width, with
 * a rule between sections.
 */
export function LegalDocument({
  title,
  updated,
  intro,
  sections,
  closing,
}: {
  title: string;
  /** the "Last updated" line under the title */
  updated?: string;
  /** text before the first section */
  intro?: React.ReactNode;
  sections: LegalSection[];
  /** text after the last section */
  closing?: React.ReactNode;
}) {
  return (
    <main className="mx-auto flex w-full max-w-[1240px] flex-wrap gap-x-20 gap-y-12 px-[clamp(20px,4vw,48px)] pt-12 pb-24">
      <div className="min-w-0 flex-[1_1_320px]">
        <h1 className="h-display">{title}</h1>
        {updated && <p className="mt-6 text-[16px] text-ink-soft">{updated}</p>}
        <SideNav
          label="Contents"
          items={sections.map((s) => ({ id: s.id, label: s.label ?? s.heading }))}
        />
      </div>

      <div className="max-w-[70ch] min-w-0 flex-[2_1_560px] divide-y divide-line-strong text-ink-soft [&_strong]:text-ink">
        {intro && <div className={block}>{intro}</div>}
        {sections.map((s) => (
          <section key={s.id} id={s.id} className={`${block} scroll-mt-6`}>
            <h2 className="h-card text-ink">{s.heading}</h2>
            {s.body}
          </section>
        ))}
        {closing && <div className={block}>{closing}</div>}
      </div>
    </main>
  );
}
