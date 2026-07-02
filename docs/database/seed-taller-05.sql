-- ============================================================
-- TALLER 05 — Tu Cerebro Aumentado: Obsidian + Claude + Engram
-- ============================================================
-- Cómo usar este archivo:
-- Opción A (recomendada): abrir en TablePlus conectado a Supabase y correr todo de una.
-- Opción B: pegar entero en Supabase SQL Editor (web).
--
-- Es idempotente: el DELETE inicial limpia residuos de intentos previos.
-- Si todo va bien al final tenés: 1 workshop, 5 secciones (con 17 slides
-- de aprendizaje), 12 ejercicios y 29 términos de glosario.
-- ============================================================

-- 1) Cleanup defensivo
DELETE FROM workshops WHERE slug = 'cerebro-aumentado-obsidian-claude-engram';

-- 2) Workshop
INSERT INTO workshops (
  slug, title, description, instructor,
  date_live, duration_min, prerequisites, status,
  whatsapp_message_template
) VALUES (
  'cerebro-aumentado-obsidian-claude-engram',
  'Tu Cerebro Aumentado: vault personal con Obsidian + Claude + Engram',
  'Tenés 3, 5, 8 proyectos en simultáneo. La información vive dispersa en Drive, WhatsApp, mails, tu cabeza. Volver a un proyecto después de 2 semanas te cuesta 30-60 minutos solo recordando dónde quedó cada cosa. Le explicás el contexto a Claude o ChatGPT desde cero cada vez. El problema no es que no trabajás duro — es que no tenés infraestructura cognitiva. En este taller vamos a construir esa infraestructura: una bóveda inteligente con Obsidian (estructura), Claude (inteligencia operacional) y Engram (memoria persistente entre sesiones). Al final tenés tu primer vault funcionando y la metodología clara para escalarlo a tantos proyectos como necesites.',
  'Jennifer Salazar Duque',
  NULL,
  360,
  'Obligatorios: computadora (Mac, Windows o Linux) con espacio para instalar Obsidian; disposición a pasar 5 horas estructurando algo que después te ahorrará cientos; al menos un proyecto real que querés usar como caso de práctica; habilidad básica con archivos y carpetas. Muy recomendados: haber completado el Taller 01 - Engram (o tener Engram instalado); tener Claude Code o Claude Pro activo; una cuenta de GitHub si querés versionar tu vault. Si te falta algo, la sección de Instalación cubre todo — no arrancás los ejercicios hasta tener la base lista.',
  'disponible',
  'Hola Jennifer, soy {nombre} y tengo una consulta sobre {taller}.'
);

-- ============================================================
-- 3) SECCIONES (5)
-- ============================================================

-- INICIO
INSERT INTO sections (workshop_id, type, section_order, content_json)
SELECT id, 'inicio', 1,
$inicio$
{
  "type": "inicio",
  "title": "Bienvenida — tu bóveda inteligente",
  "description": "## Hay un patrón que se repite\n\nEn casi todas las personas con las que trabajo, veo lo mismo:\n\n- Tienen **3, 5, 8 proyectos** en simultáneo\n- La información de cada uno vive **dispersa** — algunos archivos en Drive, otros en WhatsApp, otros en mails, otros en la cabeza\n- Cuando vuelven a un proyecto **después de 2 semanas**, pierden 30-60 minutos solo recordando dónde quedó cada cosa\n- Cuando le piden ayuda a ChatGPT o Claude, tienen que **explicar el contexto desde cero** cada vez\n- Al final del año sienten que **avanzaron mucho menos de lo que podrían**\n\nEl problema no es que no trabajan duro. El problema es que **no tienen infraestructura cognitiva**.\n\nEn este taller vamos a construir esa infraestructura. Una **bóveda inteligente** donde vive todo lo que importa de tus proyectos — y donde Claude entra a operar con vos como si fuera parte del equipo.\n\n## Tres piezas que se integran\n\n- **Obsidian** → tu cerebro estructurado (notas, proyectos, conexiones)\n- **Claude** → el agente que lee, escribe y razona dentro de tu cerebro\n- **Engram** → la memoria persistente que sobrevive entre conversaciones\n\nAl final del taller, vas a tener tu primer vault funcionando y la metodología clara para escalarlo a tantos proyectos como necesites.\n\n## Qué vas a lograr\n\n1. Entender qué es un **segundo cerebro** y por qué importa tener uno\n2. Tener **Obsidian instalado y configurado** con tu primer vault\n3. Organizar tu vault con el método **PARA** adaptado\n4. Saber crear **notas conectadas** con backlinks y tags\n5. Tener **plantillas** para proyectos, daily notes y decisiones\n6. Conectar **Claude** para que opere dentro de tu vault\n7. Integrar **Engram** para memoria persistente entre sesiones\n8. Tener tu primer **proyecto real** estructurado en el vault\n9. Salir con un **flujo diario** claro para mantenerlo vivo\n\n## Duración\n\n5 horas en vivo (2 sesiones de 2.5h) + 1 hora de práctica autónoma.\n\n## Una promesa importante\n\n> **No te vas a llevar un vault espectacular. Te vas a llevar un vault funcionando con TU manera de pensar — y la metodología para mantenerlo vivo.**\n\nEl error más común con segundos cerebros es construir uno hermoso y dejarlo morir en 2 semanas. Acá vamos a optimizar por **sostenibilidad**, no por estética.",
  "quick_links": [
    {"label": "17 diapositivas — la teoría", "target_section": "aprendizaje"},
    {"label": "12 ejercicios — construir tu vault", "target_section": "taller"},
    {"label": "Instalación de Obsidian + Claude + Engram", "target_section": "instalacion"},
    {"label": "Glosario", "target_section": "glosario"}
  ]
}
$inicio$::jsonb
FROM workshops WHERE slug = 'cerebro-aumentado-obsidian-claude-engram';

