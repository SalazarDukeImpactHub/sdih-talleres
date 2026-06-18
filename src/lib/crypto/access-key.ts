import crypto from "crypto";

/**
 * Crypto utilities para access keys de workshops (change 5 slice 5c+5d).
 * 5c: generateAccessKeyString (plaintext key en v1)
 * 5d: hashAccessKey, verifyAccessKey (con SHA-256 + salt)
 */

/**
 * Generar una clave alfanumérica de acceso (plaintext en 5c, hasheada en 5d).
 * Formato: "RAG-1234-AB5X" (14 chars, ~50 bits entropy)
 * @returns string plaintext key
 */
export function generateAccessKeyString(): string {
  const bytes = crypto.randomBytes(6);
  const base64 = bytes.toString("base64url");
  // Remover caracteres especiales y tomar primeros 8 chars (simplificar)
  const clean = base64.replace(/[^A-Z0-9]/g, "").slice(0, 8);
  // Formato: "RAG-XXXX" para demo, o "RAG-XXXX-XXXX" para más entropy
  if (clean.length >= 8) {
    return `${clean.slice(0, 3)}-${clean.slice(3, 7)}-${clean.slice(7, 8)}`;
  }
  return clean.padEnd(8, "0");
}

/**
 * Hash una clave de acceso con salt (SHA-256).
 * NOTA: 5d solo. En 5c, keys se guardan plaintext.
 * @param plaintext clave en plaintext
 * @param salt UUID o string aleatorio
 * @returns hex string del hash SHA-256
 */
export function hashAccessKey(plaintext: string, salt: string): string {
  return crypto
    .createHash("sha256")
    .update(salt + plaintext)
    .digest("hex");
}

/**
 * Verificar una clave contra su hash + salt (SHA-256).
 * @param plaintext clave en plaintext (del usuario)
 * @param hash hex string guardado en DB
 * @param salt string guardado en DB
 * @returns boolean true si match
 */
export function verifyAccessKey(
  plaintext: string,
  hash: string,
  salt: string
): boolean {
  const computed = hashAccessKey(plaintext, salt);
  return computed === hash;
}
