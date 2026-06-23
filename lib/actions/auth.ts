"use server";

import { redirect } from "next/navigation";

import { prisma } from "@/lib/db";
import { verifyPassword } from "@/lib/auth/password";
import { createSessionCookie, destroySessionCookie } from "@/lib/auth/session";

export type LoginState = { error: string } | null;

/** Authenticate with email + password and start a session. */
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
  redirect("/");
}

export async function logout() {
  await destroySessionCookie();
  redirect("/login");
}
