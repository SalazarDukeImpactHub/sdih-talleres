-- ============================================================
-- TALLER 08 — AI Regulation & Compliance: Gobernanza de IA en Colombia
-- ============================================================
-- Cómo usar este archivo:
-- Opción A (recomendada): abrir en TablePlus conectado a Supabase y correr todo de una.
-- Opción B: pegar entero en Supabase SQL Editor (web).
--
-- Es idempotente: el DELETE inicial limpia residuos de intentos previos.
-- Si todo va bien al final tenés: 1 workshop, 5 secciones (con 12 slides
-- de aprendizaje), 6 ejercicios + 5 pasos de instalación con prompts
-- listos para IA, y 30 términos de glosario.
-- ============================================================

-- 1) Cleanup defensivo
DELETE FROM workshops WHERE slug = 'ai-regulation-compliance-colombia';

-- 2) Workshop
INSERT INTO workshops (
  slug, title, description, instructor,
  date_live, duration_min, prerequisites, status,
  whatsapp_message_template
) VALUES (
  'ai-regulation-compliance-colombia',
  'AI Regulation & Compliance: Gobernanza de IA para tu empresa en Colombia',
  'Ya usás IA en tu empresa — o estás a punto — y empezaron las preguntas incómodas. ¿Qué pasa si el modelo da una respuesta discriminatoria? ¿Quién es responsable si una decisión tomada con IA le hace daño a alguien? ¿Tiene tu empresa alguna política sobre esto? Este taller no te da teoría. Te da un sistema de gobernanza de IA listo para implementar — construido durante 4 horas con prompts que podés usar con cualquier IA para personalizarlo exactamente a tu empresa. Al final tu empresa tiene una política de IA real (no un intento), un inventario de sistemas, un protocolo de incidentes y un plan de 90 días para implementar. Basado en los 5 marcos globales: EU AI Act, NIST AI RMF, ISO 42001, OCDE y UNESCO — adaptado al contexto colombiano (Ley 1581, CONPES 3975, SIC).',
  'Jennifer Salazar Duque',
  NULL,
  360,
  'Para aprovechar al máximo: usar IA en tu empresa o equipo (aunque sea ChatGPT para emails); tener acceso a al menos una herramienta de IA durante el taller (Claude, ChatGPT, Gemini); traer información básica de tu empresa (qué hacés, cuántas personas tenés, en qué usás IA hoy). NO necesitás: saber programar; conocer los marcos regulatorios de antemano; tener ya una política de IA. Si sos consultor o asesor, los prompts del taller los podés usar directamente con tus clientes — están diseñados para generar materiales específicos para cada empresa, no documentos genéricos. Duración: 4h en vivo + 2h de trabajo autónomo.',
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
  "title": "Bienvenida — del riesgo difuso al sistema operativo",
  "description": "## Si llegaste hasta acá\n\nProbablemente ya usás IA en tu empresa — o estás a punto de hacerlo — y empezaste a hacerte preguntas incómodas:\n\n- ¿Qué pasa si el modelo da una respuesta discriminatoria?\n- ¿Quién es responsable si una decisión tomada con IA le hace daño a alguien?\n- ¿Cómo sé que los datos de mis clientes están siendo tratados bien?\n- ¿Tiene mi empresa alguna política sobre esto?\n\nLa mayoría responde esas preguntas con silencio. O peor: con un *lo vemos después*.\n\n**El mundo ya no te va a esperar.** El AI Act europeo está vigente. Las empresas colombianas que trabajan con clientes, proveedores o datos de personas en Europa ya tienen obligaciones concretas. Y aunque Colombia todavía no tiene una ley de IA aprobada, los marcos internacionales ya están definiendo los estándares que van a pedir los clientes grandes, los fondos de inversión y los socios internacionales.\n\nEste taller no te da teoría. Te da un **sistema de gobernanza de IA listo para implementar en tu empresa** — construido durante las 4 horas que estamos juntos, con prompts que podés usar con cualquier IA para personalizarlo exactamente a tu contexto.\n\n**Al final de este taller tu empresa tiene una política de IA. No un intento. Una política real.**\n\n## Qué vas a salir teniendo\n\n1. Entender qué dicen los **5 marcos globales** de gobernanza de IA y qué le aplica a Colombia hoy\n2. Un **inventario de sistemas de IA** de tu empresa completado\n3. Una **política interna de uso de IA** lista para compartir con tu equipo\n4. Un **sistema mínimo de logging y trazabilidad** definido\n5. Saber cómo **responder ante un incidente de IA** sin quedar expuesto\n6. Un **plan de implementación de 90 días** para tu empresa\n\n## Una advertencia honesta\n\nLa mayoría de los talleres de *IA y cumplimiento* terminan con un PDF de 40 páginas que nadie lee y una carpeta de Google Drive que nadie vuelve a abrir.\n\n**Este no.**\n\nCada ejercicio produce un documento real que tu empresa puede implementar la semana siguiente. Y cada prompt está diseñado para que cualquier IA lo complete con la información específica de tu empresa — no con texto genérico de relleno.\n\n> **La gobernanza de IA no es un proyecto de una semana. Pero arrancar sí.**",
  "quick_links": [
    {"label": "12 diapositivas — los 5 marcos globales", "target_section": "aprendizaje"},
    {"label": "6 ejercicios — construí tu sistema", "target_section": "taller"},
    {"label": "5 pasos para implementarlo + plan 90 días", "target_section": "instalacion"},
    {"label": "Glosario", "target_section": "glosario"}
  ]
}
$inicio$::jsonb
FROM workshops WHERE slug = 'ai-regulation-compliance-colombia';

