import Link from "next/link";
import { getSessionUser } from "@/lib/auth";
import { Logo } from "./Logo";
import { NavLink } from "./NavLink";

/** The header of the public site: home, pricing, questions, legal, sign-in. */
export async function SiteHeader() {
  const user = await getSessionUser();
  return (
    <header className="mx-auto flex w-full max-w-[1240px] flex-wrap items-center justify-between gap-x-8 gap-y-4 px-[clamp(20px,4vw,48px)] py-5">
      <Link href="/" aria-label="Wasiyyah, Islamic Wills" className="no-underline">
        <Logo />
      </Link>
      <nav
        aria-label="Main"
        className="flex flex-wrap items-center gap-x-7 gap-y-2 text-[16px] font-medium"
      >
        {/* the two in-page links are dropped on a phone, where space is short */}
        <NavLink href="/#how" className="hidden py-2.5 md:inline">
          How it works
        </NavLink>
        <NavLink href="/#working" className="hidden py-2.5 md:inline">
          The shares
        </NavLink>
        <NavLink href="/pricing" className="py-2.5">
          Pricing
        </NavLink>
        <NavLink href="/faq" className="py-2.5">
          Questions
        </NavLink>
        {user ? (
          <Link href="/dashboard" className="btn-primary !py-3">
            My wills
          </Link>
        ) : (
          <>
            <NavLink href="/login" strong className="py-2.5">
              Sign in
            </NavLink>
            <Link href="/signup" className="btn-primary !py-3">
              Start my will
            </Link>
          </>
        )}
      </nav>
    </header>
  );
}
