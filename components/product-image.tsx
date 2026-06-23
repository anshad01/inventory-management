import { ImageIcon } from "lucide-react";

import { cn } from "@/lib/utils";

/**
 * Renders a product image (data URL or path) with a graceful icon fallback when
 * none is set. Plain <img> is used deliberately: sources are user-uploaded data
 * URLs and local SVGs, which don't benefit from next/image optimization and
 * would otherwise require remotePatterns config.
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
  if (!src) {
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
    <img src={src} alt={alt} className={cn("object-cover", className)} />
  );
}
