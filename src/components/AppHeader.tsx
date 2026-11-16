import Link from "next/link";
import { Logo, OliveMark } from "./Logo";
import { NavLink } from "./NavLink";
import { SignOutButton } from "./SignOutButton";

/**
 * The header inside the product (My wills, Account, the interview, the will):
 * a white bar with the smaller logo. By default the right-hand side is the
 * account navigation; pass children to replace it, as the interview does with
 * its save status.
 */
export function AppHeader({
  children,
  logoHref = "/dashboard",
  width = "max-w-[1120px]",
  compactLogo = false,
  below,
}: {
  children?: React.ReactNode;
  logoHref?: string;
  /** Tailwind max-width class matching the page's own column */
  width?: string;
  /** show only the olive mark on a phone, to leave room for what is beside it */
  compactLogo?: boolean;
  /** a strip inside the header, under the main row (the interview's progress bar) */
  below?: React.ReactNode;
}) {
  return (
    <header className="no-print border-b border-line bg-white">
      <div
        className={`mx-auto flex w-full ${width} flex-wrap items-center justify-between gap-x-8 gap-y-2 px-[clamp(20px,4vw,48px)] py-3.5`}
      >
        <Link href={logoHref} aria-label="Wasiyyah, my wills" className="no-underline">
          {compactLogo ? (
            <>
              <span className="flex h-11 w-11 items-center justify-center sm:hidden">
                <OliveMark width={31} height={36} />
              </span>
              <Logo size="md" className="!hidden sm:!inline-flex" />
            </>
          ) : (
            <Logo size="md" />
          )}
        </Link>
        {children ?? (
          <nav
            aria-label="Account"
            className="flex flex-wrap items-center gap-x-7 gap-y-1 text-[16px] font-semibold"
          >
            <NavLink href="/dashboard" className="py-3">
              My wills
            </NavLink>
            <NavLink href="/account" className="py-3">
              Account
            </NavLink>
            <SignOutButton className="py-3 font-semibold text-ink hover:text-emerald" />
          </nav>
        )}
      </div>
      {below}
    </header>
  );
}
