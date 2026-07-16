export function LogoMark({ className = "h-8 w-8" }: { className?: string }) {
  return (
    <svg viewBox="0 0 48 48" className={className} aria-hidden="true">
      {/* eight-point star built from two rotated squares */}
      <rect x="12" y="12" width="24" height="24" rx="2" className="fill-forest-600" />
      <rect
        x="12"
        y="12"
        width="24"
        height="24"
        rx="2"
        transform="rotate(45 24 24)"
        className="fill-gold-500"
        opacity="0.92"
      />
      <circle cx="24" cy="24" r="6.5" className="fill-paper" />
      <circle cx="24" cy="24" r="2.6" className="fill-forest-800" />
    </svg>
  );
}

export function Logo({
  dark = false,
  className = "",
}: {
  dark?: boolean;
  className?: string;
}) {
  return (
    <span className={`inline-flex items-center gap-2.5 ${className}`}>
      <LogoMark className="h-8 w-8" />
      <span
        className={`font-display text-[22px] font-semibold tracking-tight ${
          dark ? "text-white" : "text-forest-900"
        }`}
      >
        Wasiyyah
      </span>
    </span>
  );
}
