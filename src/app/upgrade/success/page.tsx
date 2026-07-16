import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth";
import { fulfilPayment, getStripe } from "@/lib/stripe";

/**
 * Belt-and-braces fulfilment: verifies the Checkout session directly with
 * Stripe on return, so the upgrade lands even if the webhook is delayed.
 */
export default async function UpgradeSuccess({
  searchParams,
}: {
  searchParams: Promise<{ session_id?: string }>;
}) {
  const user = await getSessionUser();
  if (!user) redirect("/login");

  const { session_id: sessionId } = await searchParams;
  const stripe = getStripe();
  if (sessionId && stripe) {
    try {
      const session = await stripe.checkout.sessions.retrieve(sessionId);
      if (
        session.payment_status === "paid" &&
        session.metadata?.userId === user.id
      ) {
        await fulfilPayment(session.id, user.id);
      }
    } catch {
      // webhook remains the source of truth; the dashboard reflects it
    }
  }

  redirect("/dashboard?upgraded=1");
}