-- APRENDIZAJE (12 slides)
INSERT INTO sections (workshop_id, type, section_order, content_json)
SELECT id, 'aprendizaje', 2,
$apr$
{
  "type": "aprendizaje",
  "title": "Los 5 marcos globales y el contexto colombiano",
  "slides": [
    {"kicker": "Diapositiva 1 · El momento", "title": "El momento en que vivimos", "body": "En 2024 la Unión Europea aprobó el primer marco legal vinculante sobre IA del mundo. En 2025 empezaron a aplicarse las primeras obligaciones. En 2026 entran en vigor las más exigentes.\n\nPero esto no es solo un tema europeo.\n\nSi tu empresa tiene clientes en Europa, proveedores en Europa, o procesa datos de personas en Europa — **ya estás dentro del alcance del AI Act**, aunque estés operando desde Bogotá.\n\nY aunque no tengas ningún vínculo con Europa: los estándares globales de gobernanza de IA ya están definiendo qué empresas van a poder acceder a financiamiento internacional, alianzas estratégicas y clientes corporativos grandes en los próximos 3 años.\n\n> **La pregunta no es si vas a tener que implementar gobernanza de IA. La pregunta es si lo hacés ahora o cuando te lo exijan.**", "notes": null},
    {"kicker": "Diapositiva 2 · El ecosistema", "title": "Los 5 marcos que importan", "body": "No hay un solo documento. Hay un ecosistema. Estos son los 5 que importan y qué tiene cada uno:\n\n| Marco | Origen | Tipo | Qué aporta |\n|-------|--------|------|-----------|\n| **EU AI Act** | Unión Europea | Legal vinculante | Obligaciones concretas por nivel de riesgo |\n| **NIST AI RMF** | EE.UU. (gobierno) | Voluntario / práctico | El mejor framework de gestión de riesgos |\n| **ISO/IEC 42001** | Internacional | Estándar certificable | El sistema de gestión más riguroso |\n| **OECD AI Principles** | OCDE (38 países) | Principios / política | La base filosófica adoptada por el G20 |\n| **UNESCO Recommendation** | ONU (193 países) | Ética global | El marco de derechos humanos y diversidad |\n\nNinguno solo es suficiente. **Juntos forman el sistema.**", "notes": null},
    {"kicker": "Diapositiva 3 · El más estricto", "title": "EU AI Act — lo que necesitás saber", "body": "El AI Act clasifica los sistemas de IA en **4 niveles de riesgo**:\n\n### Riesgo inaceptable → Prohibido\n- IA que manipula comportamiento de personas sin consentimiento\n- Sistemas de puntuación social por el gobierno\n- Reconocimiento facial en espacios públicos en tiempo real (con excepciones)\n\n### Riesgo alto → Obligaciones estrictas\n- IA en contratación laboral, crédito, salud, educación, infraestructura crítica\n- Requiere: logging, trazabilidad, supervisión humana, registro en base de datos de la UE\n\n### Riesgo limitado → Transparencia\n- Chatbots, IA generativa de contenido\n- Requiere: informar al usuario que está interactuando con IA\n\n### Riesgo mínimo → Sin obligaciones adicionales\n- Filtros de spam, IA en videojuegos\n\n**¿Qué aplica a tu empresa en Colombia?**\n\nSi procesás datos de personas europeas o tenés clientes europeos → los niveles de riesgo aplican a tus sistemas. Si no → te aplican las buenas prácticas, no las obligaciones legales. **Pero esas buenas prácticas son exactamente lo que tus clientes grandes van a empezar a pedirte.**", "notes": null},
    {"kicker": "Diapositiva 4 · El más práctico", "title": "NIST AI RMF — las 4 funciones", "body": "El framework del NIST (Instituto Nacional de Estándares de EE.UU.) define **4 funciones** para gestionar el riesgo de IA:\n\n### GOBERNAR\n*¿Quién decide cómo usamos IA en nuestra empresa?*\nPolíticas, roles, responsabilidades, cultura organizacional.\n\n### MAPEAR\n*¿Dónde está la IA en nuestra empresa?*\nInventario de sistemas, contexto de uso, partes afectadas.\n\n### MEDIR\n*¿Cómo de riesgosos son nuestros sistemas de IA?*\nEvaluación de riesgos, métricas, monitoreo continuo.\n\n### GESTIONAR\n*¿Qué hacemos con los riesgos identificados?*\nMitigación, respuesta a incidentes, mejora continua.\n\n**Por qué es el más útil para Colombia:** porque está diseñado para ser adaptable a cualquier tamaño de empresa y cualquier contexto legal. No requiere cumplir una ley — requiere tener un proceso.", "notes": null},
    {"kicker": "Diapositiva 5 · El certificable", "title": "ISO 42001 — si querés certificarte", "body": "La **ISO 42001** es a la gestión de IA lo que la ISO 27001 es a la ciberseguridad: el estándar certificable más riguroso del mercado.\n\nRequiere:\n- Política de IA documentada y aprobada por la alta dirección\n- Inventario de sistemas de IA con evaluación de riesgo\n- Roles y responsabilidades definidos (incluido un responsable de IA)\n- Procesos de gestión del ciclo de vida de los sistemas\n- Auditorías internas y revisiones periódicas\n- Plan de mejora continua\n\n**¿Lo necesitás ahora?** Probablemente no, si sos una empresa pequeña. Pero construir tu gobernanza siguiendo la lógica de la ISO 42001 significa que **cuando llegue el momento de certificarte, ya tenés el 80% del trabajo hecho**.", "notes": null},
    {"kicker": "Diapositiva 6 · Los principios", "title": "OECD y UNESCO — la base filosófica", "body": "Los principios de la OCDE (adoptados por el G20 y base del EU AI Act) son 5:\n\n1. **Crecimiento inclusivo** — la IA debe beneficiar a todas las personas, no solo a quienes tienen acceso\n2. **Valores humanos** — la IA debe respetar el estado de derecho y los derechos humanos\n3. **Transparencia** — las personas deben poder entender cómo les afecta la IA\n4. **Robustez** — los sistemas de IA deben ser seguros y funcionar como se espera\n5. **Responsabilidad** — las empresas que usan IA deben poder ser auditadas y rendir cuentas\n\nLa **UNESCO** agrega el enfoque de **diversidad cultural y género**: los sistemas de IA no pueden reproducir ni amplificar sesgos históricos.\n\n**Por qué importa para Colombia:** estos principios son la base de lo que los fondos internacionales, las alianzas y los clientes corporativos van a pedir en sus due diligence de **ESG** (Environmental, Social, Governance) a partir de 2026.", "notes": null},
    {"kicker": "Diapositiva 7 · Colombia hoy", "title": "El contexto regulatorio colombiano", "body": "Colombia no tiene aún una ley de IA aprobada. Pero sí tiene:\n\n- **Ley 1581 de 2012** (Habeas Data) — aplica a sistemas de IA que procesan datos personales\n- **Decreto 1377 de 2013** — reglamentación del tratamiento de datos\n- **CONPES 3975 de 2019** — Política Nacional de IA (hoja de ruta, no ley)\n- **MinTIC** trabajando en regulación de IA desde 2023\n\n**Lo que significa hoy:**\n\n- Si tu IA procesa datos personales de colombianos → la Ley 1581 ya aplica\n- Si tenés clientes en sectores regulados (salud, finanzas) → sus reguladores empiezan a pedir políticas de IA\n- Si exportás servicios → los estándares internacionales ya aplican\n\n> **La ventana de oportunidad:** las empresas colombianas que implementen gobernanza de IA hoy van a estar 2 a 3 años adelante de sus competidores cuando llegue la regulación local.", "notes": null},
    {"kicker": "Diapositiva 8 · El sistema mínimo", "title": "Los 3 documentos que toda empresa necesita", "body": "Independientemente de tu tamaño, sector o nivel de uso de IA, toda empresa necesita 3 documentos:\n\n### 1. Política de uso de IA\nQué IA podemos usar, para qué, con qué restricciones, quién aprueba excepciones.\n\n### 2. Inventario de sistemas de IA\nQué herramientas de IA están activas en la empresa, quién las usa, qué datos procesan.\n\n### 3. Protocolo de incidentes de IA\nQué hacemos si algo sale mal — error, sesgo, daño a un usuario, brecha de datos.\n\n**Estos 3 documentos los vas a construir hoy.**", "notes": null},
    {"kicker": "Diapositiva 9 · La trazabilidad", "title": "El sistema de logging mínimo viable", "body": "**Logging** en el contexto de gobernanza de IA significa: *dejar registro de cómo se usó la IA y qué decidió*.\n\n### ¿Por qué importa?\n- Si hay un error, podés rastrear qué pasó\n- Si hay una auditoría, podés demostrar que tuviste supervisión\n- Si el modelo cambia de comportamiento, podés detectarlo\n\nEl logging mínimo viable para una empresa colombiana **no requiere infraestructura técnica compleja**. Requiere **consistencia**:\n\n- Qué sistema de IA se usó\n- Quién lo usó\n- Para qué decisión o tarea\n- Qué input se le dio\n- Qué output produjo\n- Si hubo supervisión humana antes de usar ese output\n\n**Un spreadsheet bien mantenido ya es logging.** El objetivo es que si te preguntan *¿cómo tomaste esa decisión?* — tengas la respuesta.", "notes": null},
    {"kicker": "Diapositiva 10 · El humano", "title": "El rol del humano en el loop", "body": "Todos los marcos coinciden en un punto: **la IA no puede ser el decisor final en decisiones de alto impacto sobre personas**.\n\nEsto **no significa** que no podés usar IA para contratar, evaluar crédito o diagnosticar. Significa que **siempre tiene que haber un humano** que revise, entienda y asuma la responsabilidad de la decisión final.\n\n**Human-in-the-loop** no es un concepto filosófico. Es un requisito de gobernanza que protege a tu empresa de responsabilidad legal.\n\n> **La pregunta práctica es:** ¿en cuáles de tus procesos la IA toma decisiones sin que nadie las revise?\n\nEse es exactamente el lugar donde necesitás empezar.", "notes": null},
    {"kicker": "Diapositiva 11 · El error común", "title": "Gobernanza no es burocracia", "body": "El error más común: pensar que gobernanza de IA significa crear un departamento de compliance, contratar un abogado especialista y producir documentos que nadie lee.\n\n**La gobernanza de IA que funciona es:**\n\n- **Simple** — tres documentos, no treinta\n- **Operativa** — integrada al trabajo diario, no paralela\n- **Viva** — actualizada cuando cambia el uso de IA, no archivada\n- **Entendible** — cualquier miembro del equipo puede leerla y seguirla\n\n**El objetivo no es demostrar cumplimiento.** El objetivo es que tu empresa **use IA de forma responsable** y pueda demostrarlo cuando alguien lo pregunte.", "notes": null},
    {"kicker": "Diapositiva 12 · Cierre", "title": "Lo que te llevás hoy", "body": "Al final de este taller tenés:\n\n1. **Inventario de IA de tu empresa** — completo, con evaluación de riesgo básica\n2. **Política interna de uso de IA** — lista para aprobar y compartir con tu equipo\n3. **Protocolo de incidentes** — qué hacer si algo sale mal\n4. **Sistema de logging mínimo viable** — definido y listo para implementar\n5. **Plan de 90 días** — qué hacer primero, qué después, qué puede esperar\n\n> **Cada documento fue construido con prompts diseñados para tu empresa específica. No son plantillas genéricas.**", "notes": null}
  ]
}
$apr$::jsonb
FROM workshops WHERE slug = 'ai-regulation-compliance-colombia';

