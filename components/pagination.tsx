import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";

import { cn } from "@/lib/utils";

/**
 * Prev/next pagination. `makeHref` builds the URL for a given page; rendered
 * from a Server Component so the function is never sent to the client.
 */
export function Pagination({
  page,
  pageCount,
  makeHref,
}: {
  page: number;
  pageCount: number;
  makeHref: (page: number) => string;
}) {
  if (pageCount <= 1) return null;

  const linkCls =
    "inline-flex h-9 items-center gap-1 rounded-md border px-3 text-sm font-medium transition-colors hover:bg-accent";
  const disabledCls = "pointer-events-none opacity-50";

  return (
    <nav className="mt-4 flex items-center justify-between" aria-label="Pagination">
      <Link
        href={makeHref(page - 1)}
        className={cn(linkCls, page <= 1 && disabledCls)}
        aria-disabled={page <= 1}
      >
        <ChevronLeft className="size-4" /> Previous
      </Link>
      <span className="text-sm text-muted-foreground">
        Page {page} of {pageCount}
      </span>
      <Link
        href={makeHref(page + 1)}
        className={cn(linkCls, page >= pageCount && disabledCls)}
        aria-disabled={page >= pageCount}
      >
        Next <ChevronRight className="size-4" />
      </Link>
    </nav>
  );
}
