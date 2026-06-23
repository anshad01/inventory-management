"use server";

import { redirect } from "next/navigation";

import { prisma } from "@/lib/db";
import { hashPassword, verifyPassword } from "@/lib/auth/password";
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

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user || !user.isActive || !verifyPassword(password, user.passwordHash)) {
    return { error: "Invalid email or password." };
  }

  await createSessionCookie(user.id);
  redirect(homePathForType(user.type));
}

/** Customer self-registration → creates a CUSTOMER account and signs in. */
export async function signupAction(
  _prev: LoginState,
  formData: FormData,
): Promise<LoginState> {
  const name = String(formData.get("name") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");

  if (!name || !email || password.length < 6) {
    return { error: "Name, email, and a password of 6+ characters are required." };
  }

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) return { error: "An account with that email already exists." };

  const user = await prisma.user.create({
    data: {
      name,
      email,
      passwordHash: hashPassword(password),
      type: "CUSTOMER",
      role: "VIEWER",
    },
  });

  await createSessionCookie(user.id);
  redirect("/shop");
}

export async function logout() {
  await destroySessionCookie();
  redirect("/login");
}