-- TALLER
INSERT INTO sections (workshop_id, type, section_order, content_json)
SELECT id, 'taller', 3,
$taller$
{
  "type": "taller",
  "title": "6 ejercicios — construí tu sistema de gobernanza",
  "instructions": "Tenés **6 ejercicios**. Cada uno tiene un **prompt listo para usar con cualquier IA** (Claude, ChatGPT, Gemini o cualquier otra). El prompt está diseñado para generar un documento personalizado para tu empresa, **no texto genérico**. Completá los campos entre corchetes antes de ejecutarlo.\n\n**Ejercicio 1**: Inventario de sistemas de IA — saber dónde está la IA en tu empresa hoy.\n\n**Ejercicio 2**: Política interna de uso de IA — el documento oficial que define qué se puede, qué no, y quién decide.\n\n**Ejercicio 3**: Evaluación de riesgo del sistema de IA más crítico de tu empresa.\n\n**Ejercicio 4**: Lineamientos específicos por área (Marketing, HR, Finanzas, etc.).\n\n**Ejercicio 5**: Sistema de logging y trazabilidad — implementable en 1 día sin infraestructura técnica.\n\n**Ejercicio 6**: Protocolo de respuesta a incidentes — qué hacer si algo sale mal, con checklist de las primeras 24h.\n\n**Reglas del taller:**\n- Hacelos en orden — cada uno alimenta al siguiente\n- Personalizá los prompts con datos REALES de tu empresa antes de ejecutarlos\n- Revisá críticamente lo que devuelve la IA — vos sos la persona que conoce tu contexto, no la IA\n- Cada output es un **documento real**, no un borrador para archivar\n- Si sos consultor/a, usalos con tus clientes — los prompts están diseñados para eso",
  "placeholder": "Si no ves los ejercicios todavía, recargá la página."
}
$taller$::jsonb
FROM workshops WHERE slug = 'ai-regulation-compliance-colombia';

