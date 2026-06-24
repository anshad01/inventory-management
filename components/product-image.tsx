"use client";

import { useState } from "react";
import { ImageIcon } from "lucide-react";

import { cn } from "@/lib/utils";

/**
 * Renders a product image (data URL, local SVG, or remote CDN photo) with a
 * graceful icon fallback. The fallback shows both when no source is set and if
 * the image fails to load at runtime (e.g. a remote photo 404s), so the UI
 * never displays a broken-image glyph.
 *
 * Plain <img> is used deliberately: sources include user-uploaded data URLs,
 * which don't benefit from next/image optimization.
 */
export function ProductImage({
  src,
  alt,
  className,
}: {
  src?: string | null;
  alt: string;
  className?: string;
}) {
  const [failed, setFailed] = useState(false);

  if (!src || failed) {
    return (
      <div
        className={cn(
          "flex items-center justify-center bg-muted text-muted-foreground",
          className,
        )}
        aria-hidden
      >
        <ImageIcon className="size-1/3" />
      </div>
    );
  }
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt={alt}
      loading="lazy"
      onError={() => setFailed(true)}
      className={cn("object-cover", className)}
    />
  );
}
