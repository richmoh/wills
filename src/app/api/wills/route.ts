import { requireUser } from "@/lib/auth";
import { query, queryOne } from "@/lib/db";
import { emptyWillData } from "@/lib/will-types";

export async function GET() {
  try {
    const user = await requireUser();
    const wills = await query(
      `select id, label, status, created_at, updated_at from wills
        where user_id = $1 order by created_at`,
      [user.id]
    );
    return Response.json({ wills });
  } catch (r) {
    if (r instanceof Response) return r;
    throw r;
  }
}

export async function POST(req: Request) {
  try {
    const user = await requireUser();
    const body = await req.json().catch(() => ({}));
    const label = typeof body?.label === "string" && body.label.trim() ? body.label.trim() : "My will";

    if (!user.is_premium) {
      const existing = await queryOne<{ n: string }>(
        `select count(*)::text as n from wills where user_id = $1`,
        [user.id]
      );
      if (parseInt(existing!.n, 10) >= 1) {
        return Response.json(
          {
            error:
              "The free plan includes one will. Upgrade to the Complete Will Pack for unlimited wills, including a mirror will for your spouse.",
            upgradeRequired: true,
          },
          { status: 402 }
        );
      }
    }

    const will = await queryOne<{ id: string }>(
      `insert into wills (user_id, label, data) values ($1, $2, $3) returning id`,
      [user.id, label, JSON.stringify(emptyWillData())]
    );
    return Response.json({ id: will!.id });
  } catch (r) {
    if (r instanceof Response) return r;
    throw r;
  }
}