-- INSTALACIÓN
INSERT INTO sections (workshop_id, type, section_order, content_json)
SELECT id, 'instalacion', 4,
$inst$
{
  "type": "instalacion",
  "title": "Implementación — pasos para que el sistema viva",
  "steps": [
    {"order": 1, "title": "Armar tu carpeta de gobernanza", "description": "Todos los documentos que creaste en el taller necesitan un hogar. No importa qué herramienta uses — lo que importa es que sea **accesible para todo el equipo** y que tenga una persona responsable.\n\n**Estructura recomendada:**\n\n```\nGobernanza de IA — [TU EMPRESA]\n├── 01 - Política de uso de IA [versión + fecha]\n├── 02 - Inventario de sistemas de IA [actualizado: fecha]\n├── 03 - Evaluaciones de riesgo\n├── 04 - Lineamientos por área\n├── 05 - Sistema de logging\n└── 06 - Protocolo de incidentes\n```\n\n**Prompt para configurar tu sistema:**\n\n```\nSos un experto en implementación de sistemas de gestión para empresas colombianas.\n\nNecesito configurar mi sistema de gobernanza de IA en [NOTION / GOOGLE DRIVE / SHAREPOINT / OTRA].\n\nMI EMPRESA: [NOMBRE], sector [SECTOR], [NÚMERO] personas.\nHerramienta elegida: [HERRAMIENTA]\nNivel técnico del equipo: [BAJO / MEDIO / ALTO]\n\nDiseñá:\n1. La estructura de carpetas y páginas óptima para esta herramienta\n2. Los permisos recomendados (quién puede ver, quién puede editar)\n3. Un índice o dashboard de gobernanza que muestre el estado de cada documento\n4. Un sistema de versiones simple (cómo saber cuál documento es el vigente)\n5. Cómo vincular el sistema de logging al repositorio de gobernanza\n6. Recordatorios o automatizaciones simples para las revisiones periódicas\n\nDame instrucciones paso a paso para configurarlo en menos de 2 horas.\n```", "code": "Gobernanza de IA - [TU EMPRESA]\n├── 01 - Política de uso de IA\n├── 02 - Inventario de sistemas de IA\n├── 03 - Evaluaciones de riesgo\n├── 04 - Lineamientos por área\n├── 05 - Sistema de logging\n└── 06 - Protocolo de incidentes", "language": "bash"},
    {"order": 2, "title": "Nombrar al responsable de IA", "description": "Todo sistema de gobernanza necesita **una persona responsable**. En una empresa pequeña puede ser el CEO, el CTO o alguien designado. Lo importante es que sea **explícito**.\n\n**Prompt para definir el rol:**\n\n```\nSos un experto en diseño organizacional con foco en gobernanza de IA para empresas latinoamericanas.\n\nMi empresa: [NOMBRE], sector [SECTOR], [NÚMERO] personas.\n\nNecesito definir el rol de Responsable de IA en mi empresa.\n\nContexto: [DESCRIBÍ BREVEMENTE CÓMO ESTÁ ORGANIZADA TU EMPRESA]\n\nCandidatos posibles: [LISTÁ 1-3 PERSONAS O PERFILES]\n\nDefiní:\n1. Nombre del rol (que tenga sentido en mi cultura organizacional)\n2. Responsabilidades concretas (qué hace semana a semana)\n3. Tiempo estimado que requiere (horas por semana)\n4. Habilidades necesarias vs habilidades que puede aprender\n5. Cómo presentar este rol al equipo sin generar resistencia\n6. Qué recursos o formación necesita para ejercerlo bien\n7. Indicadores de que el rol está funcionando bien\n\nRecomendá cuál de mis candidatos es el más adecuado y por qué.\n```", "code": "Rol:              AI Officer / Responsable de Gobernanza de IA\nTiempo semanal:   3-8 horas (depende tamaño)\nReporta a:        Dirección / CEO\nIndicador clave:  política viva + 0 incidentes sin respuesta", "language": "bash"},
    {"order": 3, "title": "Presentar la política al equipo", "description": "Una política que nadie conoce no existe. Este paso es crítico y la mayoría lo hace mal: mandan el PDF por correo y nunca más hablan del tema.\n\n**Prompt para diseñar la comunicación interna:**\n\n```\nSos un experto en comunicación interna y gestión del cambio organizacional en empresas colombianas.\n\nNecesito presentar la política de uso de IA a mi equipo de [NÚMERO] personas en el sector [SECTOR].\n\nCONTEXTO:\n- Nivel de conocimiento de IA del equipo: [BÁSICO / INTERMEDIO / AVANZADO]\n- Actitud del equipo hacia la IA: [ENTUSIASTA / NEUTRAL / RESISTENTE / MIXTA]\n- Canal principal de comunicación interna: [SLACK / TEAMS / WHATSAPP / EMAIL / REUNIONES]\n\nPREOCUPACIONES QUE ANTICIPO:\n[LISTÁ LAS 2-3 PREGUNTAS O RESISTENCIAS QUE ESPERÁS]\n\nDiseñá:\n1. El mensaje de anuncio de la política (listo para copiar y enviar)\n2. Una sesión de 30 minutos para presentar la política al equipo (agenda + puntos clave)\n3. Las 5 preguntas más frecuentes con sus respuestas\n4. Cómo medir que el equipo realmente entendió y adoptó la política (no solo que la firmó)\n5. Un mensaje de seguimiento para 30 días después del lanzamiento\n\nTono: cercano, no corporativo. Que el equipo entienda que esto los protege a ellos también, no solo a la empresa.\n```", "code": "Día 0:    Anuncio en canal principal\nDía 7:    Sesión de presentación (30 min)\nDía 14:   FAQ + canal de dudas abierto\nDía 30:   Seguimiento + medición de adopción\nDía 90:   Primera revisión formal", "language": "bash"},
    {"order": 4, "title": "Proceso de aprobación de nuevas herramientas de IA", "description": "Tu equipo va a seguir encontrando y queriendo usar nuevas herramientas de IA. Necesitás un proceso claro para evaluarlas **antes** de que entren a la operación.\n\n**Prompt para crear el proceso:**\n\n```\nSos un experto en gobierno corporativo de IA y gestión de proveedores tecnológicos.\n\nMi empresa: [NOMBRE], sector [SECTOR], [NÚMERO] personas, Colombia.\n\nNecesito un proceso simple para aprobar o rechazar el uso de nuevas herramientas de IA en mi empresa.\n\nEl proceso debe:\n- Poder completarse en menos de 1 semana para herramientas de bajo riesgo\n- Ser más riguroso para herramientas de alto riesgo\n- Poder ejecutarlo una persona sin conocimiento técnico profundo\n- Generar un registro de la decisión\n\nDiseñá:\n1. Un formulario de solicitud de nueva herramienta de IA (máximo 10 preguntas)\n2. Los criterios de evaluación (qué hace que una herramienta sea aprobada, aprobada con condiciones o rechazada)\n3. El proceso de aprobación con tiempos (quién revisa, en cuánto tiempo, quién aprueba)\n4. Un checklist de due diligence para herramientas de alto riesgo\n5. Cómo documentar la decisión para el inventario de sistemas de IA\n6. Casos especiales: ¿qué pasa si alguien ya empezó a usar una herramienta no aprobada?\n\nAdaptalo a una empresa colombiana del sector [SECTOR] con énfasis en cumplimiento de la Ley 1581 de habeas data.\n```", "code": "Bajo riesgo:    aprobación en <1 semana\nAlto riesgo:    due diligence completa + decisión documentada\nNo aprobado:    plan de transición o reemplazo\nYa en uso:      auditoría retroactiva + decisión formal", "language": "bash"},
    {"order": 5, "title": "Plan de 90 días", "description": "Con todo lo que construiste hoy, necesitás un plan de implementación realista. Uno que no dependa de tener tiempo infinito ni presupuesto extra.\n\n**Prompt para tu plan de 90 días:**\n\n```\nSos un experto en implementación de gobernanza de IA para empresas en crecimiento en Latinoamérica.\n\nMi empresa: [NOMBRE], sector [SECTOR], [NÚMERO] personas, Colombia.\n\nHoy terminé de construir mis documentos de gobernanza de IA:\n- Política de uso de IA: [LISTA / EN PROCESO / COMPLETA]\n- Inventario de sistemas de IA: [LISTA / EN PROCESO / COMPLETA]\n- Evaluaciones de riesgo: [LISTA / EN PROCESO / COMPLETA]\n- Lineamientos por área: [LISTA / EN PROCESO / COMPLETA]\n- Sistema de logging: [LISTA / EN PROCESO / COMPLETA]\n- Protocolo de incidentes: [LISTA / EN PROCESO / COMPLETA]\n\nRecursos disponibles:\n- Tiempo dedicado a gobernanza por semana: [HORAS]\n- Presupuesto mensual disponible: [MONTO O \"NINGUNO\"]\n- Persona responsable: [ROL]\n\nCrea mi plan de 90 días con:\n1. Las 3 acciones prioritarias de la primera semana\n2. Los hitos del primer mes (30 días)\n3. Los hitos del segundo mes (60 días)\n4. Los hitos del tercer mes (90 días)\n5. Lo que puedo posponer para después de los 90 días sin riesgo\n6. Los indicadores de que la gobernanza está funcionando\n7. La primera revisión formal: cuándo hacerla y qué revisar\n\nSé realista con los tiempos — esta persona tiene otras responsabilidades además de gobernanza de IA.\n```\n\n**Criterio de hecho:** tenés un plan de implementación con fechas concretas, responsable asignado e indicadores de éxito.", "code": "Semana 1:  3 acciones prioritarias\nMes 1:     política aprobada + responsable nombrado + inventario v1\nMes 2:     logging operando + lineamientos por área distribuidos\nMes 3:     primera revisión formal + ajustes\nPost 90d:  ISO 42001 si aplica, certificación, escala", "language": "bash"}
  ],
  "success_message": "Con estos 5 pasos y un responsable asignado, en 90 días tenés gobernanza de IA real en tu empresa. No es un proyecto que termina — es un sistema que vive. La primera revisión formal en el día 90 te dice qué funciona, qué ajustar y qué profundizar. La ventana de oportunidad sigue abierta: las empresas que arrancan hoy están 2-3 años adelante cuando llegue la regulación local en Colombia."
}
$inst$::jsonb
FROM workshops WHERE slug = 'ai-regulation-compliance-colombia';

