import { requireUser } from "@/lib/auth";
import { query, queryOne } from "@/lib/db";

/** A copy of everything stored for the signed-in user, as a JSON download. */
export async function GET() {
  try {
    const user = await requireUser();
    // the password hash is deliberately left out
    const profile = await queryOne(
      `select id, email, full_name, is_premium, stripe_customer_id, consented_at, created_at
         from users where id = $1`,
      [user.id]
    );
    const wills = await query(
      `select id, label, status, data, created_at, updated_at
         from wills where user_id = $1 order by created_at`,
      [user.id]
    );
    const payments = await query(
      `select id, stripe_session_id, amount_pence, currency, status, created_at, updated_at
         from payments where user_id = $1 order by created_at`,
      [user.id]
    );

    const exportedAt = new Date().toISOString();
    return new Response(
      JSON.stringify({ exported_at: exportedAt, profile, wills, payments }, null, 2),
      {
        headers: {
          "Content-Type": "application/json; charset=utf-8",
          "Content-Disposition": `attachment; filename="wasiyyah-data-${exportedAt.slice(0, 10)}.json"`,
          "Cache-Control": "no-store",
        },
      }
    );
  } catch (r) {
    if (r instanceof Response) return r;
    throw r;
  }
}
