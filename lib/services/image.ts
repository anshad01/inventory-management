// Product image handling (SPEC §7). Uploaded files are stored inline as
// base64 data URLs on Product.imageUrl. This keeps the app fully
// self-contained — no object storage / bucket config — which matters on
// ephemeral serverless hosts where the local filesystem isn't writable or
// persistent. The trade-off is row size, so we cap the accepted file size.

import { UserError } from "@/lib/errors";

const MAX_BYTES = 1_000_000; // 1 MB
const ALLOWED = ["image/png", "image/jpeg", "image/webp", "image/gif"];

/**
 * Turn an uploaded image File into a data URL, or return null if no file was
 * provided. Throws a user-facing error for invalid type / oversized files.
 */
export async function fileToDataUrl(
  file: FormDataEntryValue | null,
): Promise<string | null> {
  if (!file || typeof file === "string") return null;
  // Empty file input submits a zero-byte File.
  if (file.size === 0) return null;

  if (!ALLOWED.includes(file.type)) {
    throw new UserError("Image must be a PNG, JPEG, WebP, or GIF.");
  }
  if (file.size > MAX_BYTES) {
    throw new UserError("Image must be 1 MB or smaller.");
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  return `data:${file.type};base64,${buffer.toString("base64")}`;
}
