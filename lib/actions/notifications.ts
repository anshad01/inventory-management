"use server";

import { revalidatePath } from "next/cache";

import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth/session";
import type { ActionResult } from "@/lib/types";

/** Mark all of the current user's notifications as read. */
export async function markAllNotificationsRead(): Promise<ActionResult> {
  const user = await getCurrentUser();
  if (!user) return { ok: false, error: "You are not signed in." };

  await prisma.notification.updateMany({
    where: { userId: user.id, isRead: false },
    data: { isRead: true },
  });

  revalidatePath("/");
  revalidatePath("/shop");
  revalidatePath("/portal");
  return { ok: true };
}
