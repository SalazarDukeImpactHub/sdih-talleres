# Tasks — change 6: transactional-emails

## Pre-apply

- [x] Branch `change/transactional-emails` creada
- [x] Resend + React Email deps ya instaladas (desde scaffold)
- [ ] Jennifer crea cuenta Resend + `RESEND_API_KEY` en `.env.local` post-merge (no bloqueante: sandbox `onboarding@resend.dev` funciona)

## Slice único

### T-6.1 Cliente Resend singleton
- [ ] `src/lib/email/client.ts` con `getResendClient()` que retorna instancia única o `null` si no hay `RESEND_API_KEY`

### T-6.2 Template AccessKeyEmail
- [ ] `src/lib/email/templates/AccessKeyEmail.tsx` con `@react-email/components`
- [ ] Recibe props: `name`, `workshopTitle`, `accessKey`, `passwordTemp`, `loginEmail`, `baseUrl`
- [ ] Estructura: header "SDIH" + saludo + cuerpo + bloque clave + credenciales login + CTA "Ingresar al portal" + footer
- [ ] Estilos inline (max compat clients)

### T-6.3 Función sendAccessKeyEmail
- [ ] `src/lib/email/send-access-key.ts`
- [ ] Si `EMAIL_PROVIDER_MODE === "mock"` → retorna `{ ok: true, messageId: "mock-..." }` sin tocar Resend
- [ ] Sino, renderiza template + `client.emails.send({from, to, subject, html})`
- [ ] try/catch — errores van a `error`, NO throw
- [ ] Subject: `"Tu acceso al taller {workshopTitle}"`

### T-6.4 Integración en createStudent
- [ ] Fetch del workshop title en createStudent (ya tiene workshopId)
- [ ] Después del éxito, llamar `sendAccessKeyEmail()` best-effort
- [ ] Loguear warning si falla, NO romper el return success

### T-6.5 Unit tests
- [ ] `tests/unit/email/access-key-email.test.tsx` — render del template incluye datos esperados
- [ ] `tests/unit/email/send-access-key.test.ts` — mode mock retorna `{ok:true}`

### T-6.6 Spec e2e (no-regresión)
- [ ] Update `admin-create-student.spec.ts` o un nuevo `admin-create-student-email.spec.ts`:
  - Set `EMAIL_PROVIDER_MODE=mock` en `playwright.config.ts` webServer env
  - Admin crea alumno → modal muestra clave (existing) + sin error
  - Verificá no-regresión del flow [5c-1]

### T-6.7 Variables de entorno
- [ ] Documentar en proposal/design las vars: `RESEND_API_KEY`, `EMAIL_FROM`, `EMAIL_PROVIDER_MODE`, `NEXT_PUBLIC_BASE_URL`
- [ ] Jennifer las carga post-merge en `.env.local`

### T-6.8 Gate
- [ ] `pnpm build && pnpm lint && pnpm test`
- [ ] `pnpm test:e2e --grep "admin" --project=chromium` (subset rápido)

### T-6.9 PR
- [ ] Commit + push
- [ ] PR a master con body de pre-merge actions

## Review Workload Forecast

| Métrica | Valor |
|---------|-------|
| LOC estimado | ~250 |
| Chained PRs | No |
| Decision needed before apply | No |
| E2E impact | mock mode evita llamar Resend real |
| Pre-apply blockers | `RESEND_API_KEY` (no bloquea apply gracias a mock mode) |
