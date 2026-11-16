import { requireUser } from "@/lib/auth";
import { query, queryOne } from "@/lib/db";
import { firstIncompleteStep } from "@/lib/interview";
import { isUuid, normalizeWillData } from "@/lib/will-types";

type Params = { params: Promise<{ id: string }> };

const notFound = () => Response.json({ error: "Not found" }, { status: 404 });

/** The largest set of answers the API will store (a long letter of wishes fits comfortably). */
const MAX_BODY_CHARS = 100_000;

export async function GET(_req: Request, { params }: Params) {
  try {
    const user = await requireUser();
    const { id } = await params;
    if (!isUuid(id)) return notFound();
    const will = await queryOne(
      `select id, label, data, status, created_at, updated_at from wills
        where id = $1 and user_id = $2`,
      [id, user.id]
    );
    if (!will) return notFound();
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
    if (!isUuid(id)) return notFound();

    const text = await req.text();
    if (text.length > MAX_BODY_CHARS) {
      return Response.json({ error: "That is more than a will can hold." }, { status: 413 });
    }
    let body: { data?: unknown; status?: unknown } | null = null;
    try {
      body = JSON.parse(text);
    } catch {}
    if (!body || typeof body.data !== "object" || body.data === null || Array.isArray(body.data)) {
      return Response.json({ error: "Missing will data" }, { status: 400 });
    }

    // stored answers always have the full, well-typed shape
    const data = normalizeWillData(body.data);
    const status = body.status === "complete" ? "complete" : "draft";
    if (status === "complete") {
      const missing = firstIncompleteStep(data, user.is_premium);
      if (missing) return Response.json({ error: missing.message, step: missing.id }, { status: 400 });
    }

    const updated = await queryOne(
      `update wills set data = $1, status = $2, updated_at = now()
        where id = $3 and user_id = $4 returning id`,
      [JSON.stringify(data), status, id, user.id]
    );
    if (!updated) return notFound();
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
    if (!isUuid(id)) return notFound();
    await query(`delete from wills where id = $1 and user_id = $2`, [id, user.id]);
    return Response.json({ ok: true });
  } catch (r) {
    if (r instanceof Response) return r;
    throw r;
  }
}
