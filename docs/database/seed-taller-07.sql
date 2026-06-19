-- ============================================================
-- TALLER 07 — KAIA: tu sistema operativo creativo
-- ============================================================
-- Cómo usar este archivo:
-- Opción A (recomendada): abrir en TablePlus conectado a Supabase y correr todo de una.
-- Opción B: pegar entero en Supabase SQL Editor (web).
--
-- Es idempotente: el DELETE inicial limpia residuos de intentos previos.
-- Si todo va bien al final tenés: 1 workshop, 5 secciones (con 19 slides
-- de aprendizaje), 13 ejercicios y 21 términos de glosario.
-- ============================================================

-- 1) Cleanup defensivo
DELETE FROM workshops WHERE slug = 'kaia-sistema-operativo-creativo';

-- 2) Workshop
INSERT INTO workshops (
  slug, title, description, instructor,
  date_live, duration_min, prerequisites, status,
  whatsapp_message_template
) VALUES (
  'kaia-sistema-operativo-creativo',
  'KAIA: tu sistema operativo creativo cuando aprendés y construís al revés',
  'Te frustró durante años el sistema educativo lineal. Cuando alguien te explica un framework antes de tocar tu emoción, te apagás. Tenés ideas potentes que nacen *de la nada*. Cuando arrancás un proyecto no necesitás tenerlo todo claro — necesitás sentirlo. Nada de eso es desorden. Es que tu cerebro funciona al revés de cómo el sistema educativo asume que funciona. KAIA es la metodología que diseñé para nombrar, sostener y operacionalizar esa forma de aprender y crear. 7 fases: Origen emocional, Visión amplia, Acción intuitiva, Búsqueda de estructura, Delegación, Reflexión, Redirección. Vas a salir con tu diagnóstico, tu patrón de bloqueo identificado, los 7 kits específicos y un ritmo semanal para mantenerlo vivo.',
  'Jennifer Salazar Duque',
  NULL,
  360,
  'Obligatorios: tener al menos 2 proyectos activos que querés trabajar con KAIA; una libreta exclusiva para este taller; 3 bolígrafos de colores distintos; privacidad para los ejercicios emocionales; haber leído el Manifiesto KAIA antes de la primera sesión. Recomendados: haber hecho el Diagnóstico KAIA sobre uno de tus proyectos; tener mínima familiaridad con tu propio estilo de aprendizaje (¿necesitás emoción primero o estructura primero?); si estás en proceso terapéutico o de coaching, comentale que vas a hacer este taller. NO es para vos si: sentís que *alma primero* es esoterismo; necesitás certeza analítica para todo y eso te funciona; esperás un método paso-a-paso sin trabajo personal; querés *técnicas rápidas* sin involucrarte.',
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
  "title": "Bienvenida — el sistema operativo de quienes crean al revés",
  "description": "## Si llegaste hasta acá\n\nProbablemente ya viviste algunas de estas cosas:\n\n- Te frustró durante años el sistema educativo lineal\n- Cuando alguien te explica un framework antes de tocar tu emoción, te apagás\n- Tenés ideas potentes que nacen *de la nada* y no podés explicar de dónde\n- Cuando arrancás un proyecto, no necesitás tenerlo todo claro — necesitás sentirlo\n- A veces sentís que sos *desordenada* comparada con quienes planifican todo\n- Aprendés más en un proceso personal que en un curso de 40 horas\n\n**Nada de eso es desorden.** Es que tu cerebro funciona al revés de cómo el sistema educativo asume que funciona.\n\n**KAIA** es la metodología que diseñé para nombrar, sostener y operacionalizar esa forma de aprender y crear. Hoy ya la uso en todos mis proyectos: en Salazar Duke Impact Hub, en mis productos digitales, en los talleres que doy. Y en este taller te la voy a entregar entera.\n\nAl final, vas a tener un mapa de las 7 fases, vas a saber en cuál estás respecto a cada proyecto importante, vas a tener herramientas para no quedarte trabada en una fase, y vas a tener un ritmo personal para usar KAIA como tu sistema operativo creativo.\n\n## Qué vas a salir teniendo\n\n1. Entender las **7 fases** de KAIA y la lógica del aprendizaje inverso\n2. **Diagnosticada tu fase actual** en cada uno de tus proyectos clave\n3. Identificada **la fase donde típicamente te trabás** (tu patrón de bloqueo personal)\n4. **El kit específico de cada fase** para tu vida concreta\n5. Saber **cuándo es Fase 7** (cerrar) y cómo soltar sin culpa\n6. Un **ritmo semanal** para revisar tus fases\n7. Tu primer ciclo KAIA completo planeado para 21 días\n\n## Duración y acompañamiento\n\n- 5 horas en vivo (2 sesiones de 2.5h)\n- 21 días de práctica con seguimiento\n- 3 check-ins grupales semanales (45 min cada uno)\n- Canal privado de soporte\n- Plantillas digitales del sistema KAIA\n- Revisión personalizada al día 21\n\n## Una promesa importante\n\n> **KAIA no te va a hacer más productiva. Te va a hacer crear desde tu raíz — y eso es lo único que vale la pena escalar.**\n\nLa velocidad sin alma produce mucho ruido y poco impacto. La velocidad con alma produce transformación real. KAIA es la metodología para construir desde ese segundo lugar.",
  "quick_links": [
    {"label": "19 diapositivas — las 7 fases", "target_section": "aprendizaje"},
    {"label": "13 ejercicios — diagnóstico + 7 kits", "target_section": "taller"},
    {"label": "Setup del sistema KAIA", "target_section": "instalacion"},
    {"label": "Glosario", "target_section": "glosario"}
  ]
}
$inicio$::jsonb
FROM workshops WHERE slug = 'kaia-sistema-operativo-creativo';

