import crypto from "crypto";

const ALPHABET = "abcdefghjkmnpqrstuvwxyz23456789"; // Removed ambiguous chars like 0, o, 1, l, i

export function generateShortId(length = 7): string {
  const bytes = crypto.randomBytes(length);
  let result = "";
  for (let i = 0; i < length; i++) {
    result += ALPHABET[bytes[i] % ALPHABET.length];
  }
  return result;
}