-- APRENDIZAJE (17 slides)
INSERT INTO sections (workshop_id, type, section_order, content_json)
SELECT id, 'aprendizaje', 2,
$apr$
{
  "type": "aprendizaje",
  "title": "La teoría — método y por qué funciona",
  "slides": [
    {"kicker": "Diapositiva 1 · El costo invisible", "title": "Lo que te cuesta el dispersamiento", "body": "Cada vez que cambiás de contexto entre proyectos, tu cerebro paga lo que se llama **switching cost** — la pérdida cognitiva de cambiar de tema.\n\n| Patrón | Costo |\n|--------|-------|\n| Buscar dónde quedó un archivo | 5-15 min por evento |\n| Volver a un proyecto después de 2 semanas | 30-60 min de *recordar* |\n| Explicarle el contexto a un colega o IA cada vez | 10-20 min |\n| Tomar la misma decisión dos veces porque olvidaste la primera | imposible de medir, terrible |\n\n**Calculá:** si trabajás con 5 proyectos y perdés solo 30 min por proyecto por semana en este costo invisible, son **2.5 horas semanales** = 130 horas al año = 3 semanas de trabajo perdidas en *buscar y recordar*.\n\nUn segundo cerebro **devuelve esas semanas**.", "notes": null},
    {"kicker": "Diapositiva 2 · El concepto", "title": "Qué es un segundo cerebro", "body": "El término lo popularizó Tiago Forte. La idea es simple:\n\n> **Un sistema externo que almacena, organiza y conecta tu conocimiento — para que tu cerebro biológico se libere de tener que recordar y se concentre en pensar y crear.**\n\n**Lo que vive en el cerebro biológico:**\n- Razonamiento en tiempo real\n- Creatividad\n- Decisiones del momento\n- Vínculos humanos\n\n**Lo que vive en el segundo cerebro:**\n- Información de proyectos\n- Decisiones tomadas con su rationale\n- Aprendizajes\n- Referencias\n- Plantillas y procesos\n- Conexiones entre ideas\n\n**La regla:** si lo podés escribir, no lo retengas en la cabeza. La cabeza es para procesar, no para almacenar.", "notes": null},
    {"kicker": "Diapositiva 3 · La herramienta", "title": "Por qué Obsidian (y no Notion, Google Docs, etc.)", "body": "Hay muchas herramientas. Cada una tiene su filosofía.\n\n| Herramienta | Filosofía | Cuándo usar |\n|-------------|-----------|-------------|\n| **Google Docs / Drive** | Documentos individuales | Compartir, colaborar |\n| **Notion** | Bases de datos relacionales en la nube | Equipos, gestión de productos |\n| **Obsidian** | Notas conectadas en tu disco local | Pensamiento personal, segundo cerebro |\n| **Apple Notes** | Notas rápidas | Captura efímera |\n| **OneNote** | Cuadernos digitales | Documentación |\n\n**Obsidian gana para segundo cerebro por 5 razones:**\n\n1. **Local-first** — tus archivos viven en tu disco como `.md`, no en un servidor de un tercero\n2. **Markdown puro** — el formato más portable que existe. Funciona en 50 años\n3. **Backlinks nativos** — las notas se conectan entre sí automáticamente\n4. **Extensible con plugins** — desde grafos visuales hasta integraciones con IA\n5. **Funciona sin internet** — y sin suscripción\n\nSi mañana Obsidian desaparece, **tus archivos siguen siendo archivos**. Eso es libertad.", "notes": null},
    {"kicker": "Diapositiva 4 · El método", "title": "PARA — Projects, Areas, Resources, Archive", "body": "PARA es un sistema de organización creado por Tiago Forte. Cuatro carpetas, una sola lógica:\n\n| Carpeta | Qué guarda |\n|---------|-----------|\n| **P — Projects** | Proyectos activos con fecha de cierre |\n| **A — Areas** | Áreas de responsabilidad continua (sin fin) |\n| **R — Resources** | Recursos de referencia (libros, ideas, frameworks) |\n| **A — Archive** | Lo que ya no está activo |\n\n**La diferencia clave:**\n\n- **Project:** tiene fecha de cierre. *Lanzar el sitio web nuevo* (3 meses) → cuando lanzás, se archiva\n- **Area:** no tiene cierre. *Salud financiera* es para toda la vida\n- **Resource:** lo guardás para usar después. Un libro de marketing, un framework de gestión\n- **Archive:** todo lo que ya cerró\n\nCuando una nota llega, te preguntás:\n1. ¿Es un proyecto activo? → Projects\n2. ¿Es un área continua? → Areas\n3. ¿Es referencia para el futuro? → Resources\n4. ¿Ya no aplica? → Archive", "notes": null},
    {"kicker": "Diapositiva 5 · La estructura", "title": "Cómo se ve un vault con PARA", "body": "```\nmi-cerebro-vault/\n├── 00 INBOX/              ← Todo entra acá primero\n├── 01 PROJECTS/\n│   ├── Proyecto A — Lanzamiento web/\n│   ├── Proyecto B — Curso de IA/\n│   └── Proyecto C — Mudanza/\n├── 02 AREAS/\n│   ├── Salud/\n│   ├── Familia/\n│   ├── Carrera/\n│   └── Finanzas/\n├── 03 RESOURCES/\n│   ├── Libros/\n│   ├── Frameworks/\n│   └── Personas/\n├── 04 ARCHIVE/\n│   ├── Proyectos cerrados/\n│   └── Areas inactivas/\n└── 05 SYSTEM/\n    ├── Templates/\n    ├── Daily Notes/\n    └── Decisions/\n```\n\n**Los números** al inicio de cada carpeta son para que aparezcan en orden en el explorador. Sin números, Obsidian los ordena alfabéticamente.", "notes": null},
    {"kicker": "Diapositiva 6 · La regla del INBOX", "title": "Todo entra por INBOX primero", "body": "> **Todo entra por INBOX primero. Nunca crees una nota directamente en su destino final.**\n\n**Por qué:**\n- Capturar es rápido. Clasificar requiere pensamiento\n- Si tenés que decidir dónde va antes de escribir, **no escribís**\n- El inbox se procesa una vez al día (5 min al cierre) o cuando se llena\n\n**El inbox tiene un límite:** si llega a 20 notas, parás y procesás. Si no, se vuelve un cementerio.", "notes": null},
    {"kicker": "Diapositiva 7 · El ancla", "title": "Daily Notes — la pieza que hace que el sistema viva", "body": "La pieza que hace que el sistema **viva**:\n\n```\n05 SYSTEM/Daily Notes/\n├── 2026-06-12.md\n├── 2026-06-11.md\n└── 2026-06-10.md\n```\n\nCada día abrís tu Daily Note y registrás:\n- Qué hiciste hoy\n- Qué decidiste\n- Qué aprendiste\n- Con quién hablaste\n- Qué pendientes quedaron\n\n**Es tu diario operativo.** En 6 meses podés volver al 2026-04-15 y ver exactamente qué hacías ese día.", "notes": null},
    {"kicker": "Diapositiva 8 · La magia", "title": "Backlinks — la red de conocimiento", "body": "Cuando escribís `[[Proyecto A]]` en cualquier nota, Obsidian crea un link a la nota llamada *Proyecto A*. Y en la nota de *Proyecto A* aparece automáticamente **mencionada en...** con el link de vuelta.\n\nEsto crea una **red de conocimiento**. Sin esfuerzo, vas viendo cómo tus ideas, proyectos y personas se conectan.\n\n**Ejemplo:**\n- En tu Daily Note del 2026-06-12 escribís: *Reunión con [[María]] sobre [[Proyecto Web]]*\n- En la nota de [[María]] aparece automáticamente: *Mencionada en Daily Note 2026-06-12*\n- En la nota de [[Proyecto Web]] también\n\n**Después de 30 días** de usar backlinks, tu vault deja de ser una lista de archivos y se vuelve **un mapa vivo**.", "notes": null},
    {"kicker": "Diapositiva 9 · Otra capa", "title": "Tags — conectar por tema", "body": "Los backlinks conectan notas específicas. Los **tags** conectan temas.\n\n```markdown\n#proyecto #urgente #estrategia\n```\n\nEn la barra lateral de Obsidian, podés ver todas las notas con un tag específico. Útil para:\n- `#decision` → todas tus decisiones registradas\n- `#aprendizaje` → todo lo que aprendiste\n- `#persona` → todas las notas que mencionan personas\n- `#libro` → todos los libros que leíste\n\n**Regla práctica:** no más de 3 tags por nota. Si necesitás 7, probablemente la nota tiene 7 temas y debería partirse.", "notes": null},
    {"kicker": "Diapositiva 10 · Metadata", "title": "Frontmatter — datos estructurados al inicio de la nota", "body": "Al inicio de cada nota, podés agregar **metadata YAML**:\n\n```yaml\n---\ntipo: proyecto\nestado: activo\nprioridad: alta\nfecha_inicio: 2026-04-01\nfecha_cierre: 2026-09-30\nproyecto_padre: [[Plan Anual 2026]]\npersonas: [[María]], [[Pedro]]\ntags: [estrategia, lanzamiento]\n---\n```\n\n**Por qué importa el frontmatter:**\n- Plugins como **Dataview** te dejan hacer queries: *mostrame todos los proyectos activos de alta prioridad*\n- Claude puede leer esa metadata y filtrar tu vault inteligentemente\n- Es la base de los dashboards automáticos", "notes": null},
    {"kicker": "Diapositiva 11 · Las plantillas", "title": "3 plantillas fundamentales", "body": "Empezás con 3 plantillas. Todas las demás surgen después.\n\n### Plantilla — Daily Note\n```markdown\n---\ntipo: daily\nfecha: {{date}}\nestado: 🟢/🟡/🔴\n---\n\n# {{date}}\n\n## Foco del día\n-\n\n## Lo que hice\n-\n\n## Decisiones tomadas\n-\n\n## Aprendizajes\n-\n\n## Pendientes para mañana\n-\n```\n\n### Plantilla — Proyecto\n```markdown\n---\ntipo: proyecto\nestado: activo\nprioridad: alta/media/baja\nfecha_inicio:\nfecha_cierre:\narea: [[Area X]]\n---\n\n# {{title}}\n\n## Objetivo\n## Resultado esperado\n## Stakeholders / personas\n## Decisiones tomadas\n## Próximos pasos\n## Notas relacionadas\n```\n\n### Plantilla — Decisión\n```markdown\n---\ntipo: decision\nfecha: {{date}}\nestado: tomada\nrevision_30d:\n---\n\n# Decisión: {{title}}\n\n## Contexto\n## Opciones consideradas\n## Decisión final\n## Rationale (por qué esta opción)\n## Riesgos asumidos\n## Cómo voy a saber si funcionó\n```", "notes": null},
    {"kicker": "Diapositiva 12 · La IA entra al vault", "title": "Cómo entra Claude al vault", "body": "Acá la cosa se pone interesante.\n\nTu vault es una carpeta con archivos `.md`. **Claude Code** (la CLI oficial de Claude) puede operar dentro de cualquier carpeta de tu disco.\n\nEso significa que podés decirle a Claude cosas como:\n\n> *Leé las decisiones de los últimos 30 días y dame un resumen de patrones que ves*\n\n> *Mirá el proyecto X y proponeme los próximos 3 pasos basados en las notas*\n\n> *Conectá esta idea nueva con las notas existentes — ¿con qué se relaciona?*\n\n> *Hacé el resumen semanal — revisá los Daily Notes de la semana y agregame los insights*\n\nClaude no es un buscador. **Es un colaborador con acceso a tu cerebro completo.**", "notes": null},
    {"kicker": "Diapositiva 13 · Memoria persistente", "title": "Cómo entra Engram al vault", "body": "Claude Code lee tu vault dentro de una sesión. Pero **cuando cerrás la sesión, todo lo que charlaron se pierde**.\n\nAhí entra Engram (cubierto en Taller 01):\n\n- Cada vez que tomás una decisión importante con Claude → se guarda en Engram\n- Cada vez que descubrís algo no obvio sobre el proyecto → se guarda en Engram\n- Cada vez que arreglás algo y aprendés del proceso → se guarda en Engram\n\nCuando volvés mañana a una sesión nueva, **Claude tiene memoria** de todo eso. No le tenés que volver a explicar.", "notes": null},
    {"kicker": "Diapositiva 14 · La trinidad", "title": "Obsidian + Claude + Engram", "body": "```\n                  OBSIDIAN\n              (estructura, notas,\n               daily, proyectos)\n                     ▲\n                     │\n                     ▼\n            ┌────────────────┐\n            │     CLAUDE     │ ← agente que lee, escribe,\n            │  (inteligencia │   razona dentro de tu vault\n            │   operacional) │\n            └────────────────┘\n                     ▲\n                     │\n                     ▼\n                  ENGRAM\n            (memoria persistente\n             entre sesiones)\n```\n\n| Pieza | Para qué |\n|-------|----------|\n| **Obsidian** | Almacena. Estructura. Conecta |\n| **Claude** | Lee, escribe, razona, propone |\n| **Engram** | Recuerda decisiones y aprendizajes entre sesiones |\n\n**Sin Obsidian** → no hay dónde guardar\n**Sin Claude** → no hay quien procese\n**Sin Engram** → cada conversación arranca de cero\n\nLas tres juntas te dan un **cerebro aumentado** real.", "notes": null},
    {"kicker": "Diapositiva 15 · La operación", "title": "Flujo diario — cómo se opera esto", "body": "| Momento | Qué hacés | Tiempo |\n|---------|-----------|--------|\n| **Mañana** | Abrir Daily Note, escribir foco del día | 5 min |\n| **Durante el día** | Capturar en INBOX todo lo que aparezca | continuo |\n| **Reuniones** | Notas rápidas con `[[backlinks]]` a personas y proyectos | en el momento |\n| **Decisiones** | Crear nota de decisión, decirle a Claude que la guarde en Engram | 5 min |\n| **Cierre de día** | Procesar INBOX (todo a su carpeta), actualizar pendientes | 10 min |\n| **Cierre de semana** | Revisar daily notes, sintetizar aprendizajes con Claude | 30 min |\n| **Cierre de mes** | Revisar proyectos, archivar lo cerrado, ajustar áreas | 1 hora |\n\n**Total diario:** ~20 minutos\n**Total semanal:** 30 minutos extra\n**Total mensual:** 1 hora extra\n\nA cambio de eso, recuperás 130 horas al año de *buscar y recordar*.", "notes": null},
    {"kicker": "Diapositiva 16 · Lo que no hay que hacer", "title": "Errores que matan vaults", "body": "He visto morir muchos vaults. Acá los errores más comunes:\n\n| Error | Por qué mata el vault | Cómo evitarlo |\n|-------|----------------------|---------------|\n| Estética antes que uso | Pasás 4h en plugins y nunca escribís | Empezá feo. Lo mejorás cuando funciona |\n| Demasiadas plantillas | Decidir qué plantilla usar te bloquea | Solo 3 al inicio: Daily, Proyecto, Decisión |\n| Inbox sin procesar | Acumulás basura y abandonás | Procesá inbox todos los días |\n| No usar daily notes | Sin diario, el sistema no respira | Daily notes son innegociables |\n| Querer estructura perfecta antes de empezar | Te paralizás planificando | PARA + INBOX + Daily Notes y arrancás |\n| No conectar con backlinks | Vault muere como lista de archivos | `[[doble corchetes]]` siempre que mencionés algo |\n| Olvidar archivar | Proyectos viejos saturan la vista | Cada mes archivás lo cerrado |\n| Tratarlo como base de datos | Te volvés rígido | Es un cerebro — fluido, vivo, ajustable |", "notes": null},
    {"kicker": "Diapositiva 17 · Cierre", "title": "5 ideas para llevarte", "body": "1. **El vault no es perfecto, es vivo.** Empezá feo, mejoralo con el uso\n2. **PARA + INBOX + Daily Notes** es todo lo que necesitás los primeros 30 días\n3. **Backlinks son magia gratuita.** Usalos siempre que mencionés algo\n4. **Claude entra como colaborador**, no como buscador. Pedile que razone sobre tu vault, no solo que busque\n5. **Engram es lo que hace que esto no muera.** Sin memoria persistente, Claude empieza de cero cada vez\n\n> **Tu segundo cerebro no te va a hacer más productivo. Te va a hacer pensar mejor — porque tu cerebro biológico deja de cargar lo que el sistema puede cargar por él.**", "notes": null}
  ]
}
$apr$::jsonb
FROM workshops WHERE slug = 'cerebro-aumentado-obsidian-claude-engram';