-- APRENDIZAJE (19 slides)
INSERT INTO sections (workshop_id, type, section_order, content_json)
SELECT id, 'aprendizaje', 2,
$apr$
{
  "type": "aprendizaje",
  "title": "El modelo KAIA, paso a paso",
  "slides": [
    {"kicker": "Diapositiva 1 · La pregunta", "title": "La pregunta que nadie te hizo en la escuela", "body": "¿Por qué empezamos siempre por el *qué* y nunca por el *para qué*?\n\nEl sistema educativo te enseña:\n1. Primero la teoría\n2. Después los ejercicios\n3. Después (a veces) la aplicación real\n\nKAIA dice lo opuesto:\n1. Primero el por qué emocional\n2. Después la acción imperfecta\n3. Después la estructura\n\n**No es contra la estructura.** Es a favor del orden correcto.", "notes": null},
    {"kicker": "Diapositiva 2 · La distinción", "title": "Las dos formas de aprender", "body": "| Aprendizaje lineal | Aprendizaje inverso (KAIA) |\n|--------------------|----------------------------|\n| Teoría → Práctica → Aplicación | Emoción → Acción → Estructura |\n| *Primero entendé bien, después actuás* | *Primero sentí, después hacé, después estructurás* |\n| Bajo riesgo de equivocarte | Más equivocaciones, más aprendizaje |\n| Sirve para lo replicable | Sirve para lo nuevo |\n| Lo que el sistema educativo enseña | Lo que el sistema rara vez nombra |\n\n**Las dos son válidas.** Pero si KAIA es para vos, probablemente venís sintiendo que el modelo lineal te ahoga.", "notes": null},
    {"kicker": "Diapositiva 3 · La base", "title": "Los 3 principios fundacionales de KAIA", "body": "1. **Primero el alma, después el método** — toda creación auténtica empieza en lo emocional\n2. **La acción precede a la claridad** — no necesitás todo definido para empezar\n3. **La redirección es sabiduría** — soltar a tiempo es lo que abre espacio", "notes": null},
    {"kicker": "Diapositiva 4 · El nombre", "title": "Qué significa KAIA", "body": "Tres orígenes que se cruzan en una sola idea:\n\n- 🌿 **Escandinavo:** tierra viva\n- 🌊 **Hawaiano:** mar, fluidez, vida\n- 🌀 **Griego:** Gaia, la que da origen\n\n**Lo que da origen, fluye y sostiene.** Esa es la naturaleza del modelo.", "notes": null},
    {"kicker": "Diapositiva 5 · La ruta", "title": "Las 7 fases — visión general", "body": "```\n1. ORIGEN EMOCIONAL    →    2. VISIÓN AMPLIA    →    3. ACCIÓN INTUITIVA\n                                                              ↓\n7. REDIRECCIÓN       ←     6. REFLEXIÓN     ←    5. DELEGACIÓN    ←    4. ESTRUCTURA\n        ↓\n   (vuelve a 1)\n```\n\nCada fase tiene:\n- Una **emoción característica**\n- Una **acción dominante**\n- Un **riesgo si te trabás ahí**", "notes": null},
    {"kicker": "Diapositiva 6 · Fase 1", "title": "Origen emocional", "body": "> *La idea no nace del análisis. Nace del cuerpo.*\n\n**Emoción:** intensidad, urgencia interna\n**Acción:** sentir + nombrar\n**Riesgo:** quedarte en la chispa sin avanzar\n\n**Cuando estás acá:**\n- Algo te conmueve y no podés dejar de pensarlo\n- Tenés una intuición fuerte sin explicación\n- Algo te duele de manera que pide ser transformado\n\n**Qué hacer:** no racionalizar todavía. Escribir la chispa con el lenguaje original. Permitirte la intensidad. Conectarlo con tu historia.", "notes": null},
    {"kicker": "Diapositiva 7 · Fase 2", "title": "Visión amplia", "body": "> *Imaginá todo. Todavía no preguntes cómo.*\n\n**Emoción:** expansión, asombro\n**Acción:** soñar + escribir en grande\n**Riesgo:** vivir en la visión sin aterrizar\n\n**Cuando estás acá:**\n- Ves un escenario completo en tu cabeza\n- Sentís emoción al imaginar el impacto\n- No te bloquea no saber cómo se hace\n\n**Qué hacer:** escribir la versión completa sin filtrar. Hablarlo con alguien que sostenga visiones. Permitirte el *y si...*.", "notes": null},
    {"kicker": "Diapositiva 8 · Fase 3", "title": "Acción intuitiva", "body": "> *Empezá. No tenés todo claro y está bien.*\n\n**Emoción:** valentía + incomodidad\n**Acción:** primer movimiento real\n**Riesgo:** confundir acción con caos\n\n**Cuando estás acá:**\n- Tenés ganas de empezar pero también miedo\n- Pensás *todavía no sé suficiente*\n- Algo en vos sabe que esperar más es excusa\n\n**Qué hacer:** acción mínima, no perfecta. Permitirte la torpeza. Documentar lo que aprendés. No volver a Fase 2 a *definir más*.", "notes": null},
    {"kicker": "Diapositiva 9 · Fase 4", "title": "Búsqueda de estructura", "body": "> *Ahora sí, ¿qué framework sostiene esto?*\n\n**Emoción:** humildad + apertura\n**Acción:** estudiar + adaptar\n**Riesgo:** enamorarte de los frameworks y dejar de crear\n\n**Cuando estás acá:**\n- Notás patrones repetidos en tu trabajo\n- Querés sistematizar para no improvisar\n- Te interesan libros, cursos, frameworks externos\n\n**Qué hacer:** elegir 1-2 frameworks específicos. Aplicar sobre trabajo real. Adaptar, no copiar. Crear plantillas propias.", "notes": null},
    {"kicker": "Diapositiva 10 · Fase 5", "title": "Delegación", "body": "> *Lo que ya sabés hacer, dejá que otro o algo lo haga por vos.*\n\n**Emoción:** decisión + algo de duelo\n**Acción:** sistematizar + entregar\n**Riesgo:** volverte cuello de botella de tu propio proyecto\n\n**Cuando estás acá:**\n- Te das cuenta que estás operando, no creando\n- Reconocés tareas que podría hacer otro o un sistema\n- Tenés resistencia a soltar (*lo hago mejor yo*)\n\n**Qué hacer:** listar tareas repetitivas. Decidir por cada una: automatizar / delegar / dejar. Documentar para entrega limpia.", "notes": null},
    {"kicker": "Diapositiva 11 · Fase 6", "title": "Reflexión", "body": "> *¿Qué aprendí del impacto humano de esto?*\n\n**Emoción:** quietud, agradecimiento\n**Acción:** mirar atrás + integrar\n**Riesgo:** confundir pausa con parálisis\n\n**Cuando estás acá:**\n- Necesitás pausar más que avanzar\n- Querés entender qué tuvo sentido real\n- Pensás en personas tocadas, no en números\n\n**Qué hacer:** documentar aprendizajes humanos. Hablar con personas tocadas por tu trabajo. Permitirte la pausa con fecha de regreso.", "notes": null},
    {"kicker": "Diapositiva 12 · Fase 7", "title": "Redirección", "body": "> *Si esto ya no es para vos, soltalo. No es fracaso. Es honestidad.*\n\n**Emoción:** duelo + libertad\n**Acción:** cerrar + abrir espacio\n**Riesgo:** sostener por culpa lo que ya no es tuyo\n\n**Cuando estás acá:**\n- Algo se volvió pesado sin razón clara\n- Te cuesta sostenerlo por deber, ya no por deseo\n- Aparecen nuevas chispas (Fase 1) compitiendo por tu energía\n\n**Qué hacer:** reconocer que terminó. Cerrar con dignidad. Capturar aprendizajes. Permitirte el duelo. Abrir espacio limpio.", "notes": null},
    {"kicker": "Diapositiva 13 · El sistema vivo", "title": "El ciclo es vivo, no lineal", "body": "KAIA describe 7 fases en orden, pero vivís el ciclo de forma no lineal:\n\n- Podés estar en Fase 3 de un proyecto y Fase 6 de otro al mismo tiempo\n- Podés volver a Fase 1 cuando aparece información nueva\n- Podés estar en Fase 7 de algo y Fase 1 de su siguiente versión\n\n**No importa la secuencia perfecta. Importa saber dónde estás en este momento.**", "notes": null},
    {"kicker": "Diapositiva 14 · Las 4 reglas", "title": "Las 4 reglas duras de KAIA", "body": "1. **No empieces ningún proyecto en Fase 4.** Si arrancás por la estructura, te falta el alma\n2. **No te quedes en Fase 2.** La visión que no se ejecuta envenena\n3. **No vivas en Fase 6.** Reflexionar sin volver a crear es nostalgia, no aprendizaje\n4. **No te resistas a la Fase 7.** Soltar a tiempo es lo que abre espacio para lo siguiente", "notes": null},
    {"kicker": "Diapositiva 15 · Tu pista", "title": "El patrón de bloqueo personal", "body": "Cada persona tiene una fase donde **típicamente se traba**. Reconocer la tuya es la mayor liberación.\n\n| Si tu bloqueo es Fase... | Tu patrón típico |\n|--------------------------|------------------|\n| 1 — Origen | Mil chispas, ningún proyecto |\n| 2 — Visión | Imaginás mucho, ejecutás poco |\n| 3 — Acción | Movimiento caótico sin construir nada |\n| 4 — Estructura | Estudiás todo, no producís nada propio |\n| 5 — Delegación | Operás todo vos, no escala |\n| 6 — Reflexión | Procesás eternamente, no creás lo nuevo |\n| 7 — Redirección | Sostenés lo que ya no vibra por culpa |\n\n**Conocer tu patrón = poder anticipar tu bloqueo = poder atravesarlo.**", "notes": null},
    {"kicker": "Diapositiva 16 · Más allá de proyectos", "title": "KAIA aplicado a la vida", "body": "KAIA no es solo para emprendimientos o ideas profesionales. Aplica también a:\n\n- **Aprendizajes** (un curso, un idioma, una habilidad)\n- **Transformaciones personales** (un cambio de hábito, una sanación)\n- **Vínculos** (el ciclo de una relación, una amistad)\n- **Espacios** (una casa, una ciudad, un trabajo)\n\nCualquier proceso significativo en tu vida atraviesa estas 7 fases. Reconocerlas te ayuda a no luchar contra ellas.", "notes": null},
    {"kicker": "Diapositiva 17 · La defensa del modelo", "title": "Por qué KAIA funciona aunque parezca *blando*", "body": "Hay personas que descartan KAIA porque les parece *muy emocional*. Esto es lo que se ignora:\n\n- **La emoción es información** — no es lo opuesto a la racionalidad, es su materia prima\n- **La intuición orientada** (no caótica) es lo que distingue a creadores potentes\n- **La estructura sin alma** produce mucho output y poco impacto real\n- **Los mejores frameworks** se aplican sobre algo que ya tiene sentido emocional\n\n**KAIA no es contra el rigor. Es a favor del orden correcto: alma → acción → rigor.**", "notes": null},
    {"kicker": "Diapositiva 18 · El ritmo", "title": "Cómo se usa KAIA semanalmente", "body": "Una vez por semana (15-20 min):\n\n1. **Listá tus proyectos activos** (no más de 5)\n2. **Por cada uno, identificá la fase** en la que estás\n3. **Marcá:**\n   - ¿En qué fase me trabé esta semana?\n   - ¿Necesito avanzar a la siguiente fase?\n   - ¿Hay algo que está pidiendo Fase 7?\n4. **Decidí 1 acción concreta** por proyecto para la próxima semana", "notes": null},
    {"kicker": "Diapositiva 19 · Cierre", "title": "5 ideas para llevarte", "body": "1. **El alma primero no es esoterismo.** Es reconocer que la emoción es información crítica\n2. **No todas las fases son cómodas.** Y eso está bien — cada una construye distinto\n3. **Tu patrón de bloqueo es tu mayor pista.** Identificalo y atravesalo\n4. **Soltar es parte del método.** No es fracaso — es Fase 7\n5. **KAIA es ritmo, no método rígido.** Lo personalizás a tu vida real\n\n> **Cuando aprendés a moverte entre las 7 fases con consciencia, dejás de pelearte contigo misma — y empezás a crear desde tu raíz.**", "notes": null}
  ]
}
$apr$::jsonb
FROM workshops WHERE slug = 'kaia-sistema-operativo-creativo';

