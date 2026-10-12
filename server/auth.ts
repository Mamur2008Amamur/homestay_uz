import crypto from "node:crypto";
import bcrypt from "bcryptjs";
import { SignJWT, jwtVerify } from "jose";
import { and, eq, lt } from "drizzle-orm";
import { users, verificationCodes } from "../drizzle/schema.js";
import { COOKIE_NAME } from "../shared/const.js";
import { getDb } from "./db.js";
import { ENV } from "./_core/env.js";
import { getSessionCookieOptions } from "./_core/cookies.js";
import type { Request, Response } from "express";
import { sendVerificationEmail } from "./verification.js";

const COMMON_WEAK_PASSWORDS = [
  "password",
  "password123",
  "qwerty",
  "12345678",
  "welcome",
  "letmein",
  "admin",
  "test1234",
  "iloveyou",
];

const LOGIN_FAILURE_WINDOW_MS = 15 * 60 * 1000;
const LOGIN_FAILURE_LIMIT = 5;
const LOGIN_RATE_LIMITS = new Map<string, { count: number; windowStart: number }>();

export type AuthenticatedUser = {
  id: number;
  name: string | null;
  email: string | null;
  role: "user" | "host" | "admin";
  emailVerifiedAt: Date | null;
  passwordChangedAt: Date | null;
  loginMethod: string | null;
  createdAt: Date;
  updatedAt: Date;
  lastSignedIn: Date;
};

const memoryUsers = new Map<string, { id: number; name: string; email: string; passwordHash: string; emailVerifiedAt: Date | null; passwordChangedAt: Date | null; role: "user" | "host" | "admin"; createdAt: Date; updatedAt: Date; lastSignedIn: Date; loginMethod: string | null; }>();
let memoryUserId = 1;

export function normalizeEmail(email: string): string {
  return String(email || "").trim().toLowerCase();
}

export function isStrongPassword(password: string): boolean {
  const value = String(password || "");
  if (value.length < 8) return false;
  if (/\s/.test(value)) return false;
  if (/[A-Z]/.test(value) && /[a-z]/.test(value) && /\d/.test(value) && /[^A-Za-z0-9]/.test(value)) {
    const normalized = value.toLowerCase();
    return !COMMON_WEAK_PASSWORDS.some((weak) => normalized.includes(weak));
  }
  return false;
}

export function getPasswordHashCost(): number {
  const fallback = process.env.NODE_ENV === "test" ? 8 : 12;
  const parsed = Number(process.env.BCRYPT_ROUNDS ?? fallback);
  if (!Number.isInteger(parsed) || parsed < 8 || parsed > 15) {
    return fallback;
  }
  return parsed;
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, getPasswordHashCost());
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

function hashCode(value: string): string {
  return crypto.createHash("sha256").update(value).digest("hex");
}

export function getJwtSecret(): Uint8Array {
  const secret = ENV.cookieSecret || process.env.JWT_SECRET || "";
  if (!secret) {
    throw new Error("JWT_SECRET is required.");
  }
  if (process.env.NODE_ENV === "production" && secret.length < 32) {
    throw new Error("JWT_SECRET must be at least 32 characters in production.");
  }
  return new TextEncoder().encode(secret);
}

export async function createSessionToken(user: { id: number; role: string; passwordChangedAt: Date | null }) {
  const payload = {
    sub: String(user.id),
    role: user.role,
    passwordChangedAt: user.passwordChangedAt ? user.passwordChangedAt.toISOString() : null,
    type: "uyjoy-auth",
  };

  return new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256", typ: "JWT" })
    .setIssuedAt()
    .setExpirationTime("30d")
    .sign(getJwtSecret());
}

export async function decodeSessionToken(token: string) {
  const { payload } = await jwtVerify(token, getJwtSecret(), { algorithms: ["HS256"] });
  if (!payload.sub || payload.type !== "uyjoy-auth") {
    throw new Error("Invalid session token.");
  }
  return {
    userId: Number(payload.sub),
    role: String(payload.role || "user"),
    passwordChangedAt: payload.passwordChangedAt ? new Date(String(payload.passwordChangedAt)) : null,
  };
}

