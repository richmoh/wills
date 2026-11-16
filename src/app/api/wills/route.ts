import { requireUser } from "@/lib/auth";
import { query, queryOne } from "@/lib/db";
import { canMirror, emptyWillData, isUuid, mirrorWillData, normalizeWillData } from "@/lib/will-types";

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
    let label =
      typeof body?.label === "string" && body.label.trim() ? body.label.trim().slice(0, 80) : "My will";
    let data = emptyWillData();

    // a mirror will starts from the spouse's will, with the couple swapped over
    if (body?.mirrorOf !== undefined) {
      if (!user.is_premium) {
        return Response.json(
          { error: "A mirror will for your spouse is part of the Complete Will Pack.", upgradeRequired: true },
          { status: 402 }
        );
      }
      const source = isUuid(body.mirrorOf)
        ? await queryOne<{ data: unknown }>(
            `select data from wills where id = $1 and user_id = $2`,
            [body.mirrorOf, user.id]
          )
        : null;
      if (!source) return Response.json({ error: "Will not found." }, { status: 404 });
      const src = normalizeWillData(source.data);
      if (!canMirror(src)) {
        return Response.json(
          { error: "Add your spouse's name to your own will first, then create their mirror will." },
          { status: 400 }
        );
      }
      data = mirrorWillData(src);
      label = `Will for ${data.fullName}`.slice(0, 80);
    }

    // one statement, so two simultaneous requests cannot both pass the free-plan limit
    const will = await queryOne<{ id: string }>(
      `insert into wills (user_id, label, data)
       select $1, $2, $3
        where $4 or not exists (select 1 from wills where user_id = $1)
       returning id`,
      [user.id, label, JSON.stringify(data), user.is_premium]
    );
    if (!will) {
      return Response.json(
        {
          error:
            "The free plan includes one will. Upgrade to the Complete Will Pack for unlimited wills, including a mirror will for your spouse.",
          upgradeRequired: true,
        },
        { status: 402 }
      );
    }
    return Response.json({ id: will.id });
  } catch (r) {
    if (r instanceof Response) return r;
    throw r;
  }
}
