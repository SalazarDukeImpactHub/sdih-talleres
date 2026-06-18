# Design — change 7: whatsapp-button

## Decisiones

### D-1: WhatsAppButton es Client Component

**Decisión**: `"use client"`. Renderiza un `<a href="...">` con `target="_blank"` y `rel="noopener noreferrer"`.

**Por qué**: No necesita server data nueva (lee `process.env.NEXT_PUBLIC_WHATSAPP_NUMBER` y las props que le pasa el Server Component padre). Posicionamiento fixed + click handler en cliente.

**Alternativas rechazadas**: Server Component con `<form action>` que redirija — innecesariamente complejo para un link.

### D-2: Mensaje precargado por workshop con fallback

```ts
// En /taller/[slug]/page.tsx (Server Component):
const userName = user.name || "alumna/o";
const workshopTitle = workshop.title;
const rawTemplate = workshop.whatsapp_message_template;

const message = rawTemplate
  ? rawTemplate
      .replace(/\{nombre\}/g, userName)
      .replace(/\{taller\}/g, workshopTitle)
  : `Hola Jennifer, soy ${userName} y tengo una consulta sobre ${workshopTitle}.`;

<WhatsAppButton message={message} />
```

**Por qué**: el template editable por workshop da control a Jennifer; el fallback garantiza que siempre haya algo útil. Placeholders `{nombre}` y `{taller}` son simples de aprender y suficientes para v1.

### D-3: Helper `buildWhatsAppLink` en `src/lib/whatsapp.ts`

```ts
export function buildWhatsAppLink(number: string, message: string): string {
  const cleanNumber = number.replace(/\D/g, ""); // solo dígitos
  return `https://wa.me/${cleanNumber}?text=${encodeURIComponent(message)}`;
}
```

**Por qué**: helper puro testeable. Devuelve `""` si number está vacío (componente decide no renderizar). Limpia caracteres no-dígitos del número por si Jennifer lo carga con `+`, espacios o guiones.

### D-4: Variable `NEXT_PUBLIC_WHATSAPP_NUMBER`

**Decisión**: pública (NEXT_PUBLIC_ prefix). Default si no está definida: `""` → componente no renderiza el botón.

**Por qué**: el número va a aparecer en el HTML como link `wa.me/...`, no hay nada que esconder. Si no está cargada, el componente falla silenciosamente (no botón) en vez de crashear.

### D-5: Posición y estilos

- `fixed bottom-6 right-6 z-50`
- Tamaño: 56px círculo, ícono SVG de WhatsApp embebido inline (no imagen externa)
- Color: `#25D366` (verde oficial de WhatsApp) hover `#128C7E`
- Sombra suave para destacar del contenido
- Sin animación llamativa (no pulsa, no rebota) — minimal UX

**Por qué**: posición estándar de chat-flotantes que el usuario espera. SVG inline evita request adicional. Verde oficial reconocible.

### D-6: data-testid para e2e

- `data-testid="whatsapp-button"` en el `<a>`
- `data-testid="whatsapp-icon"` en el SVG (opcional)

### D-7: NO renderizar el botón si el número no está configurado

Si `process.env.NEXT_PUBLIC_WHATSAPP_NUMBER` es vacío o ausente, el componente retorna `null`. Útil para entornos de test sin la var seteada (CI minimal).

## Test plan (Gherkin)

**RF-7-1**: Alumno ve botón en /taller/[slug]
- GIVEN alumno logueado con acceso al taller "rag-intro"
- WHEN navega a `/taller/rag-intro`
- THEN el botón con `data-testid="whatsapp-button"` es visible

**RF-7-2**: Botón abre wa.me con mensaje precargado
- GIVEN alumno en `/taller/rag-intro` (workshop seedeado sin template custom)
- WHEN inspecciona el `href` del botón
- THEN matchea `https://wa.me/<numero>?text=Hola%20Jennifer...`
- AND incluye el título del taller URL-encoded

**RF-7-3**: Template custom reemplaza placeholders
- GIVEN workshop seedeado con `whatsapp_message_template = "Hola Jen, soy {nombre} y voy con el taller {taller}"`
- WHEN el alumno carga `/taller/[slug]`
- THEN `href` contiene `Hola%20Jen%2C%20soy%20Alumna%20de%20Prueba%20y%20voy%20con%20el%20taller%20...` (con título encoded)
- AND no quedan `{nombre}` ni `{taller}` literales en el mensaje

## Trade-offs

- **Mensaje genérico cuando no hay template**: aceptable para v1. Si Jennifer quiere mensaje siempre custom, configura el template por workshop desde admin (UI del editor llega en v1.1; mientras tanto vía Supabase dashboard).
- **NEXT_PUBLIC_ var**: no es secret; OK exponerla al cliente.
