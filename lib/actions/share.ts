"use server";

import { randomBytes } from "crypto";

import { revalidatePath } from "next/cache";

import { prisma } from "@/lib/db";
import { checkWriter, requireWriter } from "@/lib/auth/session";
import { UserError, toUserMessage } from "@/lib/errors";
import type { ActionResult } from "@/lib/types";

type Scope = "FULL_INVENTORY" | "LOW_STOCK" | "CATEGORY";

/** Create a read-only share link with a random public token. */
export async function createShareLink(formData: FormData) {
  const actor = await requireWriter();
  const title = String(formData.get("title") ?? "").trim();
  const scope = String(formData.get("scope") ?? "FULL_INVENTORY") as Scope;
  const categoryId = String(formData.get("categoryId") ?? "").trim() || null;

  if (!title) throw new UserError("Title is required.");

  await prisma.shareLink.create({
    data: {
      token: randomBytes(12).toString("hex"),
      title,
      scope,
      categoryId: scope === "CATEGORY" ? categoryId : null,
      createdById: actor.id,
    },
  });

  revalidatePath("/share");
}

/** Revoke (deactivate) a share link. */
export async function revokeShareLink(id: string): Promise<ActionResult> {
  const auth = await checkWriter();
  if ("error" in auth) return { ok: false, error: auth.error };
  try {
    await prisma.shareLink.update({ where: { id }, data: { isActive: false } });
  } catch (e) {
    return { ok: false, error: toUserMessage(e) };
  }
  revalidatePath("/share");
  return { ok: true };
}
