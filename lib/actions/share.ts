"use server";

import { randomBytes } from "crypto";

import { revalidatePath } from "next/cache";

import { prisma } from "@/lib/db";
import type { ActionResult } from "@/lib/types";

const SEED_USER_ID = "u_priya";

type Scope = "FULL_INVENTORY" | "LOW_STOCK" | "CATEGORY";

/** Create a read-only share link with a random public token. */
export async function createShareLink(formData: FormData) {
  const title = String(formData.get("title") ?? "").trim();
  const scope = String(formData.get("scope") ?? "FULL_INVENTORY") as Scope;
  const categoryId = String(formData.get("categoryId") ?? "").trim() || null;

  if (!title) throw new Error("Title is required.");

  await prisma.shareLink.create({
    data: {
      token: randomBytes(12).toString("hex"),
      title,
      scope,
      categoryId: scope === "CATEGORY" ? categoryId : null,
      createdById: SEED_USER_ID,
    },
  });

  revalidatePath("/share");
}

/** Revoke (deactivate) a share link. */
export async function revokeShareLink(id: string): Promise<ActionResult> {
  try {
    await prisma.shareLink.update({ where: { id }, data: { isActive: false } });
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Failed." };
  }
  revalidatePath("/share");
  return { ok: true };
}
