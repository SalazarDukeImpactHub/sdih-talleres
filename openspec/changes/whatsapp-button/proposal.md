# Proposal — change 7: whatsapp-button

## Intent

Agregar un botón flotante de WhatsApp en el portal del alumno autenticado (`/taller/[slug]`) que abra un chat con Jennifer (Salazar Duke Impact Hub) con un mensaje precargado contextual al taller. Cumple §7.5 del brief: "soporte directo al alumno sin abandonar el portal".

## Scope

**Dentro**:
- Componente `WhatsAppButton` (Client Component, posición fixed bottom-right)
- Variable de entorno `NEXT_PUBLIC_WHATSAPP_NUMBER` (público — la URL `wa.me/<numero>` se construye en cliente)
- Helper `buildWhatsAppLink(number, message)` que escapa el mensaje y arma `https://wa.me/{number}?text={encoded}`
- Integración en `/taller/[slug]/page.tsx`: si el workshop tiene `whatsapp_message_template`, usa ese mensaje; sino, mensaje genérico (`"Hola Jennifer, soy [nombre del alumno] y tengo una consulta sobre [título del taller]"`)
- Substitución de placeholders en el template: `{nombre}` → nombre del alumno; `{taller}` → título del workshop
- 1-2 specs e2e: botón visible en /taller/[slug], link href se forma correctamente con número + mensaje encoded

**Fuera (deferred)**:
- Botón en `/catalogo` o subsecciones del taller (sección sidebar) → si se pide en v1.1
- Editor del template desde admin → v1.1
- Botón en el portal admin → no aplica (Jennifer ya tiene WhatsApp)
- Tracking de clicks → v1.1 (Plausible o similar)
- Mensaje multi-idioma → v1 es solo español

## Stakeholders & Decisiones tomadas con Jennifer

- **Visibilidad**: siempre en `/taller/[slug]`. Si el workshop define `whatsapp_message_template`, se usa; sino, mensaje genérico.
- **Número de WhatsApp**: Jennifer lo pasa en `.env.local` post-apply. Para tests usa dummy `5491100000000`.

## Riesgos

- **LOW** — Cliente bloquea pop-ups: el link es `https://wa.me/...` que abre en pestaña nueva, NO un pop-up. Compatible con browsers comunes.
- **LOW** — Encoding de caracteres especiales en mensaje: uso `encodeURIComponent` estándar.
- **LOW** — `NEXT_PUBLIC_*` queda en el bundle del cliente: es info pública (el número se va a usar en links públicos), no es secret.

## Tamaño estimado

- ~150 LOC totales (componente + helper + spec)
- 1 PR único (no chained)
- ~30 min de e2e gate completo

## Next

`design.md` + `tasks.md` (compactos en este mismo change).
