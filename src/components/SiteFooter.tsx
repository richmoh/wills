import Link from "next/link";

export function SiteFooter() {
  return (
    <footer className="no-print mt-auto border-t border-line">
      <div className="mx-auto flex w-full max-w-[1240px] flex-wrap justify-between gap-x-16 gap-y-6 px-[clamp(20px,4vw,48px)] py-12 text-[16px]">
        <p className="max-w-[520px] flex-[1_1_360px] text-ink-soft">
          <strong className="text-ink">Wasiyyah</strong>
          {" is a self-help document service, not a law firm, and does not give legal advice. For complex estates we recommend a solicitor reviews your will. "}
          &copy; {new Date().getFullYear()} Wasiyyah.
        </p>
        <nav aria-label="Footer" className="flex flex-wrap items-start gap-x-7 gap-y-2">
          <Link href="/pricing" className="py-2.5">
            Pricing
          </Link>
          <Link href="/faq" className="py-2.5">
            Questions
          </Link>
          <Link href="/legal/terms" className="py-2.5">
            Terms
          </Link>
          <Link href="/legal/privacy" className="py-2.5">
            Privacy
          </Link>
        </nav>
      </div>
    </footer>
  );
}
