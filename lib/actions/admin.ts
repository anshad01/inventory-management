"use server";

import { revalidatePath } from "next/cache";

import { prisma } from "@/lib/db";
import { notify } from "@/lib/services/notify";
import { getCurrentUser } from "@/lib/auth/session";
import type { ActionResult } from "@/lib/types";

/** Throw-free admin guard for ActionResult-returning admin actions. */
async function requireAdminUser(): Promise<
  { id: string } | { error: string }
> {
  const user = await getCurrentUser();
  if (!user) return { error: "You are not signed in." };
  if (user.type !== "STAFF" || user.role !== "ADMIN") {
    return { error: "Only admins can manage users." };
  }
  return { id: user.id };
}

/** Approve (or unapprove) a supplier account so it can list products. */
export async function setSupplierApproval(
  userId: string,
  approved: boolean,
): Promise<ActionResult> {
  const admin = await requireAdminUser();
  if ("error" in admin) return { ok: false, error: admin.error };

  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user || user.type !== "SUPPLIER") {
    return { ok: false, error: "That account is not a supplier." };
  }

  await prisma.user.update({ where: { id: userId }, data: { isApproved: approved } });

  if (approved) {
    await notify(prisma, {
      userId,
      type: "SUPPLIER_APPROVAL",
      message: "Your supplier account has been approved — you can now list products.",
      href: "/portal/products",
    });
  }

  revalidatePath("/settings/users");
  return { ok: true };
}

/** Activate / deactivate any account. */
export async function setUserActive(
  userId: string,
  active: boolean,
): Promise<ActionResult> {
  const admin = await requireAdminUser();
  if ("error" in admin) return { ok: false, error: admin.error };
  if (userId === admin.id) {
    return { ok: false, error: "You can't deactivate your own account." };
  }

  await prisma.user.update({ where: { id: userId }, data: { isActive: active } });
  revalidatePath("/settings/users");
  return { ok: true };
}

/** Change a STAFF account's role (ADMIN / STAFF / VIEWER). */
export async function setStaffRole(
  userId: string,
  role: "ADMIN" | "STAFF" | "VIEWER",
): Promise<ActionResult> {
  const admin = await requireAdminUser();
  if ("error" in admin) return { ok: false, error: admin.error };

  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user || user.type !== "STAFF") {
    return { ok: false, error: "Roles apply to staff accounts only." };
  }
  if (userId === admin.id && role !== "ADMIN") {
    return { ok: false, error: "You can't remove your own admin role." };
  }

  await prisma.user.update({ where: { id: userId }, data: { role } });
  revalidatePath("/settings/users");
  return { ok: true };
}
