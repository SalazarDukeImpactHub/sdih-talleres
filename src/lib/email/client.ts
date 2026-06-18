import { Resend } from "resend";

/**
 * Resend client singleton.
 *
 * Returns `null` if `RESEND_API_KEY` is not configured — the caller must
 * handle this gracefully (best-effort send pattern).
 */
let _client: Resend | null = null;

export function getResendClient(): Resend | null {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) return null;
  if (!_client) _client = new Resend(apiKey);
  return _client;
}

export function getEmailFrom(): string {
  // Default sandbox de Resend (solo manda al email registrado de la cuenta).
  // Override con EMAIL_FROM=no-reply@tudominio.com cuando se verifique el dominio.
  return process.env.EMAIL_FROM || "SDIH Talleres <onboarding@resend.dev>";
}
