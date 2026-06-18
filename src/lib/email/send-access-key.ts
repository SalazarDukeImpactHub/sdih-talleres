import { render } from "@react-email/render";
import { getResendClient, getEmailFrom } from "./client";
import AccessKeyEmail from "./templates/AccessKeyEmail";

export interface SendAccessKeyEmailParams {
  to: string;
  name: string;
  accessKey: string;
  workshopTitle: string;
  loginEmail: string;
  passwordTemp: string;
  baseUrl: string;
}

export interface SendAccessKeyResult {
  ok: boolean;
  messageId?: string;
  error?: string;
}

/**
 * Manda el email de acceso a un alumno recién creado.
 *
 * Comportamiento:
 * - Mode `mock` (tests/e2e): retorna OK sin tocar Resend.
 * - Si `RESEND_API_KEY` falta: retorna error explicativo (no throw).
 * - Errores de Resend van capturados en `error`. NUNCA throw.
 *
 * Best-effort por diseño: el llamador (createStudent) NO debe abortar si esto falla.
 */
export async function sendAccessKeyEmail(
  params: SendAccessKeyEmailParams
): Promise<SendAccessKeyResult> {
  const mode = process.env.EMAIL_PROVIDER_MODE || "live";

  if (mode === "mock") {
    const messageId = `mock-${Math.random().toString(36).slice(2, 10)}`;
    console.info(
      `[sendAccessKeyEmail] mock-sent to=${params.to} workshop="${params.workshopTitle}" messageId=${messageId}`
    );
    return { ok: true, messageId };
  }

  const client = getResendClient();
  if (!client) {
    return {
      ok: false,
      error: "RESEND_API_KEY no configurada — email no enviado",
    };
  }

  try {
    const html = await render(
      AccessKeyEmail({
        name: params.name,
        workshopTitle: params.workshopTitle,
        accessKey: params.accessKey,
        loginEmail: params.loginEmail,
        passwordTemp: params.passwordTemp,
        baseUrl: params.baseUrl,
      })
    );

    const { data, error } = await client.emails.send({
      from: getEmailFrom(),
      to: params.to,
      subject: `Tu acceso al taller ${params.workshopTitle}`,
      html,
    });

    if (error) {
      return { ok: false, error: error.message || "Error desconocido de Resend" };
    }

    return { ok: true, messageId: data?.id };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Error inesperado";
    return { ok: false, error: message };
  }
}
