"use client";

// Route-level error boundary. Catches any uncaught error thrown while rendering
// a page (or rejected from a form Server Action) and shows a calm, branded
// fallback instead of a raw stack trace. The full error is logged to the
// console for developers; the user only sees a generic message plus a digest
// they can quote to support.

import { useEffect } from "react";
import Link from "next/link";
import { AlertTriangle } from "lucide-react";

import { Button } from "@/components/ui/button";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-5 px-6 text-center">
      <div className="flex size-12 items-center justify-center rounded-full bg-destructive/10 text-destructive">
        <AlertTriangle className="size-6" />
      </div>
      <div className="space-y-1">
        <h1 className="text-xl font-semibold">Something went wrong</h1>
        <p className="max-w-md text-sm text-muted-foreground">
          We hit an unexpected problem loading this page. Your data is safe —
          please try again.
        </p>
        {error.digest ? (
          <p className="pt-1 font-mono text-xs text-muted-foreground/70">
            Reference: {error.digest}
          </p>
        ) : null}
      </div>
      <div className="flex flex-wrap justify-center gap-2">
        <Button onClick={reset}>Try again</Button>
        <Button asChild variant="outline">
          <Link href="/">Go to dashboard</Link>
        </Button>
      </div>
    </div>
  );
}
