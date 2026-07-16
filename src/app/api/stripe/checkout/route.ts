import { requireUser } from "@/lib/auth";
import { query } from "@/lib/db";
import { appUrl, getStripe, PREMIUM_PRICE_PENCE } from "@/lib/stripe";

export async function POST() {
  try {
    const user = await requireUser();
    if (user.is_premium) {
      return Response.json({ url: "/dashboard" });
    }

    const stripe = getStripe();
    if (!stripe) {
      if (process.env.NODE_ENV === "production") {
        return Response.json(
          { error: "Payments are not configured yet — please try again soon." },
          { status: 503 }
        );
      }
      // development without Stripe keys: simulate the upgrade
      await query(
        `insert into payments (user_id, amount_pence, status) values ($1, $2, 'dev')`,
        [user.id, PREMIUM_PRICE_PENCE]
      );
      await query(`update users set is_premium = true where id = $1`, [user.id]);
      return Response.json({ url: "/dashboard?upgraded=dev" });
    }

    const priceId = process.env.STRIPE_PRICE_ID;
    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      customer_email: user.email,
      line_items: [
        priceId
          ? { price: priceId, quantity: 1 }
          : {
              price_data: {
                currency: "gbp",
                unit_amount: PREMIUM_PRICE_PENCE,
                product_data: {
                  name: "Wasiyyah — Complete Will Pack",
                  description:
                    "One-time payment. Bequests, religious-debts schedule, letter of wishes, executor pack, mirror will, lifetime updates.",
                },
              },
              quantity: 1,
            },
      ],
      metadata: { userId: user.id },
      success_url: `${appUrl()}/upgrade/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${appUrl()}/pricing?cancelled=1`,
    });

    await query(
      `insert into payments (user_id, stripe_session_id, amount_pence, status)
       values ($1, $2, $3, 'pending')
       on conflict (stripe_session_id) do nothing`,
      [user.id, session.id, PREMIUM_PRICE_PENCE]
    );

    return Response.json({ url: session.url });
  } catch (r) {
    if (r instanceof Response) return r;
    throw r;
  }
}
