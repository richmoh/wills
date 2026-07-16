import { requireUser } from "@/lib/auth";
import { query, queryOne } from "@/lib/db";

type Params = { params: Promise<{ id: string }> };

export async function GET(_req: Request, { params }: Params) {
  try {
    const user = await requireUser();
    const { id } = await params;
    const will = await queryOne(
      `select id, label, data, status, created_at, updated_at from wills
        where id = $1 and user_id = $2`,
      [id, user.id]
    );
    if (!will) return Response.json({ error: "Not found" }, { status: 404 });
    return Response.json({ will });
  } catch (r) {
    if (r instanceof Response) return r;
    throw r;
  }
}

export async function PUT(req: Request, { params }: Params) {
  try {
    const user = await requireUser();
    const { id } = await params;
    const body = await req.json().catch(() => null);
    if (!body || typeof body.data !== "object") {
      return Response.json({ error: "Missing will data" }, { status: 400 });
    }
    const status = body.status === "complete" ? "complete" : "draft";
    const updated = await queryOne(
      `update wills set data = $1, status = $2, updated_at = now()
        where id = $3 and user_id = $4 returning id`,
      [JSON.stringify(body.data), status, id, user.id]
    );
    if (!updated) return Response.json({ error: "Not found" }, { status: 404 });
    return Response.json({ ok: true });
  } catch (r) {
    if (r instanceof Response) return r;
    throw r;
  }
}

export async function DELETE(_req: Request, { params }: Params) {
  try {
    const user = await requireUser();
    const { id } = await params;
    await query(`delete from wills where id = $1 and user_id = $2`, [id, user.id]);
    return Response.json({ ok: true });
  } catch (r) {
    if (r instanceof Response) return r;
    throw r;
  }
}
