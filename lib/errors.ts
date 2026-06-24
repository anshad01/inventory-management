// Centralised error helpers so Server Actions never leak technical or Prisma
// internals to end users. Throw `UserError` for messages that are safe and
// meaningful to show; everything else is logged for developers and reported to
// the user as a single generic message via `toUserMessage`.

const GENERIC_MESSAGE = "Something went wrong. Please try again.";

/** An error whose message is intended to be shown directly to the user. */
export class UserError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "UserError";
  }
}

/**
 * Next.js implements `redirect()` and `notFound()` by throwing a tagged error.
 * Those must propagate, never be swallowed by a catch-and-report block.
 */
function isNextControlFlow(e: unknown): boolean {
  if (typeof e !== "object" || e === null || !("digest" in e)) return false;
  const digest = (e as { digest?: unknown }).digest;
  return (
    typeof digest === "string" &&
    (digest.startsWith("NEXT_REDIRECT") ||
      digest === "NEXT_NOT_FOUND" ||
      digest.startsWith("NEXT_HTTP_ERROR_FALLBACK"))
  );
}

/**
 * Map any caught value to a user-facing string. Intentional `UserError`
 * messages pass through unchanged; anything else (Prisma errors, bugs, network
 * failures, …) is logged server-side and replaced with a generic message so
 * internal details never reach the browser. Next.js control-flow errors are
 * re-thrown so redirects and 404s keep working.
 */
export function toUserMessage(e: unknown, fallback = GENERIC_MESSAGE): string {
  if (isNextControlFlow(e)) throw e;
  if (e instanceof UserError) return e.message;
  console.error("[action error]", e);
  return fallback;
}