-- TALLER
INSERT INTO sections (workshop_id, type, section_order, content_json)
SELECT id, 'taller', 3,
$taller$
{
  "type": "taller",
  "title": "Tu diagnóstico + tus 7 kits + tu ritmo",
  "instructions": "Tenés **13 ejercicios** ordenados como una secuencia que sí podés terminar.\n\n**Ejercicios 1-4**: el diagnóstico — tu mapa de proyectos activos, dos diagnósticos KAIA en proyectos reales y la identificación de tu patrón de bloqueo personal.\n\n**Ejercicios 5-11**: los 7 kits — uno por cada fase. Cada kit te prepara para no atascarte cuando estés en esa fase.\n\n**Ejercicios 12-13**: el ritmo y el compromiso — tu revisión semanal de KAIA y tu plan firmado de 21 días.\n\n**Reglas del taller:**\n- Hacelos en orden — cada uno se apoya en el anterior\n- Especificá. Lo genérico no te va a servir cuando estés en esa fase\n- Si un ejercicio te activa fuerte (especialmente Fase 1 y Fase 7), parálo y volvé mañana\n- Los kits los vas a iterar — la primera versión es borrador, después se afina con uso real",
  "placeholder": "Si no ves los ejercicios todavía, recargá la página."
}
$taller$::jsonb
FROM workshops WHERE slug = 'kaia-sistema-operativo-creativo';

