# Design — change 6: transactional-emails

## Decisiones

### D-1: Cliente Resend singleton en `src/lib/email/client.ts`

```ts
import { Resend } from "resend";

let _client: Resend | null = null;

export function getResendClient(): Resend | null {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) return null;
  if (!_client) _client = new Resend(apiKey);
  return _client;
}
```

**Por qué**: instanciar Resend tiene costo pequeño pero acumulado en hot paths. Singleton evita re-crear. Si no hay API key, retorna `null` — el llamador maneja gracefully.

### D-2: Template React Email en `src/lib/email/templates/AccessKeyEmail.tsx`

Componente JSX con:
- Header: logo "Salazar Duke Impact Hub" (texto, sin imagen — evita problemas de hosting)
- Saludo: "Hola {nombre}"
- Cuerpo: "Tu acceso al taller {taller} está listo"
- Bloque destacado: la clave (estilo `code` para distinguir)
- Credenciales de login (email + password temporal, advertencia de cambio en primer login)
- CTA: botón "Ingresar al portal" con link a `https://{baseUrl}/catalogo`
- Footer: "Si no esperabas este email, podés ignorarlo"

**Por qué React Email**: componibilidad, type-safe, preview en dev con `pnpm email`, compatibilidad multi-cliente garantizada (incluido Gmail/Outlook).

### D-3: Función pública `sendAccessKeyEmail()` en `src/lib/email/send-access-key.ts`

```ts
export async function sendAccessKeyEmail(params: {
  to: string;
  name: string;
  accessKey: string;
  workshopTitle: string;
  passwordTemp: string;
  baseUrl: string;
}): Promise<{ ok: boolean; messageId?: string; error?: string }>
```

**Comportamiento**:
1. Si `EMAIL_PROVIDER_MODE === "mock"` → retorna `{ ok: true, messageId: "mock-<random>" }` sin llamar Resend.
2. Si `getResendClient()` retorna `null` (no API key) → retorna `{ ok: false, error: "RESEND_API_KEY not configured" }`.
3. Si tiene cliente → renderiza el template + manda. Captura errores de Resend en try/catch y los retorna en `error`.

**Por qué retorna `{ok, error}` en vez de throw**: el llamador (`createStudent`) trata el envío como best-effort. NO debe abortar la creación del alumno si el email falla.

### D-4: Integración en `createStudent()`

Justo antes del `return { success: true, userId, accessKey }`:

```ts
const emailResult = await sendAccessKeyEmail({
  to: validated.email,
  name: validated.email.split("@")[0],
  accessKey: keyResult.key!,
  workshopTitle, // fetcheado del workshopId al inicio del Server Action
  passwordTemp: validated.passwordTemp,
  baseUrl: process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000",
});

if (!emailResult.ok) {
  console.warn("[createStudent] Email send failed (best-effort):", emailResult.error);
  // NO abortar — el alumno está creado, la clave es válida
}
```

**Por qué best-effort**: el modal del admin sigue mostrando la clave como fallback. Jennifer puede compartirla manualmente si el email falló.

### D-5: Variable `EMAIL_FROM` con default sandbox

- Default: `onboarding@resend.dev` (sandbox Resend — solo manda a email registrado de la cuenta, suficiente para iniciar)
- Override: `EMAIL_FROM=no-reply@salazardukeimpacthub.com` cuando Jennifer verifique el dominio
- En el template, sender name: `"SDIH Talleres"`

### D-6: `EMAIL_PROVIDER_MODE` para tests

- `mock` (default en tests): no llama Resend, retorna mock OK
- `live` (default en prod/dev): usa Resend real

**Por qué**: los e2e gates no pueden mandar emails reales en cada corrida (rate limit + cuotas). El mock garantiza que el flow de createStudent no se rompa mientras valida que `sendAccessKeyEmail` fue invocado con los argumentos esperados.

### D-7: `data-testid` y observables para tests

Para los e2e que cubren el flow:
- El modal del admin sigue mostrando la clave (no cambia behavior visible).
- Para verificar que el email se "envió" en mode mock: agregamos un log estructurado `[sendAccessKeyEmail] mock-sent to=X` que el spec puede observar via stdout del WebServer, O leemos del DB un campo (no, no agregamos columna nueva por algo tan chico).
- Decisión: el spec verifica solo el comportamiento end-to-end (alumno creado + sin error visible). El correcto envío se valida con unit test del template + un test que mockea el cliente y confirma que `resend.emails.send()` fue llamado.

## Test plan

**RF-6-1**: Unit test del template
- GIVEN params válidos
- WHEN renderizo `AccessKeyEmail`
- THEN el HTML resultante contiene nombre, taller, clave, link al catálogo

**RF-6-2**: Unit test de `sendAccessKeyEmail` en mode mock
- GIVEN `EMAIL_PROVIDER_MODE=mock`
- WHEN llamo `sendAccessKeyEmail(...)`
- THEN retorna `{ ok: true, messageId: /^mock-/ }`

**RF-6-3**: E2E flow admin crea alumno con email mock
- GIVEN admin logueado, `EMAIL_PROVIDER_MODE=mock`
- WHEN crea alumno desde modal
- THEN modal muestra la clave (existing behavior, no regresión)
- AND no hay error visible en UI
- AND DB tiene el alumno + workshop_access correctamente

## Trade-offs

- **Best-effort vs. transactional**: si el email es crítico (alumno no puede entrar sin recibirlo), debería ser transactional con retry. Para v1, Jennifer tiene el modal como fallback manual.
- **Sandbox limita destinatario**: aceptable para v1; verificar dominio post-v1.
- **Sin tracking de aperturas/clicks**: Resend lo provee pero v1 no lo necesita; v1.1 si Jennifer quiere métricas.