-- GLOSARIO
INSERT INTO sections (workshop_id, type, section_order, content_json)
SELECT id, 'glosario', 5,
$glo$
{"type": "glosario", "title": "Glosario del taller", "search_placeholder": "Buscá un término (ej: AI Act, NIST, ISO 42001, SIC)..."}
$glo$::jsonb
FROM workshops WHERE slug = 'ai-regulation-compliance-colombia';

-- ============================================================
-- 4) EJERCICIOS (6) — cada uno con un prompt listo para IA
-- ============================================================

-- EJ 1
INSERT INTO exercises (workshop_id, title, objective, prompt_text, "order")
SELECT id, 'Inventario de sistemas de IA', 'Saber exactamente dónde está la IA en tu empresa hoy — incluyendo las herramientas que no pensaste que eran IA.',
$ej1$
**Antes de ejecutar el prompt:** hacé una lista rápida de **todas** las herramientas digitales que usa tu empresa (incluí las del día a día: correo, CRM, herramientas de diseño, asistentes, etc.). **No filtrés nada todavía.**

**Prompt para tu IA:**

```
Sos un experto en gobernanza de IA para empresas latinoamericanas, especialmente colombianas.

Mi empresa se llama [NOMBRE DE TU EMPRESA].
Nos dedicamos a [QUÉ HACE TU EMPRESA EN 2 ORACIONES].
Tenemos aproximadamente [NÚMERO] personas en el equipo.

Usamos las siguientes herramientas digitales en nuestra operación diaria:
[LISTA TODAS LAS HERRAMIENTAS QUE ANOTASTE]

Tu tarea:
1. Identificá cuáles de esas herramientas tienen componentes de IA (muchas lo tienen aunque no lo digan explícitamente)
2. Para cada una que tenga IA, clasificala según el nivel de riesgo del EU AI Act: inaceptable / alto / limitado / mínimo
3. Indicá qué datos procesa cada sistema de IA identificado (datos personales, datos financieros, datos de salud, etc.)
4. Señalá cuáles requieren atención inmediata según los estándares de gobernanza internacionales

Entregá el resultado como una tabla lista para copiar en un documento de Google Sheets o Notion, con estas columnas:
Herramienta | ¿Tiene IA? | Uso en mi empresa | Datos que procesa | Nivel de riesgo | Acción recomendada

Usá lenguaje claro, no técnico, adaptado al contexto colombiano.
```

**Criterio de hecho:** tenés una tabla con todas las herramientas de IA de tu empresa, clasificadas por riesgo, lista para ser el **primer documento** de tu sistema de gobernanza.
$ej1$, 1
FROM workshops WHERE slug = 'ai-regulation-compliance-colombia';