-- INSTALACIÓN
INSERT INTO sections (workshop_id, type, section_order, content_json)
SELECT id, 'instalacion', 4,
$inst$
{
  "type": "instalacion",
  "title": "Setup del sistema KAIA",
  "steps": [
    {"order": 1, "title": "Materiales físicos", "description": "- **Libreta dedicada para KAIA** (no la mezclés con trabajo operativo)\n- **Bolígrafos:** uno azul para texto, uno verde para chispas (Fase 1), uno rojo para cierres (Fase 7)\n- **Una hoja A4** con las 7 fases resumidas, pegada en lugar visible\n- **Tu Manifiesto KAIA** impreso o accesible (para releerlo cuando dudes)", "code": "Libreta:    1 exclusiva KAIA\nBolígrafos: azul (texto) + verde (Fase 1) + rojo (Fase 7)\nResumen:    hoja A4 con las 7 fases visible\nManifiesto: impreso o accesible siempre", "language": "bash"},
    {"order": 2, "title": "Espacio digital (opcional)", "description": "Si querés versión digital, podés organizarlo así:\n\n**En Notion:**\n- Workspace privado: *Mi KAIA*\n- Páginas: Mis Proyectos · Fases (las 7) · Kits · Diagnóstico · Revisión Semanal\n- Database de proyectos con propiedad *Fase actual*\n\n**En Obsidian:**\n- Carpeta dedicada en tu vault\n- Una nota por proyecto con frontmatter `fase_kaia: 1/2/3/4/5/6/7`\n- Dataview para ver tu mapa de proyectos por fase", "code": "---\nproyecto: \nfase_kaia: 1\nemocion_actual: \nfecha_diagnostico: 2026-XX-XX\nproxima_accion: \n---", "language": "yaml"},
    {"order": 3, "title": "Tu ritmo semanal", "description": "**Configurar recordatorio fijo:**\n- Domingo a las 19:00 (o la hora que te funcione)\n- 15-20 minutos\n- Lugar tranquilo\n- Tu libreta + el documento del Diagnóstico KAIA\n\nNo es opcional — es lo que mantiene el sistema vivo. Sin revisión semanal, KAIA se vuelve teoría.", "code": "Dom 19:00  Revisión semanal KAIA (15-20 min)\n           - Listar proyectos activos\n           - Identificar fase de cada uno\n           - Marcar 1 acción concreta por proyecto", "language": "bash"},
    {"order": 4, "title": "Tu equipo de sostén", "description": "KAIA funciona mejor con al menos 1 persona que entienda el modelo:\n- Alguien con quien podés compartir Fase 1 sin que te baje\n- Alguien que entiende cuando decís *estoy en Fase 6, necesito pausa*\n- Alguien que no juzga tu Fase 7\n\nSi nadie en tu entorno entiende KAIA, **el grupo del taller cumple ese rol** durante los 21 días.", "code": "Mínimo:      1 persona que entiende KAIA\nIdeal:       2-3 personas (Fase 1, Fase 6, Fase 7)\nFallback:    el grupo del taller (21 días)", "language": "bash"},
    {"order": 5, "title": "Privacidad", "description": "- Lo que escribís en **Fase 1** (chispas, intuiciones, dolor que pide ser transformado) puede ser muy personal\n- Lo que escribís en **Fase 7** (cierres, duelos, lo que ya no vibra) también\n- Si lo digitalizás, usá workspace privado con 2FA\n- Si está en papel, en lugar privado", "code": "Papel:    cajón con cierre o lugar privado\nNotion:   workspace privado + 2FA\nObsidian: local + sync encriptado", "language": "bash"},
    {"order": 6, "title": "Verificación final", "description": "Antes de arrancar tu primera revisión semanal, asegurate de tener:\n\n- [ ] Libreta dedicada y bolígrafos\n- [ ] Mi mapa de proyectos activos (Ejercicio 1)\n- [ ] Diagnóstico KAIA aplicado a 2 proyectos (Ejercicios 2-3)\n- [ ] Patrón de bloqueo personal identificado (Ejercicio 4)\n- [ ] Los 7 kits diseñados (Ejercicios 5-11)\n- [ ] Ritmo semanal configurado: día + hora + lugar (Ejercicio 12)\n- [ ] Compromiso de 21 días firmado (Ejercicio 13)\n- [ ] Manifiesto KAIA accesible\n- [ ] Al menos 1 persona en mi entorno entiende KAIA (o el grupo del taller cumple ese rol)\n\nSi todo ✅, **el sistema está instalado**. Tu primera revisión semanal es este domingo.", "code": "Checklist completa → sistema KAIA instalado\nPrimera revisión: este domingo 19:00", "language": "bash"}
  ],
  "success_message": "KAIA queda instalado. Tu primera revisión semanal es este domingo. Acordate: el modelo no se vive de manera lineal — vas a estar en distintas fases en distintos proyectos al mismo tiempo. Y cuando aparezca tu patrón de bloqueo (vas a verlo en las próximas 3 semanas), ahora ya tenés el kit para atravesarlo."
}
$inst$::jsonb
FROM workshops WHERE slug = 'kaia-sistema-operativo-creativo';

