"use server";

import { redirect } from "next/navigation";

import { prisma } from "@/lib/db";
import { hashPassword, verifyPassword } from "@/lib/auth/password";
import { checkRateLimit } from "@/lib/rate-limit";
import {
  createSessionCookie,
  destroySessionCookie,
  homePathForType,
} from "@/lib/auth/session";

export type LoginState = { error: string } | null;

/** Authenticate with email + password and start a session. Routes each account
 * type to its own area. */
export async function loginAction(
  _prev: LoginState,
  formData: FormData,
): Promise<LoginState> {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");

  // Throttle credential-stuffing attempts per email.
  if (email && !checkRateLimit(`login:${email}`, 10, 60_000)) {
    return { error: "Too many attempts. Please wait a minute and try again." };
  }

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user || !user.isActive || !verifyPassword(password, user.passwordHash)) {
    return { error: "Invalid email or password." };
  }

  await createSessionCookie(user.id);
  redirect(homePathForType(user.type));
}

/**
 * Self-registration. Customers get instant access; suppliers create a linked
 * Supplier record but start unapproved (an admin must approve before they can
 * list products — SPEC bonus: supplier approval workflow).
 */
export async function signupAction(
  _prev: LoginState,
  formData: FormData,
): Promise<LoginState> {
  const name = String(formData.get("name") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");
  const accountType =
    String(formData.get("accountType") ?? "CUSTOMER") === "SUPPLIER"
      ? "SUPPLIER"
      : "CUSTOMER";
  const businessName = String(formData.get("businessName") ?? "").trim();

  if (!name || !email || password.length < 6) {
    return { error: "Name, email, and a password of 6+ characters are required." };
  }
  if (accountType === "SUPPLIER" && !businessName) {
    return { error: "Please enter your business name." };
  }
  if (email && !checkRateLimit(`signup:${email}`, 5, 60_000)) {
    return { error: "Too many attempts. Please wait a minute and try again." };
  }

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) return { error: "An account with that email already exists." };

  let userId: string;

  if (accountType === "SUPPLIER") {
    const created = await prisma.$transaction(async (tx) => {
      const supplier = await tx.supplier.create({
        data: { name: businessName, email },
      });
      return tx.user.create({
        data: {
          name,
          email,
          passwordHash: hashPassword(password),
          type: "SUPPLIER",
          role: "VIEWER",
          supplierId: supplier.id,
          isApproved: false, // pending admin approval
        },
      });
    });
    userId = created.id;

    // Let admins know a supplier is waiting for approval.
    const admins = await prisma.user.findMany({
      where: { type: "STAFF", role: "ADMIN", isActive: true },
      select: { id: true },
    });
    for (const a of admins) {
      await prisma.notification.create({
        data: {
          userId: a.id,
          type: "SUPPLIER_APPROVAL",
          message: `New supplier "${businessName}" is awaiting approval.`,
          href: "/settings/users",
        },
      });
    }
  } else {
    const user = await prisma.user.create({
      data: {
        name,
        email,
        passwordHash: hashPassword(password),
        type: "CUSTOMER",
        role: "VIEWER",
      },
    });
    userId = user.id;
  }

  await createSessionCookie(userId);
  redirect(accountType === "SUPPLIER" ? "/portal/products" : "/shop");
}

export async function logout() {
  await destroySessionCookie();
  redirect("/login");
}