-- EJ 2
INSERT INTO exercises (workshop_id, title, objective, prompt_text, "order")
SELECT id, 'Política interna de uso de IA', 'Crear la política oficial de uso de IA de tu empresa — el documento que define qué podés hacer, qué no, y quién decide las excepciones.',
$ej2$
**Antes de ejecutar el prompt:** pensá en los 3 usos de IA más comunes en tu empresa hoy y en los 2 que más te preocupan desde el punto de vista de riesgo o ética.

**Prompt para tu IA:**

```
Sos un experto en política corporativa de IA con experiencia en empresas colombianas y conocimiento profundo del EU AI Act, el NIST AI RMF, los principios de la OCDE y las recomendaciones de UNESCO sobre ética en IA.

Necesito que crees la política de uso de IA de mi empresa con las siguientes características:

SOBRE MI EMPRESA:
- Nombre: [NOMBRE DE TU EMPRESA]
- Sector: [SECTOR — ej: consultoría, salud, educación, tecnología, retail, etc.]
- Tamaño: [NÚMERO DE PERSONAS]
- País de operación: Colombia
- ¿Tiene clientes o proveedores en Europa?: [SÍ / NO / NO SÉ]

USOS ACTUALES DE IA:
[DESCRIBÍ LOS 3 USOS MÁS COMUNES EN TU EMPRESA]

PREOCUPACIONES ESPECÍFICAS:
[DESCRIBÍ LOS 2 USOS QUE MÁS TE PREOCUPAN]

La política debe incluir:
1. Propósito y alcance (a quién aplica, qué cubre)
2. Usos permitidos de IA en la empresa
3. Usos prohibidos o que requieren aprobación especial
4. Obligaciones del equipo cuando usa IA (transparencia, revisión humana, no compartir datos sensibles)
5. Datos que nunca deben ingresarse en sistemas de IA externos
6. Proceso para aprobar el uso de una nueva herramienta de IA
7. Responsabilidades (quién es el responsable de IA en la empresa)
8. Consecuencias del incumplimiento
9. Fecha de revisión (cada 6 meses)

El tono debe ser claro, directo y ejecutable — no legal ni técnico. Cualquier persona del equipo debe poder leerlo y entender qué se espera de ella.

Adaptá el contenido específicamente a una empresa colombiana del sector [SECTOR] con [NÚMERO] personas.
```

**Criterio de hecho:** tenés un documento de política de IA listo para que lo revise la dirección de tu empresa y se apruebe formalmente.
$ej2$, 2
FROM workshops WHERE slug = 'ai-regulation-compliance-colombia';

-- EJ 3
INSERT INTO exercises (workshop_id, title, objective, prompt_text, "order")
SELECT id, 'Evaluación de riesgo del sistema de IA más crítico', 'Hacer una evaluación formal de riesgo del sistema de IA que más impacto tiene en tu empresa o en las personas con las que trabajás.',
$ej3$
**Antes de ejecutar el prompt:** identificá el sistema de IA **más importante o más riesgoso** de tu empresa. Puede ser un sistema que usás para tomar decisiones sobre clientes, un chatbot que atiende usuarios, un modelo que analiza datos, o cualquier herramienta de IA que tenga impacto real en personas.

**Prompt para tu IA:**

```
Sos un experto en evaluación de riesgos de IA siguiendo los estándares del NIST AI Risk Management Framework y el EU AI Act.

Necesito una evaluación de riesgo completa del siguiente sistema de IA:

SISTEMA A EVALUAR:
- Nombre / herramienta: [NOMBRE DE LA HERRAMIENTA O SISTEMA]
- Para qué lo uso: [DESCRIBÍ EL USO EN 3-4 ORACIONES]
- Quién lo usa en mi empresa: [ROLES QUE LO USAN]
- Con qué datos trabaja: [QUÉ DATOS PROCESA]
- A quién afectan sus outputs: [A QUÉ PERSONAS AFECTAN LAS DECISIONES O RESULTADOS]
- Hay revisión humana antes de usar los resultados: [SÍ / NO / A VECES]

CONTEXTO:
- Mi empresa: [NOMBRE] en Colombia, sector [SECTOR]

La evaluación debe incluir:
1. Clasificación de riesgo según el EU AI Act (inaceptable / alto / limitado / mínimo) con justificación
2. Riesgos específicos identificados (mínimo 5, ordenados por probabilidad × impacto)
3. Riesgos específicos para el contexto colombiano y latinoamericano
4. Controles existentes vs controles faltantes
5. Recomendaciones concretas de mitigación (ordenadas por prioridad)
6. Indicadores de monitoreo: cómo sabés que el sistema está funcionando bien
7. Criterios de alerta: cuándo detener o revisar el uso del sistema

Entregá el resultado como un documento estructurado listo para ser aprobado por la dirección de la empresa.
```

**Criterio de hecho:** tenés una evaluación de riesgo formal que podés mostrar a clientes, socios o auditores como evidencia de que **gestionás activamente** los riesgos de IA.
$ej3$, 3
FROM workshops WHERE slug = 'ai-regulation-compliance-colombia';

-- EJ 4
INSERT INTO exercises (workshop_id, title, objective, prompt_text, "order")
SELECT id, 'Lineamientos de IA por área de tu empresa', 'Crear lineamientos específicos para cada área — los riesgos en marketing no son los de RRHH ni los de finanzas.',
$ej4$
**Antes de ejecutar el prompt:** identificá las 3 a 5 áreas de tu empresa donde más se usa IA hoy (o donde se va a usar).

**Prompt para tu IA:**

```
Sos un experto en gobernanza de IA con foco en implementación práctica para empresas latinoamericanas.

Necesito lineamientos específicos de uso de IA para cada área de mi empresa.

MI EMPRESA:
- Nombre: [NOMBRE]
- Sector: [SECTOR]
- Tamaño: [NÚMERO DE PERSONAS]
- Colombia

ÁREAS DE MI EMPRESA:
[LISTÁ LAS ÁREAS — ej: Marketing, Ventas, Recursos Humanos, Finanzas, Atención al Cliente, Operaciones, Tecnología]

Para cada área, los lineamientos deben incluir:
1. Usos de IA permitidos y recomendados para esa área
2. Usos que requieren aprobación del responsable de IA
3. Usos prohibidos específicos para esa área
4. Datos que esa área NUNCA debe ingresar en sistemas de IA externos
5. Cómo documentar el uso de IA (qué registrar y dónde)
6. Un ejemplo concreto de uso correcto
7. Un ejemplo concreto de uso incorrecto con las consecuencias posibles

El lenguaje debe ser claro y directo, pensado para que la persona de esa área lo lea y lo entienda de inmediato sin necesitar formación adicional.

Adaptá los lineamientos al sector [SECTOR] y al contexto colombiano — considerá regulaciones locales relevantes (Ley 1581 de habeas data, regulaciones sectoriales si aplican).
```