-- GLOSARIO
INSERT INTO sections (workshop_id, type, section_order, content_json)
SELECT id, 'glosario', 5,
$glo$
{"type": "glosario", "title": "Glosario del taller", "search_placeholder": "Buscá un término (ej: Fase 1, KAIA, redirección)..."}
$glo$::jsonb
FROM workshops WHERE slug = 'kaia-sistema-operativo-creativo';

-- ============================================================
-- 4) EJERCICIOS (13)
-- ============================================================

-- EJ 1
INSERT INTO exercises (workshop_id, title, objective, prompt_text, "order")
SELECT id, 'Tu mapa de proyectos activos', 'Ver con claridad qué proyectos están vivos en tu vida ahora.',
$ej1$
**Materiales:** libreta + lápiz.

**Pasos:**

1. Listá TODOS los proyectos, aprendizajes, transformaciones activas (no más de 8)
2. Por cada uno, anotá:
   - Nombre breve
   - Tiempo que llevás con él
   - Cuánta energía te demanda (alta / media / baja)
   - Cuánta vibración tiene (alta / media / baja)

**Criterio de hecho:** tenés tu mapa en una sola página. Si tenés más de 8 proyectos, ya hay material para Fase 7.
$ej1$, 1
FROM workshops WHERE slug = 'kaia-sistema-operativo-creativo';

-- EJ 2
INSERT INTO exercises (workshop_id, title, objective, prompt_text, "order")
SELECT id, 'Diagnóstico KAIA — proyecto principal', 'Identificar en qué fase estás respecto a tu proyecto más importante.',
$ej2$
**Pasos:**

1. Elegí UN proyecto del Ejercicio 1 — el más significativo emocionalmente
2. Aplicá el cuestionario completo de 14 preguntas del **Diagnóstico KAIA**
3. Contá tus letras (A-G)
4. Identificá tu fase actual

**Reflexión adicional:**
- ¿Te sorprendió el resultado?
- ¿Hace cuánto estás en esa fase?
- ¿Esa fase es nutricia para vos o te trabaste ahí?

**Criterio de hecho:** sabés en qué fase estás respecto a ese proyecto, y podés explicarlo en 2 frases.
$ej2$, 2
FROM workshops WHERE slug = 'kaia-sistema-operativo-creativo';

