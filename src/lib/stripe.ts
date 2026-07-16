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

export const PREMIUM_PRICE_PENCE = parseInt(
  process.env.PREMIUM_PRICE_PENCE ?? "3900",
  10
);

export const appUrl = () =>
  process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

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
