import { createHash, randomBytes } from "crypto";
import { cookies } from "next/headers";
import bcrypt from "bcryptjs";
import { query, queryOne } from "./db";

const COOKIE_NAME = "wasiyyah_session";
const SESSION_DAYS = 30;

export interface User {
  id: string;
  email: string;
  full_name: string;
  is_premium: boolean;
  stripe_customer_id: string | null;
  created_at: string;
}

const hashToken = (token: string) =>
  createHash("sha256").update(token + (process.env.SESSION_SECRET ?? "")).digest("hex");

export const hashPassword = (password: string) => bcrypt.hash(password, 10);
export const verifyPassword = (password: string, hash: string) =>
  bcrypt.compare(password, hash);

export async function createSession(userId: string): Promise<void> {
  const token = randomBytes(32).toString("base64url");
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
  /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email);