-- EJ 3
INSERT INTO exercises (workshop_id, title, objective, prompt_text, "order")
SELECT id, 'Diagnóstico KAIA — proyecto secundario', 'Ver cómo aplicar KAIA a varios proyectos en paralelo.',
$ej3$
**Pasos:**

1. Elegí OTRO proyecto del Ejercicio 1
2. Aplicá el cuestionario completo de nuevo
3. Identificá la fase

**Reflexión:**
- ¿La fase es la misma o distinta?
- ¿Qué te dice que dos proyectos estén en fases diferentes?
- ¿Cómo distribuís tu energía entre ellos?

**Criterio de hecho:** comprobaste que KAIA no es lineal — distintos proyectos viven fases distintas al mismo tiempo.
$ej3$, 3
FROM workshops WHERE slug = 'kaia-sistema-operativo-creativo';

-- EJ 4
INSERT INTO exercises (workshop_id, title, objective, prompt_text, "order")
SELECT id, 'Tu patrón de bloqueo', 'Identificar la fase donde típicamente te trabás.',
$ej4$
Reflexioná sobre los últimos 3 proyectos importantes que abandonaste o que se trabaron:

| Proyecto | ¿En qué fase se trabó? | ¿Qué pasó cuando se trabó? |
|----------|----------------------|---------------------------|
| 1 | | |
| 2 | | |
| 3 | | |

**Pregunta clave:**
- ¿Hay una fase que se repite en los 3 casos?

Si la respuesta es sí, **esa es tu fase de bloqueo personal**.

**Criterio de hecho:** identificaste cuál es la fase donde típicamente te trabás. Si todavía no te queda clara, anotalo igual — el patrón se va a revelar en las próximas semanas.
$ej4$, 4
FROM workshops WHERE slug = 'kaia-sistema-operativo-creativo';

-- EJ 5
INSERT INTO exercises (workshop_id, title, objective, prompt_text, "order")
SELECT id, 'Tu kit de Fase 1 — Origen emocional', 'Preparar las prácticas que te ayudan a estar en Fase 1 sin atascarte.',
$ej5$
**Completá:**

```
MI KIT DE FASE 1 — Origen emocional

Cuando algo aparece como chispa, lo capturo en:
(libreta, app, audio en celular — elegí UN lugar)

Las preguntas que me hago en Fase 1:
1. ¿De dónde viene esto en mi historia?
2. ___________
3. ___________

Personas con las que comparto Fase 1 sin que me bajen:
1. ___________
2. ___________

Mi señal de que es hora de avanzar a Fase 2:
___________

Cuánto tiempo permito quedarme en Fase 1 antes de revisar:
(ej: máximo 2 semanas)
```

**Criterio de hecho:** el kit está claro, sabés dónde capturás y con quién hablás cuando aparece una chispa.
$ej5$, 5
FROM workshops WHERE slug = 'kaia-sistema-operativo-creativo';

-- EJ 6
INSERT INTO exercises (workshop_id, title, objective, prompt_text, "order")
SELECT id, 'Tu kit de Fase 2 — Visión amplia', 'Sostener la visión sin atascarte en ella.',
$ej6$
**Completá:**

```
MI KIT DE FASE 2 — Visión amplia

Cómo capturo la visión:
(escritura libre, mapas mentales, audios, conversación, dibujos)

Personas que sostienen visiones grandes sin bajarme:
1. ___________
2. ___________

Personas que NO debo mostrarle la visión todavía:
(los aterrizadores prematuros)
1. ___________
2. ___________

Mi señal de que es hora de pasar a Fase 3:
(cuando aparece la "picazón por hacer")

Cuánto tiempo permito quedarme en Fase 2:
(ej: máximo 2 semanas)
```

**Criterio de hecho:** sabés cómo capturás visiones grandes y con quién compartirlas (y con quién no).
$ej6$, 6
FROM workshops WHERE slug = 'kaia-sistema-operativo-creativo';

-- EJ 7
INSERT INTO exercises (workshop_id, title, objective, prompt_text, "order")
SELECT id, 'Tu kit de Fase 3 — Acción intuitiva', 'Moverte sin caer en caos.',
$ej7$
**Completá:**

```
MI KIT DE FASE 3 — Acción intuitiva

Mi definición de "acción mínima":
(qué cuenta como primer paso real para mí)

Mi regla anti-procrastinación:
(ej: "si pasé más de 1 hora investigando sin actuar, paro y hago algo concreto")

Cómo documento lo que voy aprendiendo:
(daily note, audio, foto, lo que sea — sostenible)

Mi señal de que es hora de Fase 4:
(cuando empiezo a repetir cosas y quiero sistematizar)

Lo que NO voy a hacer en Fase 3:
- Volver a investigar más
- Pedir validación constante
- Otra: ___________
```

**Criterio de hecho:** sabés cómo te movés cuando estás en acción intuitiva, sin caer en caos.
$ej7$, 7
FROM workshops WHERE slug = 'kaia-sistema-operativo-creativo';

-- EJ 8
INSERT INTO exercises (workshop_id, title, objective, prompt_text, "order")
SELECT id, 'Tu kit de Fase 4 — Búsqueda de estructura', 'Estudiar para crecer, no para procrastinar.',
$ej8$
**Completá:**