**Criterio de hecho:** tenés un documento con lineamientos específicos por área que podés **distribuir de inmediato** a cada equipo.
$ej4$, 4
FROM workshops WHERE slug = 'ai-regulation-compliance-colombia';

-- EJ 5
INSERT INTO exercises (workshop_id, title, objective, prompt_text, "order")
SELECT id, 'Sistema de logging y trazabilidad', 'Diseñar el sistema de logging mínimo viable para tener trazabilidad — sin infraestructura técnica compleja.',
$ej5$
**Antes de ejecutar el prompt:** identificá los 3 usos de IA donde más importa tener registro (los que afectan decisiones sobre personas o los de mayor riesgo).

**Prompt para tu IA:**

```
Sos un experto en trazabilidad y logging de sistemas de IA, con conocimiento del EU AI Act (artículos sobre mantenimiento de registros), el NIST AI RMF (función MEDIR) y la ISO 42001.

Necesito diseñar el sistema de logging de IA de mi empresa.

MI EMPRESA:
- Nombre: [NOMBRE]
- Sector: [SECTOR]
- Tamaño: [NÚMERO DE PERSONAS]
- Herramientas técnicas que uso: [NOTION / GOOGLE SHEETS / EXCEL / JIRA / OTRA]
- Nivel técnico del equipo: [BAJO / MEDIO / ALTO]

USOS DE IA QUE NECESITAN LOGGING PRIORITARIO:
1. [USO 1]
2. [USO 2]
3. [USO 3]

Diseñá el sistema de logging con:
1. Qué registrar (campos mínimos y campos recomendados)
2. Dónde registrarlo (adaptado a las herramientas que ya uso)
3. Quién es responsable de registrar qué
4. Con qué frecuencia revisar los registros
5. Una plantilla lista para usar en [NOTION / GOOGLE SHEETS / EXCEL]
6. Alertas: qué situaciones deben generar una revisión urgente del log
7. Cómo usar los registros para mejorar el uso de IA (no solo para compliance)
8. Por cuánto tiempo conservar los registros según el EU AI Act y la ley colombiana

El sistema debe ser implementable en menos de 1 día de trabajo sin contratar a nadie externo.
```

**Criterio de hecho:** tenés una plantilla de logging lista para implementar **hoy**, con responsables asignados y un proceso claro de revisión.
$ej5$, 5
FROM workshops WHERE slug = 'ai-regulation-compliance-colombia';

-- EJ 6
INSERT INTO exercises (workshop_id, title, objective, prompt_text, "order")
SELECT id, 'Protocolo de respuesta a incidentes de IA', 'Saber exactamente qué hacer si un sistema de IA falla — antes de que pase.',
$ej6$
**Antes de ejecutar el prompt:** pensá en el **peor escenario realista** de fallo de IA en tu empresa. **No el más catastrófico — el más probable.** Eso es lo que vas a usar como caso de prueba.

**Prompt para tu IA:**

```
Sos un experto en gestión de incidentes de IA y crisis corporativa con experiencia en el contexto latinoamericano y conocimiento del EU AI Act, el NIST AI RMF y la normativa colombiana de protección de datos.

Necesito diseñar el protocolo de respuesta a incidentes de IA de mi empresa.

MI EMPRESA:
- Nombre: [NOMBRE]
- Sector: [SECTOR]
- Tamaño: [NÚMERO DE PERSONAS]
- Sistemas de IA críticos: [LISTÁ LOS 2-3 MÁS IMPORTANTES]

ESCENARIO DE PEOR CASO PROBABLE:
[DESCRIBÍ EL ESCENARIO — ej: "El chatbot de atención al cliente da una respuesta incorrecta sobre precios a 500 usuarios" o "El sistema de IA que usamos para filtrar CVs rechaza candidatos por criterios discriminatorios"]

El protocolo debe incluir:
1. Clasificación de incidentes (niveles de severidad con criterios claros)
2. Árbol de decisión: qué hacer en las primeras 2 horas de detectado un incidente
3. Roles y responsabilidades en la respuesta (quién hace qué)
4. Comunicación interna: a quién notificar y cuándo
5. Comunicación externa: cuándo y cómo comunicar a usuarios o clientes afectados
6. Obligaciones legales en Colombia (cuándo notificar a la SIC u otras autoridades)
7. Proceso de investigación post-incidente
8. Cómo documentar el incidente para futuras auditorías
9. Criterios para reanudar el uso del sistema después del incidente
10. Lecciones aprendidas: cómo integrar el aprendizaje al sistema de gobernanza

Incluí un checklist de las primeras 24 horas listo para imprimir y tener a mano.

Adaptá el protocolo específicamente al contexto colombiano y al sector [SECTOR].
```

**Criterio de hecho:** tenés un protocolo de incidentes aprobado y el **checklist de las primeras 24 horas** disponible para quien lo necesite en tu equipo.
$ej6$, 6
FROM workshops WHERE slug = 'ai-regulation-compliance-colombia';