export function setSessionCookie(res: Response, req: Request, token: string) {
  const options = getSessionCookieOptions(req);
  res.cookie(COOKIE_NAME, token, {
    ...options,
    maxAge: 1000 * 60 * 60 * 24 * 30,
    secure: options.secure,
  });
}

export function clearSessionCookie(res: Response, req: Request) {
  const options = getSessionCookieOptions(req);
  res.clearCookie(COOKIE_NAME, { ...options, maxAge: -1 });
}

export async function findUserByEmail(email: string) {
  const normalized = normalizeEmail(email);
  const db = await getDb();
  if (!db) {
    return memoryUsers.get(normalized) ?? null;
  }

  const row = (await db.select().from(users).where(eq(users.email, normalized)).limit(1))[0];
  if (!row) return null;

  return {
    id: row.id,
    name: row.name,
    email: row.email,
    passwordHash: row.passwordHash,
    emailVerifiedAt: row.emailVerifiedAt ?? null,
    passwordChangedAt: row.passwordChangedAt ?? null,
    role: (row.role as "user" | "host" | "admin") ?? "user",
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
    lastSignedIn: row.lastSignedIn,
    loginMethod: row.loginMethod,
  };
}

async function saveUser(user: {
  id: number;
  name: string;
  email: string;
  passwordHash: string;
  emailVerifiedAt: Date | null;
  passwordChangedAt: Date | null;
  role: "user" | "host" | "admin";
  loginMethod: string | null;
}) {
  const db = await getDb();
  if (!db) {
    memoryUsers.set(user.email, { ...user, createdAt: new Date(), updatedAt: new Date(), lastSignedIn: new Date() });
    return user;
  }

  const result = await db.insert(users).values({
    openId: `email_${user.email}_${user.id}`,
    name: user.name,
    email: user.email,
    passwordHash: user.passwordHash,
    emailVerifiedAt: user.emailVerifiedAt,
    passwordChangedAt: user.passwordChangedAt,
    role: user.role,
    loginMethod: user.loginMethod,
    lastSignedIn: new Date(),
  });

  return { ...user, id: Number(result[0].insertId || user.id) };
}

export async function registerWithEmail(input: {
  name: string;
  email: string;
  password: string;
}): Promise<{ ok: true; userId: number; hash: string } | { ok: false; error: string }> {
  const trimmedName = String(input.name || "").trim();
  const email = normalizeEmail(input.email);
  const password = String(input.password || "");

  if (!trimmedName) return { ok: false, error: "Name is required." };
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return { ok: false, error: "Valid email is required." };
  if (!isStrongPassword(password)) return { ok: false, error: "Use at least 8 characters with uppercase, lowercase, number and symbol." };

  const existing = await findUserByEmail(email);
  if (existing) {
    return { ok: false, error: "An account with this email already exists." };
  }

  const hash = await hashPassword(password);
  const userId = memoryUsers.size + 1;
  const user = {
    id: userId,
    name: trimmedName,
    email,
    passwordHash: hash,
    emailVerifiedAt: new Date(),
    passwordChangedAt: new Date(),
    role: "user" as const,
    loginMethod: "email",
  };

  const db = await getDb();
  if (db) {
    const result = await db.insert(users).values({
      openId: `email_${email}_${userId}`,
      name: user.name,
      email: user.email,
      passwordHash: user.passwordHash,
      role: "user",
      loginMethod: "email",
      emailVerifiedAt: new Date(),
      passwordChangedAt: new Date(),
      lastSignedIn: new Date(),
    });
    user.id = Number(result[0].insertId || userId);
  } else {
    memoryUsers.set(email, { ...user, createdAt: new Date(), updatedAt: new Date(), lastSignedIn: new Date() });
  }

  return { ok: true, userId: user.id, hash };
}