```
MI KIT DE FASE 4 — Búsqueda de estructura

Cómo elijo qué framework estudiar:
(¿qué problema concreto resuelve? ¿lo puedo aplicar en mi trabajo real ya?)

Mi regla de aplicación inmediata:
(ej: "cada framework que leo se aplica esta semana o lo descarto")

Cómo adapto en vez de copiar:
(qué proceso uso para tomar partes de un framework)

Mi señal de alerta de que estoy procrastinando con estudio:
(cuando llevo X semanas estudiando sin aplicar)

Cuántos frameworks máximo estudio en paralelo:
(recomendado: 1-2)
```

**Criterio de hecho:** tenés clara la diferencia entre estudiar para crecer y estudiar para procrastinar.
$ej8$, 8
FROM workshops WHERE slug = 'kaia-sistema-operativo-creativo';

-- EJ 9
INSERT INTO exercises (workshop_id, title, objective, prompt_text, "order")
SELECT id, 'Tu kit de Fase 5 — Delegación', 'Soltar para liberar energía hacia lo nuevo.',
$ej9$
**Completá:**

```
MI KIT DE FASE 5 — Delegación

Tareas que repito semanalmente:
1. ___________
2. ___________
3. ___________
4. ___________
5. ___________

Por cada una, decido:
- AUTOMATIZAR (con qué herramienta)
- DELEGAR (a quién)
- DEJAR (porque me nutre o es esencial)

Mi resistencia más común a soltar:
(ej: "lo hago mejor yo", "nadie lo va a entender como yo")

Mi recordatorio para vencer esa resistencia:
___________

Mi señal de que necesito Fase 5 urgente:
(ej: cuando trabajo más de 50h/semana y siento que el proyecto no escala)
```

**Criterio de hecho:** identificaste al menos 3 tareas para automatizar/delegar en los próximos 30 días.
$ej9$, 9
FROM workshops WHERE slug = 'kaia-sistema-operativo-creativo';

-- EJ 10
INSERT INTO exercises (workshop_id, title, objective, prompt_text, "order")
SELECT id, 'Tu kit de Fase 6 — Reflexión', 'Pausar sin paralizarte.',
$ej10$
**Completá:**

```
MI KIT DE FASE 6 — Reflexión

Cuándo me permito pausa de reflexión:
(ej: al final de cada trimestre)

Cómo reflexiono sin paralizarme:
(ej: pausa de 1 semana con fecha de regreso fija)

Preguntas que me hago en Fase 6:
1. ¿Qué impacto humano tuvo lo que construí?
2. ¿Qué aprendí a nivel personal?
3. ___________
4. ___________

Mis personas tocadas a las que voy a buscar:
(para escuchar el impacto real)
1. ___________
2. ___________

Mi señal de que estoy entrando en parálisis:
(cuando llevo más de X semanas reflexionando sin crear)

Mi recordatorio para volver a crear:
___________
```

**Criterio de hecho:** tenés un protocolo para pausar SIN paralizarte.
$ej10$, 10
FROM workshops WHERE slug = 'kaia-sistema-operativo-creativo';

-- EJ 11
INSERT INTO exercises (workshop_id, title, objective, prompt_text, "order")
SELECT id, 'Tu kit de Fase 7 — Redirección', 'Cerrar con dignidad cuando llegue el momento.',
$ej11$
**Completá:**

```
MI KIT DE FASE 7 — Redirección

Señales de que un proyecto pide cerrar:
1. ___________
2. ___________
3. ___________

Lo que me cuesta soltar:
(¿culpa? ¿identidad? ¿lealtad? ¿miedo a "fracasar"?)

Mi cierre digno incluye:
- Documentar aprendizajes antes de cerrar
- Comunicar a personas involucradas
- Permitirme el duelo (cuánto tiempo: ___)
- Capturar la siguiente chispa que ya está pidiendo paso

Mi frase ancla cuando cierro:
"Esto fue. Ya no es. Soltarlo abre espacio para lo siguiente."

Persona de confianza para hablar del cierre:
___________
```

**Criterio de hecho:** sabés cómo cerrar un proyecto con dignidad cuando llegue el momento (no *si* — *cuando*).
$ej11$, 11
FROM workshops WHERE slug = 'kaia-sistema-operativo-creativo';

-- EJ 12
INSERT INTO exercises (workshop_id, title, objective, prompt_text, "order")
SELECT id, 'Tu ritmo semanal de revisión KAIA', 'Instalar el ritual que mantiene el sistema vivo.',
$ej12$
**Diseñá:**

```
MI REVISIÓN SEMANAL KAIA (15-20 min)

Día y hora fijos:
(ej: domingo 19:00)

Pasos:
1. Listo mis proyectos activos
2. Por cada uno, identifico la fase actual
3. Pregunto:
   - ¿Avanzó esta semana? ¿En qué dirección?
   - ¿Necesita pasar a otra fase?
   - ¿Hay algo que está pidiendo Fase 7?
4. Decido 1 acción concreta por proyecto para la próxima semana
5. Capturo aprendizajes de la semana

Lugar donde lo registro:
(libreta, Notion, Obsidian)
```

**Criterio de hecho:** tenés día, hora y lugar definidos. La primera revisión es este domingo.
$ej12$, 12
FROM workshops WHERE slug = 'kaia-sistema-operativo-creativo';

-- EJ 13
INSERT INTO exercises (workshop_id, title, objective, prompt_text, "order")
SELECT id, 'Tu plan de 21 días con KAIA', 'Convertir KAIA en sistema operativo antes de que se enfríe.',
$ej13$
**Compromiso:**