-- TALLER
INSERT INTO sections (workshop_id, type, section_order, content_json)
SELECT id, 'taller', 3,
$taller$
{
  "type": "taller",
  "title": "Construí tu cerebro aumentado",
  "instructions": "Tenés **12 ejercicios** que te llevan desde un vault vacío hasta Claude + Engram operando dentro de tu segundo cerebro.\n\n**Ejercicios 1-3**: la base — vault, estructura PARA y plantillas fundamentales.\n\n**Ejercicios 4-6**: la práctica — primera Daily Note, primer proyecto real, primera decisión documentada.\n\n**Ejercicios 7-8**: la IA — conectar Claude Code al vault y darle una tarea operativa real.\n\n**Ejercicio 9**: la memoria — integrar Engram para que las decisiones sobrevivan entre sesiones.\n\n**Ejercicios 10-12**: el ritual — flujo diario de cierre, cierre semanal con Claude y compromiso de 30 días.\n\n**Antes de arrancar:**\n- Hacé los pasos de la sección Instalación primero (Obsidian + Claude Code + Engram)\n- Hacelos en orden — cada ejercicio depende del anterior\n- No optimices estética al inicio — *empezá feo, mejoralo con el uso*",
  "placeholder": "Si no ves los ejercicios todavía, recargá la página."
}
$taller$::jsonb
FROM workshops WHERE slug = 'cerebro-aumentado-obsidian-claude-engram';