export async function requestEmailVerificationForUser(userId: number, email: string) {
  const normalized = normalizeEmail(email);
  const code = String(crypto.randomInt(100000, 1000000)).padStart(6, "0");
  const db = await getDb();

  if (db) {
    const latestRecent = await db.select().from(verificationCodes).where(and(eq(verificationCodes.userId, userId), eq(verificationCodes.email, normalized))).orderBy(verificationCodes.createdAt);
    const items = latestRecent.filter((item) => item.createdAt && Date.now() - item.createdAt.getTime() < 60 * 60 * 1000);
    if (items.length >= 5) {
      throw new Error("Too many verification codes requested for this email. Please wait an hour and try again.");
    }
    const existing = await db.select().from(verificationCodes).where(and(eq(verificationCodes.userId, userId), eq(verificationCodes.email, normalized))).orderBy(verificationCodes.createdAt).limit(1);
    if (existing[0] && existing[0].createdAt && Date.now() - existing[0].createdAt.getTime() < 60_000) {
      throw new Error("Please wait 60 seconds before requesting a new code.");
    }
  }

  const expiresAt = new Date(Date.now() + 10 * 60 * 1000);
  const db2 = await getDb();
  if (db2) {
    await db2.insert(verificationCodes).values({
      userId,
      email: normalized,
      codeHash: hashCode(code),
      expiresAt,
    });
  }

  try {
    await sendVerificationEmail(normalized, code);
  } catch (error) {
    throw new Error("Email could not be sent. Please check your SMTP configuration.");
  }

  return { sent: true, expiresInSeconds: 600 };
}

export async function verifyEmailForUser(userId: number, email: string, code: string) {
  const normalized = normalizeEmail(email);
  const db = await getDb();

  if (!db) {
    const user = memoryUsers.get(normalized);
    if (!user || user.id !== userId) throw new Error("Account not found.");
    return { ok: true };
  }

  const latest = (await db.select().from(verificationCodes).where(and(eq(verificationCodes.userId, userId), eq(verificationCodes.email, normalized))).orderBy(verificationCodes.createdAt).limit(1))[0];
  if (!latest) throw new Error("Verification code not found.");
  if (latest.expiresAt.getTime() < Date.now()) throw new Error("Verification code expired.");
  if (latest.verifiedAt) throw new Error("Verification code already used.");
  if (latest.codeHash !== hashCode(code)) throw new Error("Incorrect verification code.");

  await db.update(verificationCodes).set({ verifiedAt: new Date() }).where(eq(verificationCodes.id, latest.id));
  await db.update(users).set({ emailVerifiedAt: new Date() }).where(eq(users.id, userId));

  return { ok: true };
}

export async function loginWithEmail(input: { email: string; password: string; ip?: string }) {
  const email = normalizeEmail(input.email);
  const password = String(input.password || "");

  const key = `${email}:${input.ip || "unknown"}`;
  const now = Date.now();
  const record = LOGIN_RATE_LIMITS.get(key);
  if (record && now - record.windowStart < LOGIN_FAILURE_WINDOW_MS && record.count >= LOGIN_FAILURE_LIMIT) {
    return { ok: false as const, error: "Too many login attempts. Please try again later." };
  }

  const user = await findUserByEmail(email);
  if (!user || !user.passwordHash) {
    const prior = LOGIN_RATE_LIMITS.get(key) ?? { count: 0, windowStart: now };
    prior.count += 1;
    if (now - prior.windowStart >= LOGIN_FAILURE_WINDOW_MS) {
      prior.windowStart = now;
      prior.count = 1;
    }
    LOGIN_RATE_LIMITS.set(key, prior);
    return { ok: false as const, error: "Invalid email or password." };
  }

  const match = await verifyPassword(password, user.passwordHash);
  if (!match) {
    const prior = LOGIN_RATE_LIMITS.get(key) ?? { count: 0, windowStart: now };
    prior.count += 1;
    if (now - prior.windowStart >= LOGIN_FAILURE_WINDOW_MS) {
      prior.windowStart = now;
      prior.count = 1;
    }
    LOGIN_RATE_LIMITS.set(key, prior);
    return { ok: false as const, error: "Invalid email or password." };
  }

  LOGIN_RATE_LIMITS.delete(key);

  const db = await getDb();
  if (db) {
    await db.update(users).set({ lastSignedIn: new Date() }).where(eq(users.id, user.id));
  }

  return {
    ok: true as const,
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      emailVerifiedAt: user.emailVerifiedAt,
      passwordChangedAt: user.passwordChangedAt,
      loginMethod: user.loginMethod,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
      lastSignedIn: user.lastSignedIn,
    },
  };
}

