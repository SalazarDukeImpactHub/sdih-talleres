# ADR-001 — content_json de las secciones: schema fijo por tipo

**Estado:** Aceptado
**Fecha:** 2026-06-12
**Decisora:** Jennifer Salazar Duque
**Contexto SDD:** change 3 (`workshop-sections`), decisión que condiciona change 5 (`admin-panel`)

## Contexto

El brief §6 define la tabla `Section` con un campo `content_json` sin especificar su formato interno. Las 5 secciones del taller (Inicio · Aprendizaje · Taller · Instalación · Glosario) son fijas por diseño del producto, y el prototipo HTML muestra estructuras de contenido muy distintas entre sí: hero + grid de quick-links (Inicio), carrusel de slides + notas + PDF (Aprendizaje), checklist numerado + bloques de código copiables (Instalación), búsqueda + flashcards (Glosario).

El formato de `content_json` condiciona: el render de cada sección, la validación con Zod, y sobre todo el admin panel del change 5 con el que Jennifer carga el contenido.

## Decisión

**Schema fijo por tipo de sección** — un discriminated union de Zod donde cada `type` tiene su schema exacto:

```typescript
type SectionContentJson =
  | { type: 'inicio';      title; description; quick_links: QuickLink[] }
  | { type: 'aprendizaje'; title; slides: Slide[]; pdf_url?: string }
  | { type: 'taller';      title; instructions }            // ejercicios: change 4
  | { type: 'instalacion'; title; steps: InstallStep[] }    // con code blocks
  | { type: 'glosario';    title; search_placeholder }      // términos: tabla aparte
```

Los campos de texto largo son plain text en v1 (markdown evaluable en v1.1 si hace falta).

## Alternativas descartadas

1. **Bloques tipados genéricos** (array de heading/paragraph/video/code con discriminated union abierto): máxima flexibilidad futura, pero paga complejidad que el dominio no pide — las secciones son fijas. Admin panel +1-2 días. Descartada por sobreingeniería.
2. **Markdown libre** (`{markdown: string}` + react-markdown): carga trivial, pero no puede expresar los grids, carruseles ni checklists estructurados que el prototipo diseñó. Dependencia nueva. Descartada por insuficiencia expresiva.

## Consecuencias

- (+) El render de cada sección es un switch limpio por `type`, type-safe de punta a punta.
- (+) El admin panel del change 5 son 5 formularios predecibles (~1 día de trabajo).
- (+) La validación Zod rechaza contenido malformado antes de llegar a la base.
- (−) Agregar un sexto tipo de sección requiere migración de código (aceptable: las secciones son fijas por producto).
- (−) Contenido rico (negritas, links) dentro de textos largos requiere extensión futura (v1.1).
