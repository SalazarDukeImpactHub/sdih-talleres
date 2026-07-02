import crypto from "crypto";

/**
 * Crypto utilities para access keys de workshops.
 *
 * Seguridad (audit v1):
 * - Generación con entropía real: 12 chars de un alfabeto de 31 símbolos sin
 *   ambigüedad (~59 bits). Antes se filtraba base64url con [^A-Z0-9] borrando
 *   minúsculas y se rellenaba con "0000", colapsando el keyspace real.
 * - Comparación timing-safe con crypto.timingSafeEqual (antes usaba ===).
 * - Hash SHA-256 con salt por clave.
 */

// Alfabeto sin caracteres ambiguos (sin 0/O, 1/I/L) para dictado por voz/WhatsApp.
// Subconjunto de [A-Z0-9] → compatible con accessKeySchema (regex ^[A-Z0-9\-]+$).
const KEY_ALPHABET = "ABCDEFGHJKMNPQRSTUVWXYZ23456789"; // 31 símbolos
const KEY_GROUPS = 3;
const KEY_CHARS_PER_GROUP = 4; // 12 chars → 31^12 ≈ 59 bits de entropía

/**
 * Generar una clave de acceso alfanumérica con entropía criptográfica.
 * Formato: "XXXX-XXXX-XXXX" (14 chars con guiones, 12 significativos).
 * Cada carácter se elige con crypto.randomInt para evitar sesgo de módulo.
 * @returns string plaintext key
 */
export function generateAccessKeyString(): string {
  const chars: string[] = [];
  const total = KEY_GROUPS * KEY_CHARS_PER_GROUP;
  for (let i = 0; i < total; i++) {
    // randomInt(max) es uniforme en [0, max) — sin sesgo de módulo
    chars.push(KEY_ALPHABET[crypto.randomInt(KEY_ALPHABET.length)]);
  }
  const groups: string[] = [];
  for (let g = 0; g < KEY_GROUPS; g++) {
    groups.push(
      chars.slice(g * KEY_CHARS_PER_GROUP, (g + 1) * KEY_CHARS_PER_GROUP).join("")
    );
  }
  return groups.join("-");
}

/**
 * Hash una clave de acceso con salt (SHA-256).
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
 * Verificar una clave contra su hash + salt (SHA-256), timing-safe.
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
  // timingSafeEqual exige buffers de igual longitud. Ambos son SHA-256 hex
  // (64 chars) salvo que `hash` de la DB esté corrupto — en ese caso, longitudes
  // distintas → comparación falsa sin filtrar tiempo.
  const a = Buffer.from(computed, "utf8");
  const b = Buffer.from(hash, "utf8");
  if (a.length !== b.length) return false;
  return crypto.timingSafeEqual(a, b);
}
