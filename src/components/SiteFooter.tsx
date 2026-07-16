import Link from "next/link";
import { Logo } from "./Logo";

export function SiteFooter() {
  return (
    <footer className="border-t border-ink/8 bg-paper-dark">
      <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
        <div className="flex flex-col gap-10 md:flex-row md:justify-between">
          <div className="max-w-sm">
            <Logo />
            <p className="mt-4 text-sm leading-6 text-ink/60">
              A fara&rsquo;id-compliant will, drafted for England &amp; Wales,
              from a short guided interview. Your details never leave your
              account and are never sold.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-10 text-sm sm:grid-cols-3">
            <div>
              <div className="font-semibold text-forest-900">Product</div>
              <ul className="mt-3 space-y-2 text-ink/60">
                <li><Link href="/#how-it-works" className="hover:text-forest-800">How it works</Link></li>
                <li><Link href="/pricing" className="hover:text-forest-800">Pricing</Link></li>
                <li><Link href="/faq" className="hover:text-forest-800">FAQ</Link></li>
              </ul>
            </div>
            <div>
              <div className="font-semibold text-forest-900">Learn</div>
              <ul className="mt-3 space-y-2 text-ink/60">
                <li><Link href="/#inheritance" className="hover:text-forest-800">Islamic inheritance</Link></li>
                <li><Link href="/faq#why-a-will" className="hover:text-forest-800">Why every Muslim needs a will</Link></li>
              </ul>
            </div>
            <div>
              <div className="font-semibold text-forest-900">Legal</div>
              <ul className="mt-3 space-y-2 text-ink/60">
                <li><Link href="/legal/terms" className="hover:text-forest-800">Terms</Link></li>
                <li><Link href="/legal/privacy" className="hover:text-forest-800">Privacy</Link></li>
              </ul>
            </div>
          </div>
        </div>
        <div className="mt-10 border-t border-ink/8 pt-6 text-xs leading-5 text-ink/45">
          <p>
            Wasiyyah is a self-help document service, not a law firm, and does
            not provide legal advice. For complex estates we recommend a
            solicitor reviews your will. &copy; {new Date().getFullYear()}{" "}
            Wasiyyah.
          </p>
        </div>
      </div>
    </footer>
  );
}