-- INSTALACIÓN
INSERT INTO sections (workshop_id, type, section_order, content_json)
SELECT id, 'instalacion', 4,
$inst$
{
  "type": "instalacion",
  "title": "Setup de tu cerebro aumentado",
  "steps": [
    {"order": 1, "title": "Instalar Obsidian", "description": "1. Andá a [obsidian.md](https://obsidian.md)\n2. Descargá la versión para tu sistema (Mac, Windows, Linux)\n3. Instalá\n4. Abrilo\n\n**Es gratis para uso personal.** Si querés syncear entre dispositivos, Obsidian Sync cuesta ~10 USD/mes. Para empezar, no lo necesitás.", "code": "https://obsidian.md", "language": "bash"},
    {"order": 2, "title": "Tu primer vault (lo creás en el Ejercicio 1)", "description": "Ya cubierto en el Ejercicio 1. Solo asegurate de elegir bien la ubicación física del vault — donde lo crees vive.\n\n**Sugerencia de ubicación:** `~/Documents/cerebros/mi-cerebro/` para que sea fácil de encontrar y backupear.", "code": "~/Documents/cerebros/mi-cerebro/", "language": "bash"},
    {"order": 3, "title": "Plugins core a activar", "description": "En Obsidian → Settings → Core plugins, activá:\n\n- ✅ **Templates** (para insertar plantillas)\n- ✅ **Daily notes** (para Daily Notes automatizadas)\n- ✅ **Backlinks** (ya viene activado)\n- ✅ **Outgoing links** (ya viene activado)\n- ✅ **Graph view** (para visualizar conexiones)\n- ✅ **File explorer** (ya viene activado)\n- ✅ **Command palette** (Ctrl/Cmd+P — clave para velocidad)\n- ✅ **Quick switcher** (Ctrl/Cmd+O — clave para velocidad)", "code": "Settings → Core plugins\n  ✅ Templates\n  ✅ Daily notes\n  ✅ Backlinks\n  ✅ Outgoing links\n  ✅ Graph view\n  ✅ File explorer\n  ✅ Command palette\n  ✅ Quick switcher", "language": "bash"},
    {"order": 4, "title": "Configurar Daily Notes", "description": "Settings → Core plugins → Daily notes:\n\n- **New file location:** `05 SYSTEM/Daily Notes`\n- **Template file location:** `05 SYSTEM/Templates/TPL - Daily Note`\n- **Date format:** `YYYY-MM-DD`\n\nAhora con `Ctrl/Cmd+P` → *Open today's daily note*, te crea automáticamente la nota del día con tu plantilla.", "code": "New file location:     05 SYSTEM/Daily Notes\nTemplate file location: 05 SYSTEM/Templates/TPL - Daily Note\nDate format:           YYYY-MM-DD", "language": "bash"},
    {"order": 5, "title": "Plugins de la comunidad (recomendados)", "description": "Settings → Community plugins → Browse:\n\n| Plugin | Para qué |\n|--------|----------|\n| **Dataview** | Queries dinámicas (*mostrame todos los proyectos activos*) |\n| **Excalidraw** | Diagramas a mano dentro del vault |\n| **Calendar** | Vista de calendario para Daily Notes |\n| **Tag Wrangler** | Gestión de tags |\n| **Templater** | Plantillas avanzadas con variables dinámicas |\n\n**Recomendación:** instalá solo Dataview los primeros 30 días. El resto cuando lo necesites.", "code": "Community plugins → Browse\n  Mes 1: solo Dataview\n  Después: agregás según necesidad", "language": "bash"},
    {"order": 6, "title": "Claude Code (para Ejercicios 7-9)", "description": "**Mac / Linux:**\n```bash\ncurl -fsSL https://claude.ai/install.sh | sh\n```\n\n**Windows (PowerShell):**\n```powershell\nirm https://claude.ai/install.ps1 | iex\n```\n\nDespués verificá:\n```bash\nclaude --version\n```\n\nSi te devuelve un número, está. Si no, revisá tu PATH.\n\n**Login:**\n```bash\nclaude login\n```\nTe lleva al navegador para autenticarte con tu cuenta de Claude.", "code": "# Mac / Linux\ncurl -fsSL https://claude.ai/install.sh | sh\n\n# Windows\nirm https://claude.ai/install.ps1 | iex\n\n# Verificar\nclaude --version\n\n# Login\nclaude login", "language": "bash"},
    {"order": 7, "title": "Engram (para Ejercicio 9)", "description": "Cubierto en detalle en el Taller 01. Resumen rápido:\n\n**Mac / Linux:**\n```bash\nbrew install GentlemanProgramming/tap/engram\n```\n\n**Windows:**\n```powershell\nirm https://raw.githubusercontent.com/GentlemanProgramming/engram/main/scripts/install-windows.ps1 | iex\n```\n\n**Configurar:**\n```bash\nengram init\n```\n\n**Conectar a Claude Code** — agregá a `~/.claude/claude_desktop_config.json`:\n```json\n{\n  \"mcpServers\": {\n    \"engram\": {\n      \"command\": \"engram\",\n      \"args\": [\"mcp\"]\n    }\n  }\n}\n```", "code": "{\n  \"mcpServers\": {\n    \"engram\": {\n      \"command\": \"engram\",\n      \"args\": [\"mcp\"]\n    }\n  }\n}", "language": "json"},
    {"order": 8, "title": "Backup del vault (no negociable)", "description": "Tu vault es información valiosa. Backup desde el día 1.\n\n| Método | Cuándo elegirlo |\n|--------|-----------------|\n| **iCloud Drive / OneDrive / Dropbox** | Si querés sync automático básico (gratis) |\n| **Obsidian Sync** | Si querés sync encriptado entre dispositivos (10 USD/mes) |\n| **GitHub** | Si te gusta versionado profesional (gratis, requiere git) |\n| **Time Machine / backup local** | Backup adicional siempre |\n\n**Recomendación:** elegí UNA opción de sync + UNA opción de backup local. Dos capas.", "code": "Sync:    iCloud / OneDrive / Dropbox / Obsidian Sync\nBackup:  Time Machine / backup local externo\nMínimo:  1 sync + 1 backup local", "language": "bash"},
    {"order": 9, "title": "Verificación final", "description": "Antes de arrancar el flujo diario, asegurate de tener:\n\n- [ ] Obsidian instalado y abierto\n- [ ] Vault creado con las 6 carpetas + subcarpetas SYSTEM\n- [ ] Las 3 plantillas (Daily, Proyecto, Decisión) listas\n- [ ] Daily Notes configurado para abrir automáticamente\n- [ ] Tu Daily Note de hoy llena\n- [ ] Tu primer proyecto estructurado\n- [ ] Tu primera decisión documentada\n- [ ] Claude Code instalado y autenticado\n- [ ] Claude puede leer tu vault (Ejercicio 7 funcionó)\n- [ ] Engram instalado y conectado como MCP\n- [ ] `CLAUDE.md` en la raíz del vault con instrucciones\n- [ ] Backup configurado (mínimo 1 sync + 1 backup)\n- [ ] Compromiso de 30 días firmado\n\nSi todo ✅, **tenés un cerebro aumentado funcionando**. Mañana arrancás con el flujo diario.", "code": "Checklist completa → tenés cerebro aumentado funcionando\n(empezás el flujo diario al día siguiente)", "language": "bash"}
  ],
  "success_message": "¡Listo! Obsidian + Claude + Engram operando juntos. Mañana abrís tu Daily Note, escribís tu foco del día y dejás que el sistema empiece a respirar. Recordá: el vault no se mide por lo lindo que es — se mide por lo vivo que está después de 30 días."
}
$inst$::jsonb
FROM workshops WHERE slug = 'cerebro-aumentado-obsidian-claude-engram';

