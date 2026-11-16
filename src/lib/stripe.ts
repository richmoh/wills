import Stripe from "stripe";
import { query } from "./db";

const globalForStripe = globalThis as unknown as { __stripe?: Stripe };

/** Returns null when Stripe is not configured (dev mode simulates the upgrade). */
export function getStripe(): Stripe | null {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) return null;
  if (!globalForStripe.__stripe) globalForStripe.__stripe = new Stripe(key);
  return globalForStripe.__stripe;
}

const configuredPrice = parseInt(process.env.PREMIUM_PRICE_PENCE ?? "", 10);
/** Falls back to £39 when the variable is unset or not a sensible number. */
export const PREMIUM_PRICE_PENCE =
  Number.isInteger(configuredPrice) && configuredPrice >= 100 ? configuredPrice : 3900;

/**
 * The site's public address, used in links that leave the site (Stripe return
 * URLs, password-reset emails). In production it must be configured: guessing
 * would send a paying customer, or a reset link, to localhost.
 */
export const appUrl = () => {
  const url = process.env.NEXT_PUBLIC_APP_URL;
  if (url) return url.replace(/\/+$/, "");
  if (process.env.NODE_ENV === "production") {
    throw new Error("NEXT_PUBLIC_APP_URL is not set — it is needed for payment and email links.");
  }
  return "http://localhost:3000";
};

/** Idempotent fulfilment: mark the payment paid and the user premium. */
export async function fulfilPayment(
  stripeSessionId: string,
  userId: string
): Promise<void> {
  await query(
    `update payments set status = 'paid', updated_at = now()
      where stripe_session_id = $1 and status <> 'paid'`,
    [stripeSessionId]
  );
  await query(`update users set is_premium = true where id = $1`, [userId]);
}