```
COMPROMISO DE 21 DÍAS CON KAIA

Yo, ____________, me comprometo a:

- Identificar mi fase actual en mis 2-3 proyectos clave cada DOMINGO
- Aplicar el kit correspondiente a cada fase
- Si detecto que estoy trabada en mi fase de bloqueo personal, activar el kit específico
- Asistir a los 3 check-ins grupales del taller
- Documentar al menos 1 transición de fase (de la X a la Y) que viva en estos 21 días

AL DÍA 21 voy a revisar:
- ¿Qué proyectos movieron de fase?
- ¿Qué patrón se reveló?
- ¿Qué necesita Fase 7?
- ¿Qué nueva Fase 1 está pidiendo paso?

Firma: ____________
Fecha: ____________
```

**Criterio de hecho:** firmado, visible, con fecha de check-in del día 21.
$ej13$, 13
FROM workshops WHERE slug = 'kaia-sistema-operativo-creativo';

-- ============================================================
-- 5) GLOSARIO (21 términos)
-- ============================================================
INSERT INTO glossary_terms (workshop_id, term, definition, category)
SELECT w.id, t.term, t.definition, t.category FROM workshops w,
(VALUES
  -- Fundamentos del modelo
  ('KAIA', 'Modelo de Aprendizaje y Creación Inversa creado por Jennifer Salazar Duke. Nombre con orígenes escandinavo (tierra viva), hawaiano (mar) y griego (Gaia).', 'fundamentos'),
  ('Aprendizaje inverso', 'Aprender desde la emoción hacia la estructura, no al revés. Núcleo metodológico de KAIA.', 'fundamentos'),
  ('7 fases', 'Las etapas del ciclo creativo según KAIA: Origen → Visión → Acción → Estructura → Delegación → Reflexión → Redirección.', 'fundamentos'),
  ('Ciclo no lineal', 'Característica de KAIA — podés estar en distintas fases en distintos proyectos a la vez.', 'fundamentos'),
  ('Gaia', 'Origen griego de KAIA. Diosa que da origen a la vida.', 'fundamentos'),
  ('Manifiesto KAIA', 'Documento de 1 página que captura el alma del modelo. Se relee cuando dudás.', 'fundamentos'),
  ('Framework', 'Estructura de pensamiento o trabajo. KAIA es un framework — uno entre muchos, pero el que ordena alma → acción → rigor.', 'fundamentos'),
  -- Las 7 fases
  ('Origen emocional', 'Fase 1 de KAIA. La chispa inicial de la que nace toda creación auténtica. Emoción: intensidad. Riesgo: quedarte en la chispa sin avanzar.', 'fases'),
  ('Visión amplia', 'Fase 2 de KAIA. Imaginar el escenario completo sin filtrar por viabilidad. Emoción: expansión. Riesgo: vivir en la visión sin aterrizar.', 'fases'),
  ('Acción intuitiva', 'Fase 3 de KAIA. Movimiento sin tener todo claro, con dirección emocional. Emoción: valentía + incomodidad. Riesgo: confundir acción con caos.', 'fases'),
  ('Búsqueda de estructura', 'Fase 4 de KAIA. Buscar frameworks que sostienen lo que ya empezaste. Emoción: humildad. Riesgo: enamorarte de los frameworks y dejar de crear.', 'fases'),
  ('Delegación', 'Fase 5 de KAIA. Soltar control de tareas para liberar energía hacia lo nuevo. Emoción: decisión + duelo. Riesgo: volverte cuello de botella.', 'fases'),
  ('Reflexión', 'Fase 6 de KAIA. Mirar atrás con intención para integrar aprendizajes. Emoción: quietud. Riesgo: confundir pausa con parálisis.', 'fases'),
  ('Redirección', 'Fase 7 de KAIA. Reconocer cuándo soltar lo que ya no vibra. Emoción: duelo + libertad. Riesgo: sostener por culpa lo que ya no es tuyo.', 'fases'),
  -- Aplicación del modelo
  ('Chispa emocional', 'El detonante de Fase 1 — la intuición o emoción que pide ser atendida.', 'aplicacion'),
  ('Diagnóstico KAIA', 'Cuestionario de 14 preguntas para identificar tu fase actual respecto a un proyecto.', 'aplicacion'),
  ('Fase de bloqueo personal', 'La fase donde típicamente te trabás. Conocerla es liberador y permite anticipar el atasco.', 'aplicacion'),
  ('Cierre digno', 'Forma de transitar Fase 7 reconociendo aprendizajes antes de soltar, comunicando a personas involucradas y permitiéndote el duelo.', 'aplicacion'),
  ('Ritmo semanal KAIA', 'Revisión de 15-20 min cada semana para identificar fase de cada proyecto y decidir 1 acción concreta por proyecto.', 'aplicacion'),
  -- Marcos relacionados
  ('CBT (Terapia Cognitivo-Conductual)', 'Enfoque terapéutico basado en evidencia. Marco complementario a KAIA — pertenece al territorio de Fase 4 cuando trabajás pensamientos.', 'relacionados'),
  ('THT', 'Test de perfil cognitivo (Talent Hunter Test) — sistema de colores que mapea estilos de pensamiento. Marco complementario a KAIA.', 'relacionados')
) AS t(term, definition, category)
WHERE w.slug = 'kaia-sistema-operativo-creativo';

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
-- FROM workshops w WHERE slug = 'kaia-sistema-operativo-creativo';
--
-- Esperado: 5 secciones · 19 slides · 13 ejercicios · 21 términos