-- GLOSARIO
INSERT INTO sections (workshop_id, type, section_order, content_json)
SELECT id, 'glosario', 5,
$glo$
{"type": "glosario", "title": "Glosario del taller", "search_placeholder": "Buscá un término (ej: PARA, vault, backlink, Engram)..."}
$glo$::jsonb
FROM workshops WHERE slug = 'cerebro-aumentado-obsidian-claude-engram';

-- ============================================================
-- 4) EJERCICIOS (12)
-- ============================================================

-- EJ 1
INSERT INTO exercises (workshop_id, title, objective, prompt_text, "order")
SELECT id, 'Crear tu primer vault', 'Tener Obsidian instalado y un vault vacío esperando.',
$ej1$
**Pasos:**

1. Abrí Obsidian (ya instalado en sección Instalación)
2. *Create new vault*
3. Nombre: `mi-cerebro` (o el que prefieras — sin espacios)
4. Ubicación: `~/Documents/` (o donde guardes archivos importantes)
5. Doble click → se abre tu vault vacío

**Criterio de hecho:** tenés un vault abierto con cero notas, y sabés dónde vive físicamente en tu disco.
$ej1$, 1
FROM workshops WHERE slug = 'cerebro-aumentado-obsidian-claude-engram';

-- EJ 2
INSERT INTO exercises (workshop_id, title, objective, prompt_text, "order")
SELECT id, 'Estructura PARA + INBOX + SYSTEM', 'Crear las 6 carpetas base.',
$ej2$
En el panel izquierdo (File Explorer), click derecho → **New folder**. Creá:

