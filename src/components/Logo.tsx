/**
 * The Wasiyyah logo: an olive branch carrying one saffron olive, the name in
 * Outfit, and "Islamic Wills" beneath it. The tagline is indented so that it
 * starts where the W's first stroke meets the baseline.
 */

type Tone = "light" | "dark";

const SIZES = {
  // the public site's header
  lg: { mark: [41, 48], name: 29, tagline: 9.5, indent: 7, gap: 8 },
  // inside the product
  md: { mark: [36, 42], name: 25, tagline: 8, indent: 6, gap: 7 },
} as const;

export function OliveMark({
  width = 41,
  height = 48,
  tone = "light",
  className,
}: {
  width?: number;
  height?: number;
  tone?: Tone;
  className?: string;
}) {
  const branch = tone === "dark" ? "#FFFFFF" : "#0B6E4F";
  const olive = tone === "dark" ? "#F2C766" : "#E7B23F";
  const leaf = "M0 0 C-9 -10 -9 -24 0 -34 C9 -24 9 -10 0 0 Z";
  return (
    <svg
      aria-hidden="true"
      width={width}
      height={height}
      viewBox="20 6 92 108"
      className={`flex-none ${className ?? ""}`}
    >
      <path
        d="M26 108 Q56 88 80 40"
        fill="none"
        stroke={branch}
        strokeWidth="5"
        strokeLinecap="round"
      />
      <g fill={branch}>
        <path d={leaf} transform="translate(51.8 84.3) rotate(95)" />
        <path d={leaf} transform="translate(65.1 66.3) rotate(-22)" />
        <path d={leaf} transform="translate(75.1 49.3) rotate(84)" />
        <path d={leaf} transform="translate(80 40) rotate(27)" />
      </g>
      <ellipse
        cx="0"
        cy="0"
        rx="7.5"
        ry="9.5"
        transform="translate(32.3 87.5) rotate(-43)"
        fill={olive}
      />
    </svg>
  );
}

/**
 * The full lockup. It is decorative text: put it inside a link or heading that
 * carries the accessible name ("Wasiyyah, Islamic Wills").
 */
export function Logo({
  size = "lg",
  tone = "light",
  className = "",
}: {
  size?: keyof typeof SIZES;
  tone?: Tone;
  className?: string;
}) {
  const s = SIZES[size];
  return (
    <span
      className={`inline-flex items-center ${tone === "dark" ? "text-white" : "text-ink"} ${className}`}
      style={{ gap: s.gap }}
    >
      <OliveMark width={s.mark[0]} height={s.mark[1]} tone={tone} />
      <span aria-hidden="true" className="flex flex-col items-start font-logo" style={{ gap: s.gap }}>
        <span
          className="leading-none font-semibold tracking-[-0.02em]"
          style={{ fontSize: s.name }}
        >
          Wasiyyah
        </span>
        <span
          className={`leading-[0.4] font-medium tracking-[0.22em] whitespace-nowrap uppercase ${
            tone === "dark" ? "text-saffron" : "text-emerald"
          }`}
          style={{ fontSize: s.tagline, marginLeft: s.indent }}
        >
          Islamic Wills
        </span>
      </span>
    </span>
  );
}