export async function requestPasswordReset(email: string) {
  const normalized = normalizeEmail(email);
  const user = await findUserByEmail(normalized);
  if (!user) {
    return { ok: true as const, sent: false };
  }

  const code = String(crypto.randomInt(100000, 1000000)).padStart(6, "0");
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000);
  const db = await getDb();
  if (db) {
    await db.insert(verificationCodes).values({
      userId: user.id,
      email: normalized,
      codeHash: hashCode(code),
      expiresAt,
    });
  }

  try {
    await sendVerificationEmail(normalized, code);
  } catch {
    return { ok: false as const, error: "Could not send reset email." };
  }

  return { ok: true as const, sent: true };
}

export async function resetPasswordWithCode(input: { email: string; code: string; password: string }) {
  const normalized = normalizeEmail(input.email);
  if (!isStrongPassword(input.password)) {
    return { ok: false as const, error: "Use at least 8 characters with uppercase, lowercase, number and symbol." };
  }

  const user = await findUserByEmail(normalized);
  if (!user) return { ok: false as const, error: "Invalid email or password reset code." };

  const db = await getDb();
  if (!db) {
    return { ok: false as const, error: "Password reset is unavailable without database access." };
  }

  const latest = (await db.select().from(verificationCodes).where(and(eq(verificationCodes.userId, user.id), eq(verificationCodes.email, normalized))).orderBy(verificationCodes.createdAt).limit(1))[0];
  if (!latest) return { ok: false as const, error: "Invalid email or password reset code." };
  if (latest.expiresAt.getTime() < Date.now()) return { ok: false as const, error: "This reset code has expired." };
  if (latest.verifiedAt) return { ok: false as const, error: "This reset code has already been used." };
  if (latest.codeHash !== hashCode(input.code)) return { ok: false as const, error: "Invalid email or password reset code." };

  const hash = await hashPassword(input.password);
  await db.update(users).set({ passwordHash: hash, passwordChangedAt: new Date() }).where(eq(users.id, user.id));
  await db.update(verificationCodes).set({ verifiedAt: new Date() }).where(eq(verificationCodes.id, latest.id));

  return { ok: true as const };
}

export async function loadUserFromToken(token: string) {
  const payload = await decodeSessionToken(token);
  const db = await getDb();
  if (!db) {
    for (const user of Array.from(memoryUsers.values())) {
      if (user.id === payload.userId) {
        if (payload.passwordChangedAt && user.passwordChangedAt && payload.passwordChangedAt.getTime() < user.passwordChangedAt.getTime()) {
          throw new Error("Session is no longer valid.");
        }
        return { ...user, passwordHash: undefined };
      }
    }
    return null;
  }

  const row = (await db.select().from(users).where(eq(users.id, payload.userId)).limit(1))[0];
  if (!row) return null;
  if (payload.passwordChangedAt && row.passwordChangedAt && payload.passwordChangedAt.getTime() < row.passwordChangedAt.getTime()) {
    throw new Error("Session is no longer valid.");
  }

  return {
    id: row.id,
    name: row.name,
    email: row.email,
    role: row.role,
    emailVerifiedAt: row.emailVerifiedAt ?? null,
    passwordChangedAt: row.passwordChangedAt ?? null,
    loginMethod: row.loginMethod,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
    lastSignedIn: row.lastSignedIn,
    passwordHash: row.passwordHash,
  };
}
