"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

/**
 * A navigation link that marks itself as the current page. Used by both
 * headers: the current page is emerald and bold, and announced as current.
 */
export function NavLink({
  href,
  children,
  className = "",
  strong = false,
}: {
  href: string;
  children: React.ReactNode;
  className?: string;
  /** bold even when it is not the current page */
  strong?: boolean;
}) {
  const pathname = usePathname();
  const current = !href.includes("#") && pathname === href;
  return (
    <Link
      href={href}
      aria-current={current ? "page" : undefined}
      className={`no-underline ${
        current
          ? "font-bold text-emerald"
          : `${strong ? "font-bold" : ""} text-ink hover:text-emerald`
      } ${className}`}
    >
      {children}
    </Link>
  );
}
