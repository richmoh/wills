import Link from "next/link";
import { DeleteWillButton } from "@/components/DashboardActions";
import { ShareBar, Swatch } from "@/components/Shares";
import type { WillSummary } from "./will-summary";

/**
 * One will on My wills: its name and actions, how far it has got, and, once
 * it is generated, how it shares the estate.
 */
export function WillCard({ will }: { will: WillSummary }) {
  const headingId = `will-${will.id}`;
  const editHref = `/will/${will.id}/edit`;
  const documentHref = `/will/${will.id}/document`;

  return (
    <section className="card flex flex-col gap-7">
      <div className="flex flex-wrap items-start justify-between gap-x-8 gap-y-4">
        <div className="min-w-0">
          <h2 id={headingId} className="text-[28px] leading-[1.3] font-bold tracking-[-0.02em]">
            {will.label}
          </h2>
          <p className="mt-1 text-[16px] text-ink-soft">
            {will.generated ? "Generated" : "Last edited"} {will.date}
            {will.reference && <> &middot; reference {will.reference}</>}
          </p>
        </div>
        {/* the heading describes each link, which tells several wills apart */}
        <div className="flex flex-wrap gap-3">
          {will.generated ? (
            <>
              <Link href={editHref} aria-describedby={headingId} className="btn-ghost">
                Change my answers
              </Link>
              <Link href={documentHref} aria-describedby={headingId} className="btn-primary">
                Open my will
              </Link>
            </>
          ) : (
            <Link href={editHref} aria-describedby={headingId} className="btn-primary">
              Continue my will
            </Link>
          )}
        </div>
      </div>

      <ol className="grid grid-cols-[repeat(auto-fit,minmax(min(220px,100%),1fr))] gap-3">
        {will.answered ? (
          <Tile tone="done" title="Answered">
            The questions about you and your family
          </Tile>
        ) : (
          <Tile tone="todo" title="Answers not finished">
            What you have answered so far is saved
          </Tile>
        )}
        {will.generated ? (
          <Tile tone="done" title="Generated">
            Your will and signing instructions are ready
          </Tile>
        ) : (
          <Tile tone="todo" title="Not generated yet">
            You generate your will at the end of the questions
          </Tile>
        )}
        {/* signing is done by hand and is not recorded here, so this is a standing reminder */}
        {will.generated && (
          <Tile tone="warn" title="Not signed yet">
            Until it is signed with two witnesses, it has no legal effect.{" "}
            <Link
              href={`${documentHref}#signing`}
              aria-describedby={headingId}
              className="font-bold text-saffron-ink hover:text-ink"
            >
              How to sign it
            </Link>
          </Tile>
        )}
      </ol>

      {will.shares.length > 0 && (
        <div>
          <h3 className="mb-3 text-[16px] font-bold text-ink-soft">
            How your estate is shared today
          </h3>
          {/* the bar leaves a fraction out of a slice too narrow for it and is hidden
              from screen readers, so the legend states every share */}
          <ShareBar segments={will.shares} />
          <ul className="mt-3 flex flex-wrap gap-x-7 gap-y-1.5 text-[16px] text-ink-soft">
            {will.shares.map((s) => (
              <li key={s.key} className="flex items-center gap-2">
                <Swatch fill={s.fill} className="h-3! w-3! rounded-[3px]!" />
                <span>
                  {s.legend}{" "}
                  <span className="font-bold text-ink tabular-nums">
                    {s.n === s.d ? "all" : `${s.n}/${s.d}`}
                  </span>
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="border-t border-line pt-4">
        <DeleteWillButton willId={will.id} />
      </div>
    </section>
  );
}

const TILE = {
  done: "bg-emerald-tint",
  todo: "bg-stone",
  warn: "border-[1.5px] border-saffron-deep bg-saffron-tint",
} as const;

function Tile({
  tone,
  title,
  children,
}: {
  tone: keyof typeof TILE;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <li className={`flex items-start gap-[14px] rounded-2xl px-5 py-[18px] ${TILE[tone]}`}>
      {tone === "done" ? (
        <svg
          aria-hidden="true"
          width="26"
          height="26"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="mt-0.5 flex-none text-emerald"
        >
          <path d="M5 12.5l4.5 4.5L19 7.5" />
        </svg>
      ) : (
        <span
          aria-hidden="true"
          className={`mt-0.5 h-[26px] w-[26px] flex-none rounded-full border-[2.5px] ${
            tone === "warn" ? "border-saffron-rule" : "border-ink-faint"
          }`}
        />
      )}
      <span className="min-w-0">
        <strong className="block">{title}</strong>
        <span className={`text-[16px] ${tone === "warn" ? "text-saffron-ink" : "text-ink-soft"}`}>
          {children}
        </span>
      </span>
    </li>
  );
}
