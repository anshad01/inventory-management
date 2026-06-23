import { createHmac, timingSafeEqual } from "crypto";
import { cache } from "react";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { prisma } from "@/lib/db";

// Lightweight session auth in the data layer (per Next 16 guidance: do
// authorization in the data layer, not in proxy/middleware). The session is an
// HMAC-signed cookie carrying the user id.

const COOKIE = "session";
const MAX_AGE = 60 * 60 * 24 * 7; // 7 days
const secret = process.env.AUTH_SECRET || "dev-insecure-secret-change-me";

export type AccountType = "STAFF" | "SUPPLIER" | "CUSTOMER";

export type SessionUser = {
  id: string;
  name: string;
  email: string;
  type: AccountType;
  role: "ADMIN" | "STAFF" | "VIEWER";
  supplierId: string | null;
};

/** Where each account type lands after login. */
export function homePathForType(type: AccountType): string {
  if (type === "SUPPLIER") return "/portal";
  if (type === "CUSTOMER") return "/shop";
  return "/";
}

function sign(userId: string): string {
  const payload = Buffer.from(JSON.stringify({ uid: userId })).toString(
    "base64url",
  );
  const sig = createHmac("sha256", secret).update(payload).digest("base64url");
  return `${payload}.${sig}`;
}

function verify(token: string): string | null {
  const [payload, sig] = token.split(".");
  if (!payload || !sig) return null;
  const expected = createHmac("sha256", secret)
    .update(payload)
    .digest("base64url");
  const a = Buffer.from(sig);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null;
  try {
    return JSON.parse(Buffer.from(payload, "base64url").toString()).uid ?? null;
  } catch {
    return null;
  }
}

export async function createSessionCookie(userId: string) {
  const store = await cookies();
  store.set(COOKIE, sign(userId), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: MAX_AGE,
  });
}

export async function destroySessionCookie() {
  const store = await cookies();
  store.delete(COOKIE);
}

// Cached per request so multiple callers share one DB lookup.
export const getCurrentUser = cache(async (): Promise<SessionUser | null> => {
  const store = await cookies();
  const token = store.get(COOKIE)?.value;
  if (!token) return null;
  const uid = verify(token);
  if (!uid) return null;
  const user = await prisma.user.findUnique({
    where: { id: uid },
    select: {
      id: true,
      name: true,
      email: true,
      type: true,
      role: true,
      supplierId: true,
      isActive: true,
    },
  });
  if (!user || !user.isActive) return null;
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    type: user.type,
    role: user.role,
    supplierId: user.supplierId,
  };
});

/** Require an authenticated user; redirect to /login otherwise. */
export async function requireUser(): Promise<SessionUser> {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  return user;
}

/** Require a STAFF account; send other account types to their own home. */
export async function requireStaff(): Promise<SessionUser> {
  const user = await requireUser();
  if (user.type !== "STAFF") redirect(homePathForType(user.type));
  return user;
}

/** Require a SUPPLIER account (with a linked supplier). */
export async function requireSupplier(): Promise<SessionUser> {
  const user = await requireUser();
  if (user.type !== "SUPPLIER" || !user.supplierId) {
    redirect(homePathForType(user.type));
  }
  return user;
}

/** Require a CUSTOMER account. */
export async function requireCustomer(): Promise<SessionUser> {
  const user = await requireUser();
  if (user.type !== "CUSTOMER") redirect(homePathForType(user.type));
  return user;
}

/** Require a staff user who can write (ADMIN or STAFF role, not VIEWER). Use in
 * form actions that redirect on success. */
export async function requireWriter(): Promise<SessionUser> {
  const user = await requireUser();
  if (user.type !== "STAFF" || user.role === "VIEWER") {
    throw new Error("Your account cannot perform this action.");
  }
  return user;
}

/** Non-throwing writer check for actions that return an ActionResult. */
export async function checkWriter(): Promise<
  { user: SessionUser } | { error: string }
> {
  const user = await getCurrentUser();
  if (!user) return { error: "You are not signed in." };
  if (user.type !== "STAFF" || user.role === "VIEWER") {
    return { error: "Your account cannot perform this action." };
  }
  return { user };
}
