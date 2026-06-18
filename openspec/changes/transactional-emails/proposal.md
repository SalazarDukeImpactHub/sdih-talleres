# Proposal — change 6: transactional-emails

## Intent

Mandar email automático al alumno con su clave de acceso cuando el admin lo crea desde el panel. Hoy Jennifer copia la clave del modal del admin y la pega manualmente en WhatsApp/email — error-prone y lento. Cumple §7.4 del brief: "el alumno recibe sus datos sin intervención manual de Jennifer".

## Scope

**Dentro**:
- Cliente Resend singleton en `src/lib/email/client.ts`
- Template React Email `AccessKeyEmail.tsx` con: nombre del alumno, título del taller, clave de acceso, link al catálogo, contraseña temporal
- Función `sendAccessKeyEmail()` que renderiza el template y manda via Resend
- Integración en `createStudent()` (admin panel): después de crear alumno + generar clave, mandar email **best-effort** (si Resend falla, el alumno se creó OK y la clave queda en el modal del admin como fallback)
- Variable de entorno `RESEND_API_KEY` + `EMAIL_FROM` (default `onboarding@resend.dev` sandbox)
- Modo `EMAIL_PROVIDER_MODE=mock` para tests (no manda emails reales, retorna mock OK)
- 2-3 specs: unit test del template + e2e que crea alumno y confirma flow no roto

**Fuera (deferred a v1.1+)**:
- Email de bienvenida separado
- Confirmación de cambio de contraseña
- Password reset (requiere flow nuevo `/auth/forgot-password`)
- Dashboard de emails enviados
- Re-envío manual desde el admin

## Stakeholders & Decisiones tomadas con Jennifer

- **Resend**: Jennifer crea cuenta + agrega `RESEND_API_KEY` a `.env.local` post-merge. Mientras tanto, sandbox `onboarding@resend.dev` (solo manda a su email registrado).
- **Scope v1**: SOLO email de clave de acceso. Bienvenida, password reset, etc. quedan para v1.1.

## Riesgos

- **LOW** — Resend caído: el envío es best-effort. Si falla, el alumno se creó OK (modal del admin sigue mostrando la clave), Jennifer puede compartirla manualmente y reintentar después.
- **LOW** — Email cae en spam: probabilidad inicial con sandbox `onboarding@resend.dev`. Mitigable verificando dominio post-v1.
- **LOW** — Sandbox limita a email registrado: aceptable para tests con cuenta personal de Jennifer; para producción se verifica dominio.

## Tamaño estimado

- ~250 LOC (template + cliente + send function + integración + specs)
- 1 PR único
- ~3-5 min de e2e (mockeado, no llama Resend real)

## Next

`design.md` + `tasks.md` compactos en este mismo change.