-- ============================================================
-- 5) GLOSARIO (30 términos)
-- ============================================================
INSERT INTO glossary_terms (workshop_id, term, definition, category)
SELECT w.id, t.term, t.definition, t.category FROM workshops w,
(VALUES
  -- Marcos regulatorios
  ('AI Act (Ley de IA)', 'Reglamento (UE) 2024/1689. Primera ley vinculante del mundo que regula el desarrollo y uso de sistemas de inteligencia artificial. Vigente desde agosto 2024, con plena aplicación desde agosto 2026.', 'marcos-regulatorios'),
  ('NIST AI RMF', 'Framework de gestión de riesgos de IA del Instituto Nacional de Estándares y Tecnología de EE.UU. Define cuatro funciones: Gobernar, Mapear, Medir, Gestionar.', 'marcos-regulatorios'),
  ('ISO 42001', 'Estándar internacional certificable para sistemas de gestión de inteligencia artificial. Define requisitos para establecer, implementar, mantener y mejorar un sistema de gestión de IA.', 'marcos-regulatorios'),
  ('OCDE (OECD)', 'Organización para la Cooperación y el Desarrollo Económicos. Publica los Principios de IA adoptados por el G20 y que sirvieron de base filosófica para el EU AI Act.', 'marcos-regulatorios'),
  ('UNESCO Recommendation on AI Ethics', 'Recomendación adoptada por 193 países en 2021. Establece estándares de ética en IA centrados en derechos humanos, dignidad, diversidad e inclusión.', 'marcos-regulatorios'),
  ('CONPES 3975', 'Documento del Consejo Nacional de Política Económica y Social de Colombia que establece la Política Nacional de IA (2019). Hoja de ruta, no una ley vinculante.', 'marcos-regulatorios'),
  ('Ley 1581 de 2012', 'Ley de Protección de Datos Personales de Colombia (Habeas Data). Aplica a cualquier sistema que procese datos de personas colombianas, incluyendo sistemas de IA.', 'marcos-regulatorios'),
  ('SIC (Superintendencia de Industria y Comercio)', 'Entidad colombiana que supervisa el cumplimiento de la Ley 1581 de protección de datos. Autoridad a notificar en casos de vulneración de datos que involucren sistemas de IA.', 'marcos-regulatorios'),
  -- Conceptos de gobernanza
  ('Gobernanza de IA', 'Conjunto de políticas, procesos, roles y controles que una organización establece para asegurar el uso responsable, ético y conforme de la IA.', 'gobernanza'),
  ('Compliance (cumplimiento)', 'Conjunto de acciones que una empresa toma para cumplir con leyes, regulaciones y estándares aplicables. En IA incluye cumplimiento del AI Act, normas de protección de datos y estándares internacionales.', 'gobernanza'),
  ('Política de uso de IA', 'Documento oficial de una empresa que define qué usos de IA están permitidos, cuáles están prohibidos, cuáles requieren aprobación especial, y cuáles son las obligaciones del equipo.', 'gobernanza'),
  ('Lineamientos internos', 'Reglas específicas por área o proceso que guían cómo los miembros de un equipo deben usar la IA en su trabajo diario. Complementan la política general.', 'gobernanza'),
  ('Inventario de IA', 'Registro completo de todos los sistemas, herramientas y modelos de IA que una organización usa, incluyendo su propósito, datos que procesan y nivel de riesgo.', 'gobernanza'),
  ('Auditoría de IA', 'Proceso formal de revisión independiente de los sistemas de IA de una empresa para verificar que cumplen con las políticas internas y los estándares externos.', 'gobernanza'),
  ('Sistema de gestión de IA', 'Conjunto estructurado de políticas, procesos, roles y herramientas que una organización implementa para gobernar el ciclo de vida completo de sus sistemas de IA.', 'gobernanza'),
  ('Responsable de IA (AI Officer)', 'Persona designada en una organización para supervisar el uso de IA, mantener las políticas actualizadas, gestionar incidentes y asegurar el cumplimiento.', 'gobernanza'),
  -- Riesgo
  ('Riesgo inaceptable', 'Clasificación del AI Act para sistemas de IA que están completamente prohibidos (manipulación subliminal, puntuación social, reconocimiento facial masivo en tiempo real, entre otros).', 'riesgo'),
  ('Alto riesgo', 'Clasificación del AI Act para sistemas de IA usados en áreas críticas (salud, crédito, empleo, educación, infraestructura). Requieren logging, trazabilidad, supervisión humana y registro en base de datos oficial.', 'riesgo'),
  ('Due diligence de IA', 'Proceso de investigación y evaluación que una empresa realiza antes de adoptar una herramienta o sistema de IA — evaluando riesgos, proveedor, términos de uso y cumplimiento normativo.', 'riesgo'),
  ('Bias algorítmico (sesgo)', 'Tendencia de un sistema de IA a producir resultados sistemáticamente injustos o discriminatorios, generalmente como reflejo de sesgos presentes en los datos de entrenamiento.', 'riesgo'),
  ('Vulneración de datos', 'Acceso, uso o divulgación no autorizada de datos personales, incluyendo los que procesan sistemas de IA. Obliga a notificación a la SIC en Colombia y a la autoridad correspondiente en la UE si hay ciudadanos europeos afectados.', 'riesgo'),
  ('Incidente de IA', 'Evento en el que un sistema de IA produce un resultado incorrecto, dañino, sesgado o inesperado que afecta a personas, procesos o la reputación de la empresa.', 'riesgo'),
  -- Operación
  ('Logging', 'Práctica de registrar sistemáticamente las acciones, decisiones y outputs de un sistema de IA para permitir trazabilidad, auditoría y detección de problemas.', 'operacion'),
  ('Trazabilidad', 'Capacidad de rastrear el origen, evolución y uso de los datos y decisiones de un sistema de IA. Fundamental para auditorías y respuesta a incidentes.', 'operacion'),
  ('Human-in-the-loop (humano en el bucle)', 'Principio de gobernanza que requiere que un ser humano revise y apruebe las decisiones de alto impacto generadas por sistemas de IA antes de que sean aplicadas.', 'operacion'),
  ('Supervisión humana', 'Mecanismo que asegura que las personas pueden entender, monitorear, corregir o detener los sistemas de IA, especialmente en decisiones de alto impacto.', 'operacion'),
  ('Protocolo de incidentes', 'Procedimiento documentado que define qué hacer cuando ocurre un fallo o problema con un sistema de IA — desde la detección hasta la resolución y el aprendizaje.', 'operacion'),
  ('Principio de transparencia', 'Obligación de informar a las personas cuando están interactuando con un sistema de IA o cuando una decisión sobre ellas fue tomada o influenciada por IA.', 'operacion'),
  -- Tipos de sistemas
  ('Chatbot', 'Sistema de IA diseñado para simular conversaciones con personas. Según el AI Act, los chatbots deben informar a los usuarios que están interactuando con una IA (clasificación de riesgo limitado).', 'tipos-sistemas'),
  ('IA de propósito general (GPAI)', 'Modelos de IA que pueden realizar múltiples tareas distintas (como GPT-4, Claude, Gemini). El AI Act tiene obligaciones específicas para sus proveedores desde agosto 2025.', 'tipos-sistemas')
) AS t(term, definition, category)
WHERE w.slug = 'ai-regulation-compliance-colombia';

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
-- FROM workshops w WHERE slug = 'ai-regulation-compliance-colombia';
--
-- Esperado: 5 secciones · 12 slides · 6 ejercicios · 30 términos