```
00 INBOX
01 PROJECTS
02 AREAS
03 RESOURCES
04 ARCHIVE
05 SYSTEM
```

Dentro de `05 SYSTEM`, creá 3 subcarpetas:
- `Templates`
- `Daily Notes`
- `Decisions`

**Criterio de hecho:** tu File Explorer muestra las 6 carpetas en orden numérico y la subcarpeta SYSTEM con Templates, Daily Notes, Decisions.
$ej2$, 2
FROM workshops WHERE slug = 'cerebro-aumentado-obsidian-claude-engram';

-- EJ 3
INSERT INTO exercises (workshop_id, title, objective, prompt_text, "order")
SELECT id, 'Crear las 3 plantillas fundamentales', 'Tener las plantillas listas para usar.',
$ej3$
Dentro de `05 SYSTEM/Templates/`, creá 3 archivos:

### 1. `TPL - Daily Note.md`

```markdown
---
tipo: daily
fecha: {{date:YYYY-MM-DD}}
estado: 🟢
---

# {{date:YYYY-MM-DD}}

## Foco del día
-

## Lo que hice
-

## Decisiones tomadas
-

## Aprendizajes
-

## Pendientes para mañana
-
```

### 2. `TPL - Proyecto.md`

```markdown
---
tipo: proyecto
estado: activo
prioridad: alta
fecha_inicio:
fecha_cierre:
area:
---

# {{title}}

## Objetivo
## Resultado esperado
## Stakeholders / personas
## Decisiones tomadas
## Próximos pasos
## Notas relacionadas
```

### 3. `TPL - Decisión.md`

```markdown
---
tipo: decision
fecha: {{date:YYYY-MM-DD}}
estado: tomada
revision_30d:
---

# Decisión: {{title}}

## Contexto
## Opciones consideradas
## Decisión final
## Rationale
## Riesgos asumidos
## Cómo voy a saber si funcionó
```

**Configurá el plugin Templates** (viene con Obsidian):
- Settings → Core plugins → Templates → activá
- Templates folder location → `05 SYSTEM/Templates`

**Criterio de hecho:** podés crear una nota nueva, abrir command palette (Ctrl/Cmd + P), buscar *Insert template* y elegir una de las 3.
$ej3$, 3
FROM workshops WHERE slug = 'cerebro-aumentado-obsidian-claude-engram';

-- EJ 4
INSERT INTO exercises (workshop_id, title, objective, prompt_text, "order")
SELECT id, 'Tu primera Daily Note', 'Registrar el día de hoy y entender el flujo.',
$ej4$
**Pasos:**

1. En `05 SYSTEM/Daily Notes/`, creá una nota con la fecha de hoy: `2026-06-12.md`
2. Insertá la plantilla Daily Note (Ctrl/Cmd+P → Insert template → TPL - Daily Note)
3. Llená:
   - **Foco del día:** una sola cosa importante
   - **Lo que hice:** los puntos del día
   - **Decisiones tomadas:** si hubo
   - **Aprendizajes:** algo que aprendiste hoy
   - **Pendientes para mañana:** próximos pasos

**Criterio de hecho:** tu Daily Note de hoy está llena. Si te cuesta llenarla, está bien — vas a mejorar con la práctica.
$ej4$, 4
FROM workshops WHERE slug = 'cerebro-aumentado-obsidian-claude-engram';

-- EJ 5
INSERT INTO exercises (workshop_id, title, objective, prompt_text, "order")
SELECT id, 'Tu primer proyecto en el vault', 'Estructurar un proyecto real con la metodología.',
$ej5$
**Pasos:**

1. En `01 PROJECTS/`, decidí primero: ¿es UN archivo o una CARPETA?

**Regla:**
- Proyecto chico (< 1 mes, 1-3 notas) → un archivo `Proyecto X.md`
- Proyecto grande (> 1 mes, muchas notas) → carpeta `Proyecto X/` con `Proyecto X — Hub.md` dentro

Para tu primer proyecto, elegí uno **chico**.

2. Insertá la plantilla TPL - Proyecto
3. Llená objetivo, resultado esperado, stakeholders, próximos pasos
4. Mencioná al menos 1 persona con `[[Nombre Persona]]` — eso crea automáticamente una nota para esa persona en el vault

**Criterio de hecho:** tu proyecto está estructurado. Si abrís el grafo (View → Graph view), ves tu proyecto conectado a la persona que mencionaste.
$ej5$, 5
FROM workshops WHERE slug = 'cerebro-aumentado-obsidian-claude-engram';

-- EJ 6
INSERT INTO exercises (workshop_id, title, objective, prompt_text, "order")
SELECT id, 'Tu primera decisión documentada', 'Capturar una decisión real con su rationale.',
$ej6$
**Pensá:** una decisión reciente que hayas tomado en tu trabajo o vida (las últimas 2 semanas).

**Pasos:**

1. En `05 SYSTEM/Decisions/`, creá: `Decisión - [título corto].md`
2. Insertá la plantilla TPL - Decisión
3. Completá los 6 campos: Contexto, Opciones, Decisión, Rationale, Riesgos, Métrica de éxito
4. En el frontmatter, ponele `revision_30d: 2026-07-12` (30 días desde hoy)
5. Vincúlala con tu proyecto: en el cuerpo escribí *Esta decisión afecta a [[Proyecto X]]*

**Criterio de hecho:** la decisión está registrada con tanto detalle que **un futuro vos sin contexto** podría entenderla en 2 minutos.
$ej6$, 6
FROM workshops WHERE slug = 'cerebro-aumentado-obsidian-claude-engram';

-- EJ 7
INSERT INTO exercises (workshop_id, title, objective, prompt_text, "order")
SELECT id, 'Conectar Claude Code a tu vault', 'Que Claude pueda leer y operar dentro de tu vault.',
$ej7$
**Prerequisito:** tener Claude Code instalado (ver sección Instalación).

**Pasos:**

1. Abrí la terminal (Terminal en Mac, PowerShell en Windows, terminal de tu distro en Linux)
2. Navegá a la carpeta del vault:

```bash
cd ~/Documents/mi-cerebro
```

3. Lanzá Claude Code:

```bash
claude
```

4. Pegá este prompt para validar:

```
Estás dentro de mi vault personal de Obsidian.
Listame las 6 carpetas principales y decime cuántos archivos
tiene cada una.
Después decime cuál es mi proyecto activo y resumime su objetivo
leyendo solo los archivos relevantes (no leas todo el vault).
```

