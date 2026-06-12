# Coding Standards — SDIH Talleres

Cliente: Jennifer Salazar Duque — Salazar Duke Impact Hub
Stack: Next.js 16 (App Router) + React 19 + Tailwind 4 + Zod 4 + Supabase + Resend

> **Next.js 16 — leer antes de tocar código**
> Esta versión trae breaking changes (variable fonts, `params` como Promise, event handlers en Server Components, i18n cookies, middleware). El template del scaffold lo advierte explícitamente. Cuando dudes, leé `node_modules/next/dist/docs/` o invocá el skill `nextjs-app-router` que ya cubre los gotchas de v16.

Este archivo define los estándares de código que GGA (Gentleman Guardian Angel)
revisa automáticamente en cada commit.

---

## Seguridad — BLOQUEANTE

Ningún commit puede pasar con estos problemas:

- **Sin secretos en código**: API keys, tokens, passwords, connection strings no pueden
  estar hardcodeados. Usar variables de entorno (.env). Si se detecta algo que parece
  una key o secret en el código fuente → bloquear.

- **Sin SQL injection**: Las queries deben usar parámetros preparados o el ORM.
  Concatenar inputs del usuario en queries SQL → bloquear.

- **Sin XSS**: En React/Next.js, no usar `dangerouslySetInnerHTML` con datos del usuario
  sin sanitizar.

- **Inputs validados**: Todo dato que viene de una request (body, query, params) debe
  validarse antes de usarse. Usar Zod en el backend (Zod 4 es el estándar del proyecto).

- **Sin console.log con datos sensibles**: No loguear passwords, tokens, datos personales
  de usuarios.

- **RLS obligatorio**: Toda tabla de Supabase con datos por alumno debe tener Row Level
  Security activa. Una tabla nueva sin políticas RLS → bloquear.

---

## Calidad — ADVERTENCIA

Reportar pero no bloquear:

- **Sin código muerto**: Sin funciones, variables o imports sin usar.

- **Sin TODO sin dueño**: Un TODO debe tener nombre o fecha — no puede ser genérico.

- **Funciones con una responsabilidad**: Una función que hace más de una cosa claramente
  distinta debe señalarse.

- **Sin duplicación obvia**: Si el mismo bloque lógico aparece más de dos veces,
  señalarlo.

- **Nombres descriptivos**: Variables de una letra (excepto índices en loops), nombres
  genéricos como `data`, `result`, `temp` sin contexto → señalar.

---

## TypeScript — ADVERTENCIA

- **Sin `any` explícito**: Usar tipos concretos o `unknown` con narrowing.
  `as any` sin comentario explicativo → señalar.

- **Interfaces sobre tipos cuando aplique**: Para objetos que representan entidades
  del dominio, preferir `interface` sobre `type`.

- **Sin non-null assertion innecesaria**: `!` solo cuando el desarrollador puede
  garantizar que el valor existe — señalar los casos donde no es obvio.

---

## Manejo de errores — ADVERTENCIA

- **Sin catch vacío**: `catch(e) {}` o `catch(e) { console.log(e) }` sin manejo
  real → señalar.

- **Errores con contexto**: Los errores deben incluir información suficiente para
  debugging — no solo "algo falló".

- **async/await con try-catch**: Funciones async que hacen I/O deben manejar errores.

---

## Estructura — SUGERENCIA

Solo informar, no bloquear ni advertir:

- Archivos de más de 300 líneas podrían dividirse.
- Componentes React de más de 200 líneas probablemente tienen demasiadas responsabilidades.
- Importaciones desordenadas (no agrupadas por: externos / internos / relativos).

---

## Notas para GGA

- Los bloqueantes en **Seguridad** deben detener el commit sin excepción.
- Las advertencias deben reportarse claramente pero permitir el commit.
- Las sugerencias son opcionales — informar sin interrumpir.
- El contexto importa: un `console.log` en un archivo de test no es lo mismo que en producción.
- Si hay duda sobre si algo es un secreto real o un valor de ejemplo → reportar como advertencia, no bloquear.
