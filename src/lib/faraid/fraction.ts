/**
 * Exact rational arithmetic for inheritance shares.
 * Shares are fractions like 1/8 or 8/27 — floating point is never acceptable here.
 */
export class Fraction {
  readonly n: bigint; // numerator
  readonly d: bigint; // denominator, always > 0

  constructor(n: bigint | number, d: bigint | number = 1n) {
    let nn = BigInt(n);
    let dd = BigInt(d);
    if (dd === 0n) throw new Error("Fraction: zero denominator");
    if (dd < 0n) {
      nn = -nn;
      dd = -dd;
    }
    const g = Fraction.gcd(nn < 0n ? -nn : nn, dd);
    this.n = g === 0n ? 0n : nn / g;
    this.d = g === 0n ? 1n : dd / g;
  }

  static gcd(a: bigint, b: bigint): bigint {
    while (b) [a, b] = [b, a % b];
    return a;
  }

  static readonly ZERO = new Fraction(0n);
  static readonly ONE = new Fraction(1n);

  add(o: Fraction) {
    return new Fraction(this.n * o.d + o.n * this.d, this.d * o.d);
  }
  sub(o: Fraction) {
    return new Fraction(this.n * o.d - o.n * this.d, this.d * o.d);
  }
  mul(o: Fraction) {
    return new Fraction(this.n * o.n, this.d * o.d);
  }
  div(o: Fraction) {
    if (o.n === 0n) throw new Error("Fraction: divide by zero");
    return new Fraction(this.n * o.d, this.d * o.n);
  }
  cmp(o: Fraction): -1 | 0 | 1 {
    const l = this.n * o.d;
    const r = o.n * this.d;
    return l < r ? -1 : l > r ? 1 : 0;
  }
  isZero() {
    return this.n === 0n;
  }
  gt(o: Fraction) {
    return this.cmp(o) === 1;
  }
  lt(o: Fraction) {
    return this.cmp(o) === -1;
  }
  eq(o: Fraction) {
    return this.cmp(o) === 0;
  }

  toNumber() {
    return Number(this.n) / Number(this.d);
  }

  /** "8/27", or "1" for a whole unit */
  toString() {
    return this.d === 1n ? this.n.toString() : `${this.n}/${this.d}`;
  }

  /** Percentage string for UI, e.g. "29.63%" */
  toPercent(dp = 2) {
    return `${(this.toNumber() * 100).toFixed(dp)}%`;
  }
}

export const frac = (n: bigint | number, d: bigint | number = 1n) =>
  new Fraction(n, d);

/** Sum a list of fractions. */
export const sum = (fs: Fraction[]) =>
  fs.reduce((a, b) => a.add(b), Fraction.ZERO);
