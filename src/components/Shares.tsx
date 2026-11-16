/**
 * The pieces every picture of the shares is built from: the stacked fraction
 * (set the way a fara'id text writes it), the ring divided into exact parts,
 * and the proportional bar. No hooks, so they work in server and client
 * components alike.
 */

export interface ShareSegment {
  /** unique within the picture */
  key: string;
  label: string;
  /** numerator and denominator of this group's share */
  n: number | bigint;
  d: number | bigint;
  fill: string;
  text: string;
}

const gcd = (a: bigint, b: bigint): bigint => (b ? gcd(b, a % b) : a);

/** The smallest number of equal parts in which every share is a whole number. */
export function equalParts(segments: Pick<ShareSegment, "d">[]): number {
  return Number(
    segments.reduce((m, s) => {
      const d = BigInt(s.d);
      return (m / gcd(m, d)) * d;
    }, 1n)
  );
}

const ratio = (s: Pick<ShareSegment, "n" | "d">) => Number(s.n) / Number(s.d);

/** A fraction with the numerator over the denominator. */
export function StackedFraction({
  n,
  d,
  className = "min-w-[40px] text-[20px]",
}: {
  n: number | bigint | string;
  d: number | bigint | string;
  /** width and size; the weight and layout are fixed */
  className?: string;
}) {
  const whole = String(n) === String(d);
  return (
    <span
      className={`inline-flex flex-col items-center leading-none font-extrabold tabular-nums ${className}`}
    >
      {whole ? (
        <span>All</span>
      ) : (
        <>
          {/* read, copied and searched as "1/8"; drawn stacked */}
          <span className="sr-only">{`${n}/${d}`}</span>
          <span aria-hidden="true">{String(n)}</span>
          <span aria-hidden="true" className="my-1 h-0.5 self-stretch bg-current" />
          <span aria-hidden="true">{String(d)}</span>
        </>
      )}
    </span>
  );
}

/** The small coloured square that ties a row to its part of the picture. */
export function Swatch({ fill, className = "" }: { fill: string; className?: string }) {
  return (
    <span
      aria-hidden="true"
      className={`h-3.5 w-3.5 flex-none rounded-[4px] ${className}`}
      style={{ background: fill }}
    />
  );
}

/**
 * A ring divided in proportion to each share, with the number of equal parts
 * in the middle. `size` is the outer diameter in pixels.
 */
export function ShareRing({
  segments,
  size = 200,
  label,
}: {
  segments: ShareSegment[];
  size?: number;
  /** accessible description; defaults to a list of the shares */
  label?: string;
}) {
  // each segment runs from where the last one ended
  const ends = segments.reduce<number[]>(
    (acc, s) => [...acc, (acc[acc.length - 1] ?? 0) + ratio(s) * 100],
    []
  );
  const stops = segments.map(
    (s, i) => `${s.fill} ${(ends[i - 1] ?? 0).toFixed(3)}% ${ends[i].toFixed(3)}%`
  );
  const hole = Math.round(size * 0.6);
  const parts = segments.length ? equalParts(segments) : 0;
  return (
    <div
      role="img"
      aria-label={
        label ??
        (segments.length
          ? `Ring: ${segments.map((s) => `${s.label} ${s.n} over ${s.d}`).join(", ")}`
          : "Ring: no shares yet")
      }
      className="flex flex-none items-center justify-center rounded-full"
      style={{
        width: size,
        height: size,
        background: stops.length ? `conic-gradient(${stops.join(", ")})` : "#E3E8E4",
      }}
    >
      <div
        className="flex flex-col items-center justify-center rounded-full bg-white leading-[1.1]"
        style={{ width: hole, height: hole }}
      >
        <span
          className="font-extrabold tracking-[-0.03em] tabular-nums"
          style={{ fontSize: Math.round(size * 0.18) }}
        >
          {parts}
        </span>
        <span className="text-ink-soft" style={{ fontSize: size >= 190 ? 14 : 13 }}>
          {parts === 1 ? "part" : "equal parts"}
        </span>
      </div>
    </div>
  );
}

/**
 * One bar split in proportion to each share. A segment shows its fraction
 * when there is room for it. Decorative by default: pair it with a list.
 */
export function ShareBar({
  segments,
  className = "h-11 rounded-[10px] text-[15px]",
  showLabel = false,
  width = 640,
}: {
  segments: ShareSegment[];
  /** height, radius and text size */
  className?: string;
  /** write "Wife 1/4" rather than "1/4" where it fits */
  showLabel?: boolean;
  /** roughly how wide the bar is drawn, in pixels, to judge what fits in a slice */
  width?: number;
}) {
  return (
    <div aria-hidden="true" className={`flex gap-[3px] overflow-hidden font-bold ${className}`}>
      {segments.map((s) => {
        const share = ratio(s);
        const fraction = String(s.n) === String(s.d) ? "All" : `${s.n}/${s.d}`;
        const named = `${s.label} ${fraction}`;
        const fits = (text: string) => share * width >= text.length * 8 + 14;
        return (
          <div
            key={s.key}
            className="flex min-w-0 items-center justify-center whitespace-nowrap"
            style={{ flex: `${share * 100} 1 0%`, background: s.fill, color: s.text }}
          >
            {showLabel && fits(named) ? named : fits(fraction) ? fraction : ""}
          </div>
        );
      })}
    </div>
  );
}
