import Link from "next/link";
import { getSessionUser } from "@/lib/auth";
import { Logo } from "./Logo";

export async function SiteHeader() {
  const user = await getSessionUser();
  return (
    <header className="sticky top-0 z-40 border-b border-ink/8 bg-paper/85 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
        <Link href="/" aria-label="Wasiyyah home">
          <Logo />
        </Link>
        <nav className="hidden items-center gap-7 text-sm font-medium text-ink/70 md:flex">
          <Link href="/#how-it-works" className="hover:text-forest-800">
            How it works
          </Link>
          <Link href="/#inheritance" className="hover:text-forest-800">
            Islamic inheritance
          </Link>
          <Link href="/pricing" className="hover:text-forest-800">
            Pricing
          </Link>
          <Link href="/faq" className="hover:text-forest-800">
            FAQ
          </Link>
        </nav>
        <div className="flex items-center gap-3">
          {user ? (
            <Link href="/dashboard" className="btn-primary !py-2.5">
              My wills
            </Link>
          ) : (
            <>
              <Link
                href="/login"
                className="hidden text-sm font-semibold text-forest-900 hover:text-forest-700 sm:block"
              >
                Sign in
              </Link>
              <Link href="/signup" className="btn-primary !py-2.5">
                Start my will
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
