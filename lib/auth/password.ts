import { scryptSync, randomBytes, timingSafeEqual } from "crypto";

// Password hashing with Node's built-in scrypt — no native dependency. Format:
// "scrypt$<salt-hex>$<hash-hex>". Used by the seed and the login action.

export function hashPassword(password: string): string {
  const salt = randomBytes(16).toString("hex");
  const hash = scryptSync(password, salt, 64).toString("hex");
  return `scrypt$${salt}$${hash}`;
}

export function verifyPassword(password: string, stored: string): boolean {
  const [scheme, salt, hash] = stored.split("$");
  if (scheme !== "scrypt" || !salt || !hash) return false;
  const expected = Buffer.from(hash, "hex");
  const actual = scryptSync(password, salt, 64);
  return (
    expected.length === actual.length && timingSafeEqual(expected, actual)
  );
}
