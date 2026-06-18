# Tasks — change 7: whatsapp-button

## Pre-apply

- [x] Branch `change/whatsapp-button` creada
- [x] Columna `whatsapp_message_template` ya existe en `workshops` (change 1)
- [ ] Jennifer pasa el número de WhatsApp para `.env.local` (no bloquea apply, sí bloquea verificación local del link real)

## Slice único (no chained)

### T-7.1 Helper buildWhatsAppLink
- [ ] Crear `src/lib/whatsapp.ts` con `buildWhatsAppLink(number, message)`
- [ ] Devuelve `""` si number está vacío
- [ ] Limpia caracteres no-dígitos del número
- [ ] Usa `encodeURIComponent` para el mensaje

### T-7.2 Componente WhatsAppButton
- [ ] `src/components/workshop/WhatsAppButton.tsx` como Client Component
- [ ] Props: `{ message: string }`
- [ ] Lee `process.env.NEXT_PUBLIC_WHATSAPP_NUMBER`
- [ ] Renderiza `null` si number vacío
- [ ] `<a target="_blank" rel="noopener noreferrer">` con icon SVG inline
- [ ] Posición `fixed bottom-6 right-6 z-50`, color verde WhatsApp
- [ ] `data-testid="whatsapp-button"`

### T-7.3 Integración en /taller/[slug]/page.tsx
- [ ] Importar `WhatsAppButton`
- [ ] Construir mensaje:
  - Si `workshop.whatsapp_message_template` existe: reemplazar `{nombre}` y `{taller}`
  - Sino: mensaje genérico
- [ ] Pasar `message` como prop al componente

### T-7.4 Configurar `.env.local`
- [ ] Jennifer agrega `NEXT_PUBLIC_WHATSAPP_NUMBER=549XXXXXXXXXX`
- [ ] Documentar en `.env.local.example` (si existe) o agregar la var
- [ ] Verificar que el dev server lee la variable (recargar dev)

### T-7.5 Spec e2e
- [ ] `tests/playwright/whatsapp-button.spec.ts`
- [ ] Test [7-1]: botón visible en /taller/rag-intro tras login alumno
- [ ] Test [7-2]: `href` del botón matchea `https://wa.me/<numero>?text=...` y contiene "Hola Jennifer" + título del taller
- [ ] Test [7-3]: con `whatsapp_message_template` seedeado, `href` contiene el mensaje custom con placeholders sustituidos
- [ ] Setear `NEXT_PUBLIC_WHATSAPP_NUMBER=5491100000000` en el spec via test config (dummy)

### T-7.6 Gate
- [ ] `pnpm build && pnpm lint && pnpm test`
- [ ] `pnpm test:e2e --grep "whatsapp|workshop" --project=chromium` (subset rápido para confirmar no-regresión)

### T-7.7 PR
- [ ] Commit y push
- [ ] PR a master
- [ ] Body con summary + decisiones + plan de test

## Review Workload Forecast

| Métrica | Valor |
|---------|-------|
| LOC estimado | ~150 |
| Chained PRs | No (slice único) |
| Decision needed before apply | No |
| E2E impact | +3 specs nuevos, sin regresión esperada |
| Pre-apply blockers | Solo número WhatsApp (no bloquea apply, sí gate local) |
