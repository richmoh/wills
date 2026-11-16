import Image from "next/image";
import Link from "next/link";
import { Logo } from "./Logo";

/** What the dark panel beside the form says. */
export interface AuthPanel {
  heading: string;
  /** steps happen in order, so they are numbered; facts are ticked */
  kind: "steps" | "facts";
  points: { title: string; text: string }[];
  closing: string;
}

/**
 * The page behind sign up, sign in and the two password pages. There is no
 * site header or footer: the logo and the form sit on the left, and a dark
 * green panel on the right says what happens next. On a narrow screen the
 * panel wraps below the form.
 */
export function AuthShell({
  panel,
  children,
}: {
  panel: AuthPanel;
  children: React.ReactNode;
}) {
  const List = panel.kind === "steps" ? "ol" : "ul";
  return (
    <div className="flex flex-1 flex-wrap">
      <main className="flex min-w-0 flex-[1_1_520px] flex-col px-[clamp(20px,5vw,72px)] pt-7 pb-16">
        <Link href="/" aria-label="Wasiyyah, Islamic Wills" className="self-start no-underline">
          <Logo />
        </Link>
        {/* a container, so the forms can lay out by the width of this column */}
        <div className="@container my-auto w-full max-w-[460px] pt-12">{children}</div>
      </main>

      <aside className="flex min-w-0 flex-[1_1_420px] flex-col justify-center gap-9 bg-deep px-[clamp(24px,5vw,72px)] py-[clamp(40px,6vw,88px)] text-white">
        {/* Not preloaded: on a phone it is well below the form. */}
        <Image
          src="/illustrations/answering.jpg"
          alt="Illustration: a husband and wife on a sofa answering questions together on a laptop."
          width={1400}
          height={1045}
          sizes="(min-width: 940px) 40vw, 100vw"
          className="block aspect-[3/2] h-auto w-full rounded-[20px] object-cover object-[center_70%]"
        />
        <h2 className="text-[clamp(26px,2.6vw,34px)] leading-[1.15] font-bold tracking-[-0.03em]">
          {panel.heading}
        </h2>
        {/* role="list" keeps the list (and its numbering) announced in Safari,
            which drops it when the bullets are removed */}
        <List role="list" className="flex flex-col gap-7">
          {panel.points.map((point, i) => (
            <li key={point.title} className="flex gap-5">
              <span
                aria-hidden="true"
                className="flex h-11 w-11 flex-none items-center justify-center rounded-full border-2 border-saffron font-extrabold text-saffron"
              >
                {panel.kind === "steps" ? i + 1 : <Tick />}
              </span>
              <span>
                <strong className="block text-[20px]">{point.title}</strong>
                <span className="text-mist">{point.text}</span>
              </span>
            </li>
          ))}
        </List>
        <p className="border-t border-deep-line pt-7 text-[16px] text-mist">{panel.closing}</p>
      </aside>
    </div>
  );
}

function Tick() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
      <path
        d="M4 10.5 8.2 14.5 16 6"
        stroke="currentColor"
        strokeWidth="2.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/*
 * The pieces every form in the left-hand column is made of. They hold no
 * state, so the client forms import them from here.
 */

/** A form, or the message that replaces it: a column with 22px between parts. */
export const authStack = "flex flex-col gap-[22px]";

/** The one action of the page: 58px tall and as wide as the column. */
export const authSubmit = "btn-primary btn-lg h-[58px] w-full py-0 disabled:border";

/**
 * The line of links under the action. The links are padded to a 44px touch
 * target and the line gives the same space back, so it sits where plain text
 * would.
 */
export const authFoot = "-my-2.5 text-[16px] text-ink-soft";
export const authFootLink = "inline-block py-2.5";

/** The page heading and the sentence under it. */
export function AuthHeading({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <h1 className="text-[clamp(34px,3.6vw,46px)] leading-[1.05] font-extrabold tracking-[-0.035em]">
        {title}
      </h1>
      <p className="mt-3 text-ink-soft">{children}</p>
    </div>
  );
}

/** A labelled field, with an optional hint under it that is read out with it. */
export function AuthField({
  id,
  label,
  hint,
  ...input
}: {
  id: string;
  label: string;
  hint?: string;
} & Omit<React.ComponentProps<"input">, "id" | "className">) {
  return (
    <div>
      <label className="label" htmlFor={id}>
        {label}
      </label>
      <input
        id={id}
        className="input"
        aria-describedby={hint ? `${id}-hint` : undefined}
        {...input}
      />
      {hint && (
        <p id={`${id}-hint`} className="hint mt-2">
          {hint}
        </p>
      )}
    </div>
  );
}

/**
 * Goes between two links on the line under the action: a dot where the column
 * is wide enough for both, and a line break where it is not (a phone), so the
 * dot is never left hanging at the end of a line.
 */
export function Dot() {
  return (
    <>
      <br className="@[440px]:hidden" />
      <span aria-hidden="true" className="hidden @[440px]:inline">
        {" \u00a0\u00b7\u00a0 "}
      </span>
    </>
  );
}