Claude debería responder mostrando tu estructura PARA y leyendo el proyecto del Ejercicio 5.

**Criterio de hecho:** Claude responde con datos reales de tu vault. Si te dice *no veo archivos*, revisá que estés en la carpeta correcta.
$ej7$, 7
FROM workshops WHERE slug = 'cerebro-aumentado-obsidian-claude-engram';

-- EJ 8
INSERT INTO exercises (workshop_id, title, objective, prompt_text, "order")
SELECT id, 'Tu primera tarea operativa con Claude', 'Que Claude haga trabajo real sobre tu vault.',
$ej8$
**Prompt para Claude (en el vault):**

```
Tengo el proyecto [[Proyecto X]] en estado inicial.
Leé la nota completa y proponéme:
1. 5 próximos pasos concretos para ejecutar esta semana
2. 2 riesgos que no anoté pero deberías considerar
3. 3 personas o áreas que podrían estar implicadas
4. Una pregunta crítica que todavía no me hice

Después de proponer, no escribas nada en el vault todavía —
espera mi aprobación.
```

Revisá la propuesta. Si te gusta:

```
Buenísimo. Agregá los 5 próximos pasos a la sección
"Próximos pasos" del proyecto. Conservá lo que ya hay,
solo agregá los nuevos.
```

**Criterio de hecho:** abrís tu nota de proyecto y ves los próximos pasos actualizados por Claude. Acabás de tener tu primer colaborador-IA dentro de tu cerebro.
$ej8$, 8
FROM workshops WHERE slug = 'cerebro-aumentado-obsidian-claude-engram';

-- EJ 9
INSERT INTO exercises (workshop_id, title, objective, prompt_text, "order")
SELECT id, 'Integrar Engram en el vault', 'Que las decisiones y aprendizajes sobrevivan entre sesiones de Claude.',
$ej9$
**Prerequisito:** Engram instalado (Taller 01).

**Pasos:**

1. En la raíz del vault, creá `CLAUDE.md` con este contenido:

```markdown
# Instrucciones para Claude en este vault

Este es mi vault personal de Obsidian organizado con método PARA.

## Estructura
- `00 INBOX/` — captura sin procesar
- `01 PROJECTS/` — proyectos activos con fecha de cierre
- `02 AREAS/` — áreas de responsabilidad continua
- `03 RESOURCES/` — referencias y aprendizajes
- `04 ARCHIVE/` — cerrado o inactivo
- `05 SYSTEM/` — daily notes, templates, decisiones

## Protocolo de memoria con Engram

Después de cada conversación importante, guardá en Engram con `mem_save`:
- Decisiones tomadas (tipo: decision)
- Aprendizajes no obvios (tipo: discovery)
- Patrones que se repitan (tipo: pattern)
- Convenciones establecidas (tipo: preference)

Formato:
- title: verbo + qué pasó
- type: decision | discovery | pattern | preference | bugfix | architecture
- scope: project
- topic_key: estable, ej "decisions/proyecto-x"
- content: Qué + Por qué + Dónde + Aprendido

Self-check después de cada tarea:
"¿Hubo decisión, aprendizaje, patrón o convención? → mem_save AHORA."

## Búsqueda de contexto

Cuando el usuario pregunte sobre algo que pueda estar en memoria:
1. Primero mem_context (rápido)
2. Si no encuentra, mem_search con keywords
3. Si encuentra, mem_get_observation para detalle completo
```

2. Salí de la sesión de Claude Code y volvé a entrar (para que cargue el `CLAUDE.md`):

```bash
exit
claude
```

3. Probá la integración:

```
Acabo de decidir que en [[Proyecto X]] voy a usar el enfoque Y.
Mi rationale es: [acá tu rationale real].
Guardá esta decisión en Engram para que la próxima sesión la recuerdes.
```

Claude debería ejecutar `mem_save` y confirmarte el ID de la observación.

4. Cerrá Claude y abrilo de nuevo en una sesión nueva. Preguntá:

```
¿Qué decisiones tomé en [[Proyecto X]]?
```

Si Claude busca en Engram y te trae la decisión que guardaste antes, **la integración funciona**.

**Criterio de hecho:** podés cerrar y abrir Claude tantas veces como quieras, y la memoria de las decisiones persiste.
$ej9$, 9
FROM workshops WHERE slug = 'cerebro-aumentado-obsidian-claude-engram';

-- EJ 10
INSERT INTO exercises (workshop_id, title, objective, prompt_text, "order")
SELECT id, 'Tu flujo diario de cierre', 'Dejar instalado el ritual que hace que el vault viva.',
$ej10$
**Plantilla del cierre del día (5-10 min):**

```
1. Abrir la Daily Note de hoy
2. Completar todo lo que quedó vacío
3. Procesar INBOX:
   - Para cada nota nueva, decidir: PROJECT / AREA / RESOURCE / ARCHIVE
   - Moverla a su carpeta
4. Si hubo decisión importante hoy:
   - Crear nota en 05 SYSTEM/Decisions/
   - Pedirle a Claude que la guarde en Engram
5. Pendientes para mañana — escribir 1 a 3 cosas
6. Cerrar Obsidian
```

**Hacelo hoy mismo** como práctica.

**Criterio de hecho:** podés ejecutar el ritual en menos de 10 minutos.
$ej10$, 10
FROM workshops WHERE slug = 'cerebro-aumentado-obsidian-claude-engram';

-- EJ 11
INSERT INTO exercises (workshop_id, title, objective, prompt_text, "order")
SELECT id, 'El cierre semanal con Claude', 'Que Claude te ayude a sintetizar la semana.',
$ej11$
*Vas a hacer el primero al día 7 de práctica con el vault.*

**Prompt para Claude (cada domingo):**

```
Hacé un cierre de semana.

Pasos:
1. Leé las Daily Notes de los últimos 7 días en 05 SYSTEM/Daily Notes/
2. Listame:
   - Las 3 decisiones más importantes de la semana
   - Los 5 aprendizajes principales
   - Las personas con las que más interactué
   - Los proyectos con más actividad
3. Identificá:
   - Patrones que se repitieron
   - Pendientes que se vienen arrastrando
   - Algo que olvidé hacer
4. Proponéme:
   - El foco para la próxima semana (UNA cosa, no diez)
   - 2 ajustes al sistema basados en lo que vi

Al final, guardá en Engram los aprendizajes principales como
observaciones tipo discovery con topic_key "weekly-review/2026-XX-XX".
```

**Criterio de hecho:** tenés un cierre semanal escrito que te da claridad sobre dónde estuviste y hacia dónde va la próxima semana.
$ej11$, 11
FROM workshops WHERE slug = 'cerebro-aumentado-obsidian-claude-engram';

