import { createHash, randomBytes } from "crypto";
import { cookies } from "next/headers";
import bcrypt from "bcryptjs";
import { query, queryOne } from "./db";

const COOKIE_NAME = "wasiyyah_session";
const SESSION_DAYS = 30;

export const MIN_PASSWORD_LENGTH = 8;
/** bcrypt is deliberately slow; an upper bound stops huge inputs tying up the server. */
export const MAX_PASSWORD_LENGTH = 200;

export interface User {
  id: string;
  email: string;
  full_name: string;
  is_premium: boolean;
  stripe_customer_id: string | null;
  created_at: string;
}

/**
 * Checked on use, not at module load, so `next build` works without the
 * secret. In production a missing secret is an error rather than a silent
 * fallback to unkeyed hashes; a short one is logged, not fatal, so tightening
 * this check can never lock every signed-in user out on deploy.
 */
let warnedShortSecret = false;
function sessionSecret(): string {
  const secret = process.env.SESSION_SECRET ?? "";
  if (process.env.NODE_ENV === "production") {
    if (!secret) {
      throw new Error("SESSION_SECRET is not set — set it (openssl rand -hex 32) and restart.");
    }
    if (secret.length < 32 && !warnedShortSecret) {
      warnedShortSecret = true;
      console.warn("SESSION_SECRET is shorter than 32 characters — replace it with `openssl rand -hex 32`.");
    }
  }
  return secret;
}

/** Session and password-reset tokens are stored only as this hash. */
export const hashToken = (token: string) =>
  createHash("sha256").update(token + sessionSecret()).digest("hex");

export const newToken = () => randomBytes(32).toString("base64url");

export const hashPassword = (password: string) => bcrypt.hash(password, 10);
export const verifyPassword = (password: string, hash: string) =>
  bcrypt.compare(password, hash);

// A bcrypt hash (cost 10) of a discarded random string. Comparing against it
// when there is no account makes a login attempt take as long either way.
const DUMMY_HASH = "$2b$10$vyMu5AyzoIgVv9gidJ2JkO4E7OUVwB6k0NVtDTq.TVNo/RPJc6ww2";

/** Like verifyPassword, but does the same work when the account does not exist. */
export async function verifyPasswordOrDummy(
  password: string,
  hash: string | undefined
): Promise<boolean> {
  const matches = await bcrypt.compare(password, hash ?? DUMMY_HASH);
  return matches && hash !== undefined;
}

/** The message to show for an unacceptable new password, or null if it is fine. */
export function passwordError(password: string): string | null {
  if (password.length < MIN_PASSWORD_LENGTH) {
    return `Password must be at least ${MIN_PASSWORD_LENGTH} characters.`;
  }
  if (password.length > MAX_PASSWORD_LENGTH) {
    return `Password must be at most ${MAX_PASSWORD_LENGTH} characters.`;
  }
  return null;
}

/** Reads a field of a parsed JSON body; null unless it is a string. */
export function stringField(body: unknown, key: string): string | null {
  if (!body || typeof body !== "object") return null;
  const value = (body as Record<string, unknown>)[key];
  return typeof value === "string" ? value : null;
}

export async function createSession(userId: string): Promise<void> {
  const token = newToken();
  const expires = new Date(Date.now() + SESSION_DAYS * 24 * 3600 * 1000);
  await query(
    `insert into sessions (token_hash, user_id, expires_at) values ($1, $2, $3)`,
    [hashToken(token), userId, expires.toISOString()]
  );
  (await cookies()).set(COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    expires,
  });
}

export async function destroySession(): Promise<void> {
  const store = await cookies();
  const token = store.get(COOKIE_NAME)?.value;
  if (token) {
    await query(`delete from sessions where token_hash = $1`, [hashToken(token)]);
  }
  store.delete(COOKIE_NAME);
}

export async function getSessionUser(): Promise<User | null> {
  const token = (await cookies()).get(COOKIE_NAME)?.value;
  if (!token) return null;
  return queryOne<User>(
    `select u.id, u.email, u.full_name, u.is_premium, u.stripe_customer_id, u.created_at
       from sessions s join users u on u.id = s.user_id
      where s.token_hash = $1 and s.expires_at > now()`,
    [hashToken(token)]
  );
}

/** For API routes: returns the user or throws a 401 Response. */
export async function requireUser(): Promise<User> {
  const user = await getSessionUser();
  if (!user) {
    throw Response.json({ error: "Not signed in" }, { status: 401 });
  }
  return user;
}

export const isValidEmail = (email: string) =>
  email.length <= 254 && /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email);