-- EJ 12
INSERT INTO exercises (workshop_id, title, objective, prompt_text, "order")
SELECT id, 'Tu plan de 30 días con el vault', 'Convertir el vault en hábito antes de que se enfríe.',
$ej12$
**Compromiso de 30 días — completá:**

```
DURANTE LOS PRÓXIMOS 30 DÍAS:

- Abrir el vault TODOS los días
- Llenar mi Daily Note (mínimo: foco + lo que hice + pendientes)
- Procesar INBOX al cierre del día
- Documentar al menos 1 decisión importante por semana
- Hacer cierre semanal con Claude los domingos

AL DÍA 30:
- Revisar:
  - ¿Cuántos proyectos abrí, cerré, archivé?
  - ¿Cuántas decisiones registré?
  - ¿Qué patrones surgieron?
- Ajustar el sistema según lo que aprendí

Si fallo algún día, no abandono. Vuelvo al siguiente.

Firma: ____________
Fecha: ____________
```

**Criterio de hecho:** está firmado y visible. El vault necesita 30 días para volverse hábito.
$ej12$, 12
FROM workshops WHERE slug = 'cerebro-aumentado-obsidian-claude-engram';

-- ============================================================
-- 5) GLOSARIO (29 términos)
-- ============================================================
INSERT INTO glossary_terms (workshop_id, term, definition, category)
SELECT w.id, t.term, t.definition, t.category FROM workshops w,
(VALUES
  -- Metodología (método PARA y conceptos del segundo cerebro)
  ('PARA', 'Método de organización: Projects · Areas · Resources · Archive. Creado por Tiago Forte.', 'metodologia'),
  ('Project', 'Primera carpeta del método PARA. Proyectos activos con fecha de cierre.', 'metodologia'),
  ('Area', 'Segunda carpeta del método PARA. Áreas de responsabilidad continua sin fecha de cierre.', 'metodologia'),
  ('Resource', 'Tercera carpeta del método PARA. Referencias y aprendizajes para usar después.', 'metodologia'),
  ('Archive', 'Cuarta carpeta del método PARA. Lo cerrado o inactivo.', 'metodologia'),
  ('INBOX', 'Carpeta donde entra todo lo nuevo sin clasificar. Se procesa al cierre del día.', 'metodologia'),
  ('Second Brain (Segundo Cerebro)', 'Sistema externo de gestión de conocimiento que libera al cerebro biológico para pensar y crear.', 'metodologia'),
  ('Building a Second Brain (BASB)', 'Metodología creada por Tiago Forte para construir sistemas de gestión personal del conocimiento.', 'metodologia'),
  ('Daily Note', 'Nota diaria que ancla el sistema. Lo que pasó, decidiste, aprendiste cada día.', 'metodologia'),
  ('Capture', 'Acción de registrar información en el sistema sin procesarla todavía.', 'metodologia'),
  ('Switching cost', 'Costo cognitivo de cambiar de contexto entre tareas o proyectos.', 'metodologia'),
  -- Obsidian (la herramienta y sus conceptos)
  ('Obsidian', 'Software de notas conectadas. Local-first, Markdown, gratis para uso personal.', 'obsidian'),
  ('Vault (Bóveda)', 'La carpeta donde vive un cerebro de Obsidian. Es una carpeta común con archivos Markdown.', 'obsidian'),
  ('Obsidian Sync', 'Servicio de pago de Obsidian para sincronizar vaults entre dispositivos con encriptación.', 'obsidian'),
  ('Backlink', 'Conexión automática entre notas en Obsidian. Si una nota A menciona a B, en B aparece *mencionada en A*.', 'obsidian'),
  ('Wikilinks', 'Sintaxis `[[doble corchetes]]` para crear links a notas en Obsidian.', 'obsidian'),
  ('Frontmatter', 'Metadata YAML al inicio de una nota Markdown. Entre `---` y `---`.', 'obsidian'),
  ('YAML', 'Formato de metadata estructurada usado en el frontmatter de las notas.', 'obsidian'),
  ('Markdown (.md)', 'Formato de archivo de texto plano con sintaxis simple. El formato que usa Obsidian.', 'obsidian'),
  ('Plantilla (Template)', 'Estructura predefinida para crear notas nuevas rápido y con formato consistente.', 'obsidian'),
  ('Tag', 'Etiqueta con `#` para clasificar notas por tema. Conecta a nivel temático, no por nota.', 'obsidian'),
  ('Grafo (Graph view)', 'Vista visual en Obsidian que muestra todas las notas y sus conexiones.', 'obsidian'),
  ('Plugin', 'Extensión de Obsidian que agrega funcionalidades (Dataview, Calendar, Excalidraw, etc.).', 'obsidian'),
  ('Dataview', 'Plugin de Obsidian que permite hacer queries sobre el frontmatter de las notas.', 'obsidian'),
  ('Templater', 'Plugin avanzado de plantillas con variables dinámicas y código JavaScript.', 'obsidian'),
  -- Herramientas IA (Claude + Engram + MCP)
  ('Claude Code', 'CLI oficial de Anthropic para usar Claude como agente que opera en archivos del disco.', 'herramientas-ia'),
  ('CLAUDE.md', 'Archivo de instrucciones que Claude Code lee al inicio de cada sesión en un proyecto/vault.', 'herramientas-ia'),
  ('Engram', 'Servidor MCP de memoria persistente para agentes de IA. Cubierto en Taller 01.', 'herramientas-ia'),
  ('MCP (Model Context Protocol)', 'Protocolo para conectar agentes de IA con herramientas externas. Engram es un MCP server.', 'herramientas-ia')
) AS t(term, definition, category)
WHERE w.slug = 'cerebro-aumentado-obsidian-claude-engram';

-- ============================================================
-- VERIFICACIÓN FINAL
-- ============================================================
-- Después de correr todo, corré esto para confirmar:
--
-- SELECT
--   w.title,
--   (SELECT COUNT(*) FROM sections WHERE workshop_id = w.id) AS secciones,
--   (SELECT jsonb_array_length(content_json->'slides') FROM sections WHERE workshop_id = w.id AND type = 'aprendizaje') AS slides,
--   (SELECT COUNT(*) FROM exercises WHERE workshop_id = w.id) AS ejercicios,
--   (SELECT COUNT(*) FROM glossary_terms WHERE workshop_id = w.id) AS terminos
-- FROM workshops w WHERE slug = 'cerebro-aumentado-obsidian-claude-engram';
--
-- Esperado: 5 secciones · 17 slides · 12 ejercicios · 29 términos
