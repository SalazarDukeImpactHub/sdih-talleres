-- ============================================================
-- TALLER 04 — Tu Sistema de Auto-Protección Mental
-- ============================================================
-- Cómo usar este archivo:
-- Opción A (recomendada): abrir en TablePlus conectado a Supabase y correr todo de una.
-- Opción B: pegar entero en Supabase SQL Editor (web).
--
-- Es idempotente: el DELETE inicial limpia residuos de intentos previos.
-- Si todo va bien al final tenés: 1 workshop, 5 secciones (con 16 slides
-- de aprendizaje), 10 ejercicios y 33 términos de glosario.
-- ============================================================

-- 1) Cleanup defensivo
DELETE FROM workshops WHERE slug = 'sistema-auto-proteccion-mental';

-- 2) Workshop
INSERT INTO workshops (
  slug, title, description, instructor,
  date_live, duration_min, prerequisites, status,
  whatsapp_message_template
) VALUES (
  'sistema-auto-proteccion-mental',
  'Tu Sistema de Auto-Protección Mental: infraestructura para decidir bien en cualquier estado',
  'Las decisiones que tomás cuando estás bien funcionan. Las que tomás cuando no estás bien te destruyen. Y nadie te enseñó a distinguir entre los dos momentos. Este taller te entrega un sistema operativo emocional construido durante 4 años con asesoría clínica y validado en la práctica diaria. No es autoayuda ni motivación: es ingeniería de sistemas aplicada a tu vida emocional. Vas a salir con 7 piezas funcionando — Mapa de Estados, Motor de Detección, 3 Semáforos, Protocolo Matutino, Protocolo de Crisis, Registro Emocional y Dashboard de Auditoría — más 30 días de acompañamiento para que el sistema se active de verdad.',
  'Jennifer Salazar Duque',
  NULL,
  360,
  'AVISO IMPORTANTE: Este taller NO reemplaza la terapia ni el tratamiento clínico. Es una herramienta de auto-conocimiento y diseño de sistemas personales para complementar — nunca sustituir — el trabajo profesional con salud mental. Si estás atravesando una crisis activa, ideas de daño a vos misma o a otros, o tenés un diagnóstico psiquiátrico activo sin acompañamiento, el primer paso es buscar ayuda profesional. Si tomás este taller con un proceso terapéutico paralelo, comentale a tu terapeuta lo que estás construyendo. Obligatorios: disposición a observarte sin juicio durante 6 horas + 30 días; una libreta exclusiva para este sistema (mínimo 100 hojas); un lápiz y bolígrafos de 3 colores (verde, amarillo, rojo); privacidad para los ejercicios; si estás en proceso terapéutico, comentale a tu terapeuta. Muy recomendados: tener identificadas al menos 2 personas de tu círculo de confianza; acceso a Notion, Obsidian o app de notas; estar fuera de una crisis activa al momento de empezar. NO es para vos hoy si: estás en crisis aguda; no tenés tiempo o energía para 30 días de práctica; esperás una solución rápida.',
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
  "title": "Bienvenida — tu sistema operativo emocional",
  "description": "## ⚠️ Aviso importante antes de empezar\n\nEste taller **no reemplaza la terapia ni el tratamiento clínico**. Es una herramienta de auto-conocimiento y diseño de sistemas personales para complementar — nunca sustituir — el trabajo profesional con salud mental.\n\nSi estás atravesando una crisis activa, ideas de daño a vos misma o a otros, o tenés un diagnóstico psiquiátrico activo sin acompañamiento → el primer paso es buscar ayuda profesional. Este taller puede ser un complemento útil, no un sustituto.\n\nSi tomás este taller con un proceso terapéutico paralelo, comentale a tu terapeuta lo que estás construyendo. Tu sistema funcionará mejor en diálogo con tu proceso clínico.\n\n---\n\n## Antes de empezar, algo personal\n\nTe voy a contar algo personal antes de empezar — porque importa que sepas desde dónde te hablo.\n\nHace cuatro años, después de la pérdida de mi hermano Stiven y atravesando un proceso clínico complejo, me di cuenta de algo que cambió todo:\n\n> **Las decisiones que tomaba cuando estaba bien funcionaban. Las decisiones que tomaba cuando no estaba bien me destruían sistemáticamente.**\n\nEl problema no era que me equivocaba a veces. Era que tomaba decisiones importantes desde estados que **no tenían acceso a mi corteza prefrontal** — el lugar donde se piensa con claridad. Y nadie me había enseñado a distinguir entre los dos momentos.\n\nConstruí, con apoyo clínico, un sistema operativo emocional. No para *ser fuerte* — para tener infraestructura cuando la fortaleza no aparece. Hoy te voy a enseñar a construir el tuyo.\n\nNo tenés que tener un diagnóstico para necesitar esto. Cualquiera que haya tomado una decisión que después se arrepintió en frío, sabe de qué hablo.\n\n## Lo que vas a salir teniendo\n\n**Esto no es autoayuda.** Esto es ingeniería de sistemas aplicada a tu vida emocional. Vas a salir del taller con **7 piezas funcionando**:\n\n1. Tu **Mapa de Estados** personal (no genérico — el tuyo)\n2. Tu **Motor de Detección** — qué señales mirar antes de reaccionar\n3. Tus **3 Semáforos** para filtrar decisiones importantes\n4. Tu **Protocolo Matutino** ajustado a tu vida real\n5. Tu **Protocolo de Crisis** para los días difíciles\n6. Tu **Registro Emocional** diario (en papel o digital, vos elegís)\n7. Tu **Dashboard de Auditoría** para ver patrones en el tiempo\n\nY un **acompañamiento de 30 días post-taller** para que el sistema se active de verdad, no solo quede en papel.\n\n## Qué NO vas a aprender\n\n- **No es un curso de meditación**. La meditación puede ser parte de tu sistema, pero no el centro\n- **No es coaching motivacional**. No hay frases bonitas. Hay protocolos\n- **No es terapia**. No vamos a procesar trauma — vamos a construir infraestructura para gestionar el sistema nervioso día a día\n- **No promete que vas a estar bien siempre**. Promete que vas a saber qué hacer cuando no lo estés\n\n## Duración y acompañamiento\n\n- 6 horas en vivo (2 sesiones de 3h)\n- 30 días de práctica con seguimiento\n- 4 check-ins grupales semanales de 45 min (opcional asistir, queda grabado)\n- Acceso al canal privado de soporte\n- Revisión personalizada de tu sistema al día 30\n\n> **Construir esto no te va a hacer estar bien siempre. Te va a hacer saber qué hacer cuando no estás bien — y eso lo cambia todo.**",
  "quick_links": [
    {"label": "La regla de oro + 15 diapositivas", "target_section": "aprendizaje"},
    {"label": "10 ejercicios accionables", "target_section": "taller"},
    {"label": "Setup de tu sistema (papel + digital)", "target_section": "instalacion"},
    {"label": "Glosario", "target_section": "glosario"}
  ]
}
$inicio$::jsonb
FROM workshops WHERE slug = 'sistema-auto-proteccion-mental';

-- APRENDIZAJE (16 slides: intro/regla de oro + 15 diapositivas)
INSERT INTO sections (workshop_id, type, section_order, content_json)
SELECT id, 'aprendizaje', 2,
$apr$
{
  "type": "aprendizaje",
  "title": "El sistema, paso a paso",
  "slides": [
    {"kicker": "Regla de oro del sistema", "title": "Detectar NO es juzgar", "body": "Esta es la frase más importante del taller. Volvé a ella cada vez que te pierdas.\n\nCuando detectás un estado emocional, una señal o un patrón, **no estás juzgándote**. Estás haciendo lo que un piloto hace cuando mira el panel de instrumentos: leer datos para tomar decisiones informadas.\n\nTu cerebro no está tratando de hacerte daño. Está tratando de protegerte usando las herramientas que aprendió. A veces esas herramientas son obsoletas, exageradas o ya no aplican.\n\n**El sistema que vas a construir le da herramientas mejores.**", "notes": null},
    {"kicker": "Diapositiva 1 · Neurobiología sin humo", "title": "Por qué la fuerza de voluntad no alcanza", "body": "Te lo digo sin vueltas: si pudieras *decidir estar bien*, ya lo habrías hecho.\n\nLa razón por la que no podés es **neurobiológica**, no de carácter:\n\n| Estructura | Función | Cuándo se activa |\n|-----------|---------|------------------|\n| Amígdala | Sistema de alarma. Detecta amenazas | En milisegundos, antes que la conciencia |\n| Corteza prefrontal | Razonamiento, decisiones, autorregulación | Necesita la amígdala calma para funcionar bien |\n| Sistema nervioso autónomo | Respiración, latido, digestión | Refleja tu estado emocional sin que vos decidas |\n\n**Lo que esto implica:** cuando la amígdala se enciende, la corteza prefrontal **pierde acceso**. Físicamente. No es debilidad. Es diseño cerebral.\n\nLas personas que parecen *controladas* no controlan más sus emociones — **tienen sistemas que les permiten no decidir desde la amígdala**.\n\nEso es lo que vamos a construir.", "notes": null},
    {"kicker": "Diapositiva 2 · El núcleo del sistema", "title": "Los 3 estados que tenés (sí, vos también)", "body": "Toda persona, todo el tiempo, está en uno de tres estados. Aprender a identificarlos es la base del sistema.\n\n| Estado | Cómo se siente | Qué podés hacer bien | Qué NO deberías hacer |\n|--------|----------------|---------------------|----------------------|\n| 🟢 **ESTABLE** | Descansada, clara, con energía moderada, sin conflicto activo | Cualquier decisión, vínculos profundos, trabajo creativo | Nada está restringido |\n| 🟡 **ATENCIÓN** | Cansada, emocionalmente activada, bajo presión, irritable | Tareas mecánicas, decisiones pequeñas reversibles | Decisiones importantes, conversaciones difíciles, compromisos largos |\n| 🔴 **PROTECCIÓN** | En crisis, sin dormir, conflicto fuerte, euforia excesiva, disociación | **Solo ejecutar lo ya decidido** y autocuidado | **Ninguna decisión nueva**. Solo proteger |\n\n**Regla dura:** identificar el estado no es opcional. Es el primer dato que el sistema necesita.", "notes": null},
    {"kicker": "Diapositiva 3 · Misma decisión, opuesto resultado", "title": "Por qué importa el estado al decidir", "body": "Una persona en estado 🔴 que toma una decisión importante:\n- Tiene la amígdala manejando, no la corteza\n- Confunde urgencia emocional con urgencia real\n- Ve en blanco y negro (splitting)\n- Decide *para sentirse mejor*, no para construir bien\n- Se compromete a cosas que no va a poder sostener\n\nUna persona en estado 🟢 que toma la **misma** decisión:\n- Tiene acceso al razonamiento completo\n- Distingue urgencia real de urgencia emocional\n- Ve matices\n- Decide desde la claridad, no desde el alivio\n- Solo se compromete a lo sostenible\n\n**La decisión es la misma. El resultado es opuesto.**", "notes": null},
    {"kicker": "Diapositiva 4 · El Motor de Detección", "title": "8 dimensiones para mirarte", "body": "Tu sistema necesita saber **qué señales mirar**. Te paso las 8 dimensiones que vas a personalizar en el ejercicio:\n\n| Dimensión | Qué detecta | Ejemplo de señal |\n|-----------|-------------|------------------|\n| 1 · **Estado general** | Cuál de los 3 estados estás | *Me desperté con el pecho apretado* |\n| 2 · **Pensamiento dicotómico** | Ver en blanco/negro | *Esto es una mierda* / *Esto es perfecto* |\n| 3 · **Miedo al abandono** | Decidir desde el *no me dejes* | *Le digo sí para que no se enoje* |\n| 4 · **Codependencia** | Perderse en el otro | *No sé qué quiero yo* |\n| 5 · **Autoinvalidación** | Negar la propia emoción | *Estoy exagerando* |\n| 6 · **Urgencia falsa** | Sentir que TIENE que ser ya | *Si no decido ahora se pierde* |\n| 7 · **Cuerpo** | Señales físicas | Insomnio, mandíbula apretada, taquicardia |\n| 8 · **Vínculos** | Cómo respondés a otros | Reactividad alta, evitación, idealización |\n\nNo todas se activan en vos. En el ejercicio vamos a personalizar cuáles son TUS dimensiones críticas.", "notes": null},
    {"kicker": "Diapositiva 5 · El flujo", "title": "Cómo funciona detectar (paso a paso)", "body": "```\nEstímulo (algo pasa)\n   ↓\nReacción emocional (la amígdala se enciende)\n   ↓\n🛑 PAUSA ← acá entra tu sistema\n   ↓\nDetectar: ¿qué estado estoy? ¿qué señales hay?\n   ↓\nFiltrar: ¿esto requiere decisión ahora o puedo esperar?\n   ↓\nAcción consciente o protocolo de espera\n```\n\n**El paso 🛑 PAUSA es lo que la mayoría no tiene.**\n\nSin pausa, vas del estímulo a la reacción directo. Y la reacción la decide la amígdala.", "notes": null},
    {"kicker": "Diapositiva 6 · Los 3 filtros", "title": "Los 3 semáforos para decidir", "body": "Toda decisión importante pasa por 3 semáforos antes de ejecutarse:\n\n| Semáforo | Pregunta | 🟢 Verde | 🔴 Rojo |\n|----------|----------|----------|----------|\n| **Ético** | ¿Está alineado con mis valores? | Hay paz y claridad interna | Hay inquietud o conflicto |\n| **Estratégico** | ¿Encaja en el mapa grande de mi vida? | Tiene lugar claro | No lo veo en el mapa |\n| **Emocional** | ¿En qué estado estoy decidiendo esto? | 🟢 Estable | 🟡 o 🔴 |\n\n**Regla:** si 1 o más semáforos están en rojo → **ESPERAR**. No ejecutar hoy.\n\n**Excepción:** decisiones pequeñas y reversibles pueden ejecutarse en 🟡. Las decisiones grandes, irreversibles o costosas — **nunca en 🟡 o 🔴**.", "notes": null},
    {"kicker": "Diapositiva 7 · El superpoder", "title": "Decisión diferida", "body": "Cuando algún semáforo está rojo, la decisión se **difiere**, no se descarta.\n\n**Protocolo:**\n1. **Capturás** la decisión por escrito (en tu Registro Emocional o libreta)\n2. **Esperás** mínimo 24 horas (algunas decisiones, mínimo 7 días)\n3. **Revisás** en estado 🟢\n4. **Solo entonces** pasás por los 3 semáforos\n\n> **El 80% de las decisiones que sentís urgentes en 🔴 no lo son.** Las que sí lo son, sobreviven 24 horas de espera.\n\nEsto solo lo aprendés cuando lo practicás. La primera vez que diferís una decisión y después decís *qué bueno que no la tomé ayer*, el sistema queda instalado para siempre.", "notes": null},
    {"kicker": "Diapositiva 8 · La primera media hora", "title": "Por qué la mañana es la batalla más importante", "body": "La amígdala despierta antes que la corteza prefrontal. **Físicamente**. Eso significa:\n\n- La primera media hora del día decide el resto del día\n- Si revisás el celular antes de despertar bien → empezás en 🟡 o 🔴\n- Si tomás decisiones en los primeros 30 minutos → las toma tu amígdala\n- Si te peleás antes de dormir → la mañana arranca en rojo\n\n**La calidad de tu mañana se decide la noche anterior.** Y la primera media hora de la mañana decide el resto del día.", "notes": null},
    {"kicker": "Diapositiva 9 · Protocolo Matutino", "title": "6 pasos universales", "body": "| Paso | Duración | Qué hacer |\n|------|----------|-----------|\n| 1 · Despertar suave | 0-5 min | No saltar, no celular, no noticias, no redes. Mano en pecho + abdomen |\n| 2 · Nombrar sin juzgar | 1 min | *Hoy me desperté con ___*. Validar: *Es válido. No tengo que cambiarlo ahora* |\n| 3 · Cuidado corporal | 10-15 min | Agua → movimiento suave → higiene → comida simple |\n| 4 · Registro rápido | 2 min | Solo 3 campos: estado (🟢🟡🔴), emoción, horas de sueño |\n| 5 · Pausa de decisiones | 30 min desde despertar | NINGUNA decisión importante. Capturar urgencias en libreta, no actuar |\n| 6 · Transición al día | 5 min | Identificar tarea más importante según el estado del día |\n\n**Versión mínima para días difíciles:** Agua → Nombrar la emoción → No decidir nada en 30 min.\n\nTres cosas. Eso ya es protección.", "notes": null},
    {"kicker": "Diapositiva 10 · Protocolo de Crisis", "title": "Para los días rojos", "body": "Cuando estás en 🔴, el sistema cambia de objetivo:\n\n**No es:** ser productiva, decidir bien, ser amable, *salir adelante*\n**Es:** mantener seguridad, regular el sistema nervioso, no hacer daño (a vos ni a otros), pasar el día\n\n### Las 5 reglas del 🔴\n\n1. **Ninguna decisión importante.** Capturás todo en libreta. Decidís después\n2. **Ningún compromiso nuevo.** Cancelás lo cancelable. Pedís ayuda con lo no cancelable\n3. **No estés sola si podés evitarlo.** Activá una persona del círculo de confianza\n4. **Grounding constante.** Cuerpo, agua, movimiento, contacto con la realidad física\n5. **Registrá lo mínimo.** El registro hoy es solo para que mañana sepas qué pasó\n\n### Técnica 5-4-3-2-1 (grounding rápido)\n\n- **5 cosas que ves** (nombralas en voz alta)\n- **4 cosas que tocás**\n- **3 cosas que oís**\n- **2 cosas que olés**\n- **1 cosa que saboreás**\n\nEsta técnica trae a la corteza prefrontal de vuelta online. No es magia — es neurobiología.", "notes": null},
    {"kicker": "Diapositiva 11 · Tu base de datos", "title": "El Registro Emocional", "body": "> Si no medís, no aprendés. Si medís todos los días, en 90 días tenés más información sobre vos que en 30 años de vida sin sistema.\n\nEl registro diario tiene 3 niveles:\n\n### Nivel mínimo (1 minuto)\n```\nFecha:\nEstado mañana: 🟢 / 🟡 / 🔴\nEmoción al despertar:\nHoras de sueño:\n```\n\n### Nivel medio (3 minutos)\n```\n+ Eventos disparadores del día\n+ Estado al cierre del día\n+ Decisión importante tomada (si la hubo)\n+ Protocolos activados (matutino, crisis, ninguno)\n```\n\n### Nivel completo (8 minutos)\n```\n+ Señales del Motor de Detección activadas\n+ Splitting / Abandono / etc — qué dimensión se prendió\n+ Cómo respondí (acción vs reacción)\n+ Aprendizaje del día\n+ Una cosa por la que agradezco (no obligación, ancla)\n```\n\n**Regla:** empezás con el nivel mínimo. Subís de nivel cuando el mínimo se vuelve hábito. No al revés.", "notes": null},
    {"kicker": "Diapositiva 12 · La auditoría", "title": "Dashboard de patrones en el tiempo", "body": "Después de 30 días de registro, mirás patrones:\n\n| Pregunta | Cómo responderla |\n|----------|------------------|\n| ¿Cuántos días estuve en cada estado? | Contás 🟢 🟡 🔴 |\n| ¿Qué eventos disparan más mis 🔴? | Buscás patrones en los eventos disparadores |\n| ¿Qué horas del día son las más vulnerables? | Si registrás momentos, las identificás |\n| ¿Cómo me afecta dormir menos de X horas? | Cruzás horas de sueño con estado del día |\n| ¿Qué decisiones tomadas en 🟡 funcionaron / no funcionaron? | Revisás decisiones a 7d y 30d |\n| ¿Qué protocolos activé y cuáles funcionaron? | Trazabilidad de tus propias intervenciones |\n\n**Esto es ciencia personal.** Vos sos el sujeto, el investigador y el beneficiario.", "notes": null},
    {"kicker": "Diapositiva 13 · No podés solo", "title": "El círculo de confianza", "body": "Una pieza crítica que la gente olvida: **necesitás aliados informados**.\n\nTu sistema tiene que incluir 2 a 4 personas que:\n- Saben que tenés este sistema\n- Saben qué pedirte cuando estás en cada estado\n- Pueden recibir un mensaje tuyo tipo *Hoy estoy en rojo, no puedo decidir nada* sin tomarlo personal\n- Saben cuándo intervenir y cuándo solo escuchar\n\n**Conversación que vas a tener con cada persona del círculo:**\n\n> *Estoy construyendo un sistema personal de gestión emocional. Necesito que sepas cómo funciona para que cuando te diga estoy en X, sepas qué hacer. ¿Te puedo explicar?*\n\nLa mayoría te dice que sí. Los que no entienden, no eran tu círculo de confianza para esto.", "notes": null},
    {"kicker": "Diapositiva 14 · La métrica real", "title": "El sistema NO es perfección — es trazabilidad", "body": "Vas a fallar. Vas a decidir desde 🔴 alguna vez. Vas a olvidar el registro durante una semana. Vas a saltarte el protocolo matutino.\n\n**El sistema no se rompe por eso.** Se rompe cuando dejás de registrar las fallas.\n\n| Sin sistema | Con sistema |\n|-------------|-------------|\n| Fallo y no sé por qué | Fallo y veo qué pasó |\n| Repito el mismo error | Veo el patrón y ajusto |\n| Me culpo o me victimizo | Observo y diseño mejor |\n| El siguiente fallo es igual de doloroso | El siguiente fallo me cuesta menos |\n\n**El objetivo no es no fallar. Es fallar con datos.**", "notes": null},
    {"kicker": "Diapositiva 15 · Cierre", "title": "5 ideas para llevarte", "body": "1. **Detectar NO es juzgar.** Es la regla fundamental del sistema\n2. **Tu cerebro no te quiere hacer daño.** Está usando herramientas obsoletas — vas a darle mejores\n3. **El estado en que decidís importa más que la decisión.** La misma decisión, distinto estado, opuesto resultado\n4. **La pausa es el superpoder.** Diferir es protección, no debilidad\n5. **El sistema sin acompañamiento queda en papel.** Tu círculo de confianza es parte del sistema\n\n> **Construir esto no te hace fuerte. Te hace tener infraestructura cuando la fortaleza no aparece.**", "notes": null}
  ]
}
$apr$::jsonb
FROM workshops WHERE slug = 'sistema-auto-proteccion-mental';

-- TALLER
INSERT INTO sections (workshop_id, type, section_order, content_json)
SELECT id, 'taller', 3,
$taller$
{
  "type": "taller",
  "title": "Construí tu sistema, paso a paso",
  "instructions": "Tenés **10 ejercicios** ordenados como una secuencia que sí podés terminar.\n\nLos **Ejercicios 1-3** son de auto-conocimiento: tu Mapa de Estados, tu Motor de Detección personalizado y tus disparadores.\n\nLos **Ejercicios 4-6** construyen las herramientas operativas: tus 3 Semáforos, tu Protocolo Matutino y tu Protocolo de Crisis.\n\nLos **Ejercicios 7-9** activan el sistema en el mundo: conversación con tu círculo de confianza, diseño del Registro Emocional y tu compromiso firmado de 30 días.\n\nEl **Ejercicio 10** se hace al día 30 — es la auditoría retrospectiva con todos los datos.\n\n**Materiales:** libreta exclusiva (mínimo 100 hojas) + bolígrafos verde, amarillo y rojo + un lugar privado para escribir sin que te interrumpan.\n\n**Reglas del taller:**\n- Hacelos en orden. Cada uno depende del anterior\n- No los hagas en estado 🔴 — esperá a estar 🟢 o al menos 🟡 bajo\n- Especificá. Lo genérico no te va a servir cuando lo necesites\n- Si algún ejercicio te activa fuerte emocionalmente, parálo y volvé mañana",
  "placeholder": "Si no ves los ejercicios todavía, recargá la página."
}
$taller$::jsonb
FROM workshops WHERE slug = 'sistema-auto-proteccion-mental';

-- INSTALACIÓN
INSERT INTO sections (workshop_id, type, section_order, content_json)
SELECT id, 'instalacion', 4,
$inst$
{
  "type": "instalacion",
  "title": "Setup del sistema en tu vida real",
  "steps": [
    {"order": 1, "title": "Elegí formato: papel o digital", "description": "**Recomendación firme para los primeros 30 días: papel.** El acto físico de escribir activa procesos cognitivos que el typing no.\n\n| Si... | Empezá con |\n|-------|------------|\n| Sos sensible a pantallas, ansiedad con notificaciones | Papel |\n| Querés rapidez y no te molestan las pantallas | Digital |\n| Estás todo el día con celular | Papel (para crear contraste) |\n| Tenés tu vida en Notion / Obsidian | Digital integrado |\n| Es la primera vez que llevás un registro emocional | Papel |\n| Ya llevaste registros y los abandonaste | Papel + recordatorio digital |", "code": "Papel:    primeros 30 días\nDigital:  después del día 30, si lo necesitás\nMixto:    mínimo en papel + completo en digital", "language": "bash"},
    {"order": 2, "title": "Materiales físicos", "description": "Si elegís papel (recomendado para los primeros 30 días):\n\n- **Libreta exclusiva para el sistema** (no la mezclés con trabajo). Mínimo 100 hojas\n- **Bolígrafos:** uno verde, uno amarillo, uno rojo — para marcar estados\n- **Un marcador o sticker visible** para señalar páginas críticas (protocolo de crisis, lista del círculo de confianza)\n- **Un lugar fijo** donde la libreta vive (mesita de noche, escritorio)", "code": "Libreta:     1 exclusiva, mínimo 100 hojas\nBolígrafos:  verde 🟢 + amarillo 🟡 + rojo 🔴\nSticker:     páginas críticas (crisis, círculo)\nLugar:       fijo, accesible, privado", "language": "bash"},
    {"order": 3, "title": "Recordatorios y protección de la mañana", "description": "El sistema vive de la consistencia. Para los primeros 30 días:\n\n1. **Alarma matutina** para el registro mínimo (después de despertar bien)\n2. **Alarma nocturna** opcional para el registro de cierre\n3. **Recordatorio semanal** para revisar el dashboard\n4. **Recordatorios desactivados** en redes sociales antes de despertar (las apps de IG/TikTok/etc activan dopamina antes de tu corteza prefrontal — pésima combinación)", "code": "07:00  Alarma — registro mínimo (después de despertar)\n22:00  Alarma — registro de cierre (opcional)\nDom    Recordatorio — revisión semanal dashboard\nOFF    Notificaciones de redes antes del despertar", "language": "bash"},
    {"order": 4, "title": "Setup digital (opcional, después del día 30)", "description": "Si después de 30 días querés mover el sistema a digital:\n\n**Notion** — workspace privado: *Mi Sistema de Protección Mental*. Páginas: Mapa de Estados · Motor de Detección · 3 Semáforos · Protocolo Matutino · Protocolo de Crisis · Círculo de Confianza · Registro Emocional (database) · Dashboard.\n\nDatabase del Registro con propiedades: fecha, estado mañana, estado cierre, emoción, horas sueño, disparadores, protocolo activado, decisión tomada.\n\n**Obsidian** (perfil técnico) — vault dedicado o carpeta dentro de tu vault existente. Plantilla diaria con frontmatter YAML + Dataview queries para Dashboard automático.", "code": "---\nfecha: 2026-XX-XX\nestado_manana: 🟢/🟡/🔴\nestado_cierre: 🟢/🟡/🔴\nemocion: \nhoras_sueno: \ndisparadores: []\nprotocolo: \n---", "language": "yaml"},
    {"order": 5, "title": "Privacidad y seguridad de tus datos", "description": "**Es información profundamente personal.** Cuidá los datos como cuidás los financieros.\n\n| Si guardás en... | Recomendación |\n|------------------|---------------|\n| Libreta física | En cajón con cierre o lugar privado. No la dejés a la vista |\n| Notion | Workspace privado, 2FA activado, no compartir con nadie |\n| Obsidian | Local en tu máquina. Si syncás, usá Obsidian Sync (encriptado) o iCloud privado |\n| Apple Notes / Google Keep | Carpeta con password + 2FA de cuenta |\n\n**Regla:** si dudás de la privacidad, mantenelo en papel.", "code": "Papel:    cajón con cierre, lugar privado\nNotion:   workspace privado + 2FA\nObsidian: local + sync encriptado\nApple/G:  carpeta con password + 2FA", "language": "bash"},
    {"order": 6, "title": "Activar tu círculo de confianza", "description": "1. Hacé las 2-4 conversaciones del Ejercicio 7\n2. Por cada persona que aceptó:\n   - Guardá su contacto con etiqueta visible (ej: ⭐ Círculo - María)\n   - Anotá su rol específico\n   - Tené tu mensaje preescrito de crisis guardado como borrador\n3. Pedile a una persona que te recuerde el check-in semanal del taller", "code": "Contacto:     ⭐ Círculo - [Nombre]\nRol:          qué le pido en 🟡 y 🔴\nMensaje:      borrador listo en la app de mensajería\nRecordatorio: una persona te activa el check-in semanal", "language": "bash"},
    {"order": 7, "title": "Verificación final antes del día 1", "description": "Antes de arrancar mañana, asegurate de tener:\n\n- [ ] Libreta lista y en lugar fijo\n- [ ] Bolígrafos de colores disponibles\n- [ ] Mapa de Estados escrito (Ejercicio 1)\n- [ ] Motor de Detección personalizado (Ejercicio 2)\n- [ ] Disparadores identificados (Ejercicio 3)\n- [ ] 3 Semáforos definidos (Ejercicio 4)\n- [ ] Protocolo Matutino diseñado (Ejercicio 5)\n- [ ] Protocolo de Crisis listo (Ejercicio 6)\n- [ ] Al menos 2 personas del círculo activadas (Ejercicio 7)\n- [ ] Plantilla del Registro Emocional lista (Ejercicio 8)\n- [ ] Compromiso de 30 días firmado (Ejercicio 9)\n- [ ] Alarma matutina configurada\n- [ ] Acceso al canal privado de soporte del taller\n\nSi todo ✅, **mañana empezás**. No hace falta esperar al lunes ni al 1ro del mes. **Mañana**.", "code": "Checklist completa → mañana arrancás\n(no esperés al lunes ni al 1ro del mes)", "language": "bash"},
    {"order": 8, "title": "Líneas de salud mental — Colombia e internacional", "description": "**Si en algún momento entrás en crisis durante los 30 días:**\n\n**Colombia:**\n- Línea Vida (Medellín): 123 opción 4\n- Línea Amiga (Bogotá): 106\n- Línea Nacional: 192 opción 4\n\n**Internacional:**\n- Argentina: 135 (CABA y GBA) / (011) 5275-1135\n- México: 800-290-0024\n- España: 024\n- Directorio internacional: [findahelpline.com](https://findahelpline.com)\n\n**Si tenés terapeuta:** activá la llamada de emergencia.\n**Si no tenés terapeuta y los 🔴 son frecuentes:** este es el momento de buscar uno.", "code": "Colombia\n  Medellín:    123 op. 4 (Línea Vida)\n  Bogotá:      106 (Línea Amiga)\n  Nacional:    192 op. 4\n\nInternacional\n  Argentina:   135 / (011) 5275-1135\n  México:      800-290-0024\n  España:      024\n  Directorio:  findahelpline.com", "language": "bash"}
  ],
  "success_message": "Listo. Tenés todo el sistema en su lugar — libreta, materiales, círculo activado, protocolos escritos y compromiso firmado. Mañana arrancás. Recordá: el objetivo no es ser perfecta. Es construir trazabilidad. Si fallás, no abandones — volvé al día siguiente."
}
$inst$::jsonb
FROM workshops WHERE slug = 'sistema-auto-proteccion-mental';

-- GLOSARIO
INSERT INTO sections (workshop_id, type, section_order, content_json)
SELECT id, 'glosario', 5,
$glo$
{"type": "glosario", "title": "Glosario del taller", "search_placeholder": "Buscá un término (ej: amígdala, grounding, semáforo)..."}
$glo$::jsonb
FROM workshops WHERE slug = 'sistema-auto-proteccion-mental';

-- ============================================================
-- 4) EJERCICIOS (10)
-- ============================================================

-- EJ 1
INSERT INTO exercises (workshop_id, title, objective, prompt_text, "order")
SELECT id, 'Tu Mapa de Estados personal', 'Identificar tus señales personales para los 3 estados.',
$ej1$
**Materiales:** libreta + bolígrafos verde, amarillo, rojo.

Dividí 3 páginas (una por estado) y respondé en cada una.

### Para 🟢 ESTABLE:
- ¿Cómo se siente mi cuerpo en este estado?
- ¿Qué pensamientos tengo?
- ¿Cómo respondo a la gente?
- ¿Qué actividades disfruto?
- Una frase que diría en este estado: __________

### Para 🟡 ATENCIÓN:
- ¿Qué señales corporales aparecen? (mandíbula, hombros, respiración, sueño)
- ¿Qué pensamientos repetitivos aparecen?
- ¿Cómo cambio en mis vínculos?
- ¿Qué disparadores me llevan acá usualmente?
- Una frase que diría en este estado: __________

### Para 🔴 PROTECCIÓN:
- ¿Cómo se siente físicamente?
- ¿Qué pienso de mí en este estado?
- ¿Qué hago / qué dejo de hacer?
- ¿Qué disparadores severos me llevan acá?
- Una frase que diría en este estado: __________

**Criterio de hecho:** podés mirar las 3 páginas y reconocer al estado **antes** de que escale. Si las descripciones son genéricas, no te van a servir — especificá.
$ej1$, 1
FROM workshops WHERE slug = 'sistema-auto-proteccion-mental';

-- EJ 2
INSERT INTO exercises (workshop_id, title, objective, prompt_text, "order")
SELECT id, 'Tu Motor de Detección personalizado', 'Mapear cuáles de las 8 dimensiones son críticas para vos y qué señales mirar.',
$ej2$
Por cada dimensión, respondé:

| Dimensión | ¿Aplica en mí? (sí/no) | Mi señal personal específica |
|-----------|----------------------|------------------------------|
| Estado emocional general | | (ej: ansiedad al despertar) |
| Pensamiento dicotómico | | (ej: *esto es una mierda* / *esto es perfecto*) |
| Miedo al abandono | | (ej: decir sí por miedo a perder) |
| Codependencia | | (ej: cambiar mi opinión para complacer) |
| Autoinvalidación | | (ej: *estoy exagerando*) |
| Urgencia falsa | | (ej: *si no decido ahora se pierde*) |
| Cuerpo | | (ej: insomnio, mandíbula apretada) |
| Vínculos | | (ej: idealización repentina) |

**Regla:** no todas tienen que aplicarte. Las que sí, **escribí la señal específica tuya** — no la genérica.

**Criterio de hecho:** tu tabla está completa con señales que vos reconocerías por escrito si las leyera otra persona observándote.
$ej2$, 2
FROM workshops WHERE slug = 'sistema-auto-proteccion-mental';

-- EJ 3
INSERT INTO exercises (workshop_id, title, objective, prompt_text, "order")
SELECT id, 'Identificá tus disparadores principales', 'Mapear qué situaciones disparan tus estados 🟡 y 🔴.',
$ej3$
En tu libreta, listá:

**Disparadores conocidos:**
- Personas: __________
- Situaciones: __________
- Pensamientos recurrentes: __________
- Eventos del cuerpo (cansancio, hambre, hormonal): __________
- Horarios o momentos del día: __________
- Lugares: __________
- Conversaciones tipo: __________

**Por cada disparador, marcá:**
- ¿Me lleva a 🟡 o 🔴?
- ¿Cuánto dura usualmente el estado?
- ¿Qué necesito hacer cuando se activa?

**Criterio de hecho:** tenés al menos 5 disparadores identificados con su patrón típico de respuesta.
$ej3$, 3
FROM workshops WHERE slug = 'sistema-auto-proteccion-mental';

-- EJ 4
INSERT INTO exercises (workshop_id, title, objective, prompt_text, "order")
SELECT id, 'Tus 3 semáforos personalizados', 'Definir tus criterios específicos para cada semáforo.',
$ej4$
Para cada semáforo, completá:

### Semáforo Ético
- Mis valores no negociables: __________
- ¿Cómo sé que algo está alineado? (señal corporal o mental): __________
- ¿Cómo sé que NO está alineado? (señal corporal o mental): __________

### Semáforo Estratégico
- Las áreas grandes de mi vida son: __________ (ej: profesional, familia, salud, vínculos, propósito)
- ¿Una decisión sin lugar en estas áreas es importante o ruido?: __________
- Mis prioridades del próximo año: __________

### Semáforo Emocional
- ¿En qué estado puedo decidir las decisiones más importantes? (la respuesta es 🟢, pero anotalo igual)
- ¿Cuánto tiempo difiero una decisión cuando estoy en 🟡?: __________
- ¿Cuánto cuando estoy en 🔴?: __________ (mínimo 24h, idealmente 7d)

**Criterio de hecho:** los 3 semáforos están definidos con criterios tuyos, no genéricos. La próxima decisión importante que tomes, los aplicás.
$ej4$, 4
FROM workshops WHERE slug = 'sistema-auto-proteccion-mental';

-- EJ 5
INSERT INTO exercises (workshop_id, title, objective, prompt_text, "order")
SELECT id, 'Tu Protocolo Matutino adaptado', 'Crear tu propio protocolo matutino que sí podés ejecutar.',
$ej5$
**Considerá antes de diseñar:**
- ¿A qué hora despertás?
- ¿Tenés hijos / pareja / responsabilidades inmediatas?
- ¿Qué de los 6 pasos universales es **viable** para vos?
- ¿Qué tenés que adaptar?

**Diseñá tu versión:**

```
MI PROTOCOLO MATUTINO

Paso 1 — Despertar suave (___ min):
   Qué hago específicamente:
   Qué evito:

Paso 2 — Nombrar emoción (1 min):
   La pregunta que me hago:
   Dónde la registro:

Paso 3 — Cuidado corporal (___ min):
   Mis 3 acciones (agua, movimiento, comida):

Paso 4 — Registro rápido (2 min):
   Lo registro en: (libreta / app / dónde)

Paso 5 — Pausa de decisiones (30 min):
   Cómo me protejo de tomar decisiones importantes:
   (modo avión del celular, no abrir mail, etc.)

Paso 6 — Transición al día:
   Qué pregunta me hago:
```

**También diseñá tu versión mínima** para días difíciles (las 3 cosas que sí o sí hacés).

**Criterio de hecho:** podés ejecutar tu protocolo mañana mismo. Si tu versión requiere 2 horas, no la vas a hacer. Mejor 15 minutos ejecutables que 60 ideales.
$ej5$, 5
FROM workshops WHERE slug = 'sistema-auto-proteccion-mental';

-- EJ 6
INSERT INTO exercises (workshop_id, title, objective, prompt_text, "order")
SELECT id, 'Tu Protocolo de Crisis', 'Preparar el plan para los días 🔴 antes de que lleguen.',
$ej6$
Completá esta plantilla:

```
MI PROTOCOLO DE CRISIS (🔴)

Cuando estoy acá, NO puedo:
1.
2.
3.

Cuando estoy acá, SÍ debo:
1.
2.
3.

Mi técnica de grounding rápido es:
(5-4-3-2-1, agua fría, caminar, otra)

Las 3 personas que puedo activar son:
1. ____________ — su rol en mi crisis es: ____________
2. ____________ — su rol en mi crisis es: ____________
3. ____________ — su rol en mi crisis es: ____________

Mi mensaje preescrito para enviarles:
"___________________________________"

Lugar físico donde me siento más segura en crisis:

Una frase ancla que voy a recordar:
"Esto también va a pasar. Mi sistema está hecho para esto."

Si los 🔴 son frecuentes (>2 al mes), mi siguiente paso es:
[ ] Buscar terapeuta
[ ] Volver con mi terapeuta
[ ] Revisar tratamiento médico actual
[ ] Hablar con persona de confianza específica
```

**Criterio de hecho:** tenés el protocolo escrito, las personas avisadas y el mensaje preescrito guardado en tu celular como borrador.
$ej6$, 6
FROM workshops WHERE slug = 'sistema-auto-proteccion-mental';

-- EJ 7
INSERT INTO exercises (workshop_id, title, objective, prompt_text, "order")
SELECT id, 'Conversación con tu círculo de confianza', 'Convertir personas cercanas en aliados informados.',
$ej7$
**Pasos:**

1. Elegí 2 a 4 personas (pueden ser amigos, pareja, familiares, terapeuta)
2. Agendá conversaciones de 30 minutos con cada una
3. Llevá la siguiente estructura:

```
"Estoy construyendo un sistema personal de gestión emocional.
No es por crisis, es por diseño. Quiero hacerte parte.

Mis 3 estados son: 🟢 estable, 🟡 atención, 🔴 protección.

Cuando te diga 'estoy en 🟡' necesito que:
[ej: me bajes la exigencia, no me pidas decisiones grandes]

Cuando te diga 'estoy en 🔴' necesito que:
[ej: me escuches sin solucionar, me acompañes en silencio,
me ayudes con tareas básicas]

Cuando estoy en 🟢, lo normal es:
[ej: cualquier conversación, decisiones, planes]

¿Tenés preguntas? ¿Hay algo de esto que te incomoda?"
```

4. Anotá la respuesta de cada persona

**Criterio de hecho:** tenés al menos 2 personas que ya tuvieron la conversación, entendieron, y están de acuerdo. Si alguien no entiende o se incomoda, NO es parte del círculo para esto — buscás otras.
$ej7$, 7
FROM workshops WHERE slug = 'sistema-auto-proteccion-mental';

-- EJ 8
INSERT INTO exercises (workshop_id, title, objective, prompt_text, "order")
SELECT id, 'Diseñá tu Registro Emocional', 'Tener la herramienta lista para empezar mañana.',
$ej8$
**Elegí formato:**
- [ ] Libreta física (recomendado para los primeros 30 días)
- [ ] Notion / Obsidian / app de notas
- [ ] Combinación (mínimo en papel, completo en digital)

**Diseñá la plantilla del nivel mínimo** (la que vas a empezar mañana):

```
FECHA:
ESTADO MAÑANA: 🟢 / 🟡 / 🔴
EMOCIÓN AL DESPERTAR:
HORAS DE SUEÑO:
```

**Y la plantilla del nivel medio** (para cuando el mínimo sea hábito, ~día 14):

```
FECHA:
ESTADO MAÑANA: 🟢 / 🟡 / 🔴
ESTADO CIERRE DÍA: 🟢 / 🟡 / 🔴
EMOCIÓN AL DESPERTAR:
HORAS DE SUEÑO:
DISPARADORES DEL DÍA:
DECISIÓN IMPORTANTE TOMADA HOY:
PROTOCOLOS ACTIVADOS: matutino / crisis / ninguno
```

**Criterio de hecho:** las plantillas están listas. Tenés la libreta o el archivo digital esperando para mañana.
$ej8$, 8
FROM workshops WHERE slug = 'sistema-auto-proteccion-mental';

-- EJ 9
INSERT INTO exercises (workshop_id, title, objective, prompt_text, "order")
SELECT id, 'Tu compromiso de 30 días', 'Convertir el sistema en hábito antes de que se enfríe.',
$ej9$
Llená esto y firmalo:

```
COMPROMISO DE 30 DÍAS

Yo, ____________, me comprometo a:

DURANTE LOS PRÓXIMOS 30 DÍAS:
- Registrar el estado matutino TODOS los días (nivel mínimo)
- Ejecutar mi Protocolo Matutino al menos 5 días a la semana
- No tomar decisiones importantes en 🟡 o 🔴
- Asistir a 4 check-ins grupales del taller
- Si entro en 🔴, activar mi Protocolo de Crisis

AL DÍA 30:
- Revisar mi Dashboard de Auditoría (mirar los 30 días)
- Identificar 3 patrones que descubrí sobre mí
- Ajustar el sistema según lo aprendido
- Decidir qué nivel de registro mantengo a futuro

Si fallo, no abandono. Vuelvo al día siguiente.
El objetivo no es ser perfecta. Es construir trazabilidad.

Firma: ____________
Fecha: ____________
```

**Criterio de hecho:** está firmado y guardado en lugar visible (heladera, pantalla del celular, libreta). Si no se ve, no se cumple.
$ej9$, 9
FROM workshops WHERE slug = 'sistema-auto-proteccion-mental';

-- EJ 10
INSERT INTO exercises (workshop_id, title, objective, prompt_text, "order")
SELECT id, 'Tu Dashboard de Auditoría — día 30', 'Mirar tus 30 días con perspectiva de investigador.',
$ej10$
*Este ejercicio se hace al cumplir 30 días de registro, durante el check-in grupal final.*

**Preguntas a responder con tu registro en la mano:**

1. ¿Cuántos días estuve en cada estado? (contá 🟢 🟡 🔴)
2. ¿Qué eventos disparan más mis 🟡 y 🔴?
3. ¿Cómo se correlaciona mi sueño con mi estado del día?
4. ¿Qué decisiones tomé y cómo resultaron? (revisar a 7d y 30d)
5. ¿Qué protocolos activé y cuáles funcionaron?
6. ¿Hay un patrón semanal? (¿los lunes son peor? ¿los viernes mejor?)
7. ¿Hay un patrón horario? (¿qué hora del día soy más vulnerable?)
8. ¿Qué dimensión del Motor de Detección se activó más?
9. ¿Qué del sistema funcionó? ¿Qué necesito ajustar?
10. ¿Qué descubrí sobre mí que no sabía antes?

**Criterio de hecho:** podés explicarle a alguien que no te conoce **tu propio patrón emocional** con datos. Si después de 30 días no podés, revisamos el sistema juntas.
$ej10$, 10
FROM workshops WHERE slug = 'sistema-auto-proteccion-mental';

-- ============================================================
-- 5) GLOSARIO (33 términos)
-- ============================================================
INSERT INTO glossary_terms (workshop_id, term, definition, category)
SELECT w.id, t.term, t.definition, t.category FROM workshops w,
(VALUES
  -- Estados
  ('Estado 🟢 Estable', 'Estado óptimo para decidir. Descansada, clara, sin conflicto activo.', 'estados'),
  ('Estado 🟡 Atención', 'Estado de cuidado. Solo decisiones pequeñas y reversibles.', 'estados'),
  ('Estado 🔴 Protección', 'Estado de crisis. Ninguna decisión importante. Solo proteger.', 'estados'),
  -- Neurobiología
  ('Amígdala', 'Estructura cerebral que funciona como sistema de alarma. Se activa antes que la corteza prefrontal.', 'neurobiologia'),
  ('Corteza prefrontal', 'Zona del cerebro responsable de razonamiento, decisiones, autorregulación. Necesita la amígdala calma para funcionar.', 'neurobiologia'),
  ('Sistema nervioso autónomo', 'Parte del sistema nervioso que controla funciones involuntarias. Refleja tu estado emocional.', 'neurobiologia'),
  ('Activación', 'Estado en que el sistema nervioso se enciende como respuesta a un estímulo percibido como amenaza.', 'neurobiologia'),
  ('Hipervigilancia', 'Estado crónico de alerta del sistema nervioso. Desgasta y dificulta la regulación.', 'neurobiologia'),
  -- Patrones a detectar
  ('Pensamiento dicotómico (splitting)', 'Ver en blanco y negro. Idealizar / devaluar. Todo o nada.', 'patrones'),
  ('Miedo al abandono', 'Patrón donde la posibilidad de perder un vínculo activa respuesta de supervivencia. Lleva a decir sí desde el miedo.', 'patrones'),
  ('Codependencia', 'Patrón de perderse a uno mismo para sostener un vínculo. *Lo que tú quieras* como respuesta habitual.', 'patrones'),
  ('Autoinvalidación', 'Patrón de negar o minimizar las propias emociones. *Estoy exagerando* como respuesta automática.', 'patrones'),
  ('Urgencia emocional vs real', 'Distinción crítica: la urgencia que viene del miedo NO es la misma que la urgencia que viene de los hechos.', 'patrones'),
  ('Disociación', 'Mecanismo de defensa donde la mente se desconecta de la realidad para sobrevivir un estímulo abrumador.', 'patrones'),
  ('Disparador (trigger)', 'Estímulo (persona, situación, pensamiento) que activa una reacción emocional desproporcionada.', 'patrones'),
  -- Herramientas del sistema
  ('Motor de Detección', 'Sistema de 8 dimensiones para identificar señales emocionales antes de reaccionar.', 'herramientas'),
  ('Semáforo Ético', 'Filtro de decisión: ¿está alineado con mis valores?', 'herramientas'),
  ('Semáforo Estratégico', 'Filtro de decisión: ¿encaja en el mapa grande de mi vida?', 'herramientas'),
  ('Semáforo Emocional', 'Filtro de decisión: ¿en qué estado estoy decidiendo esto?', 'herramientas'),
  ('Protocolo Matutino', 'Ritual de 6 pasos para que la primera media hora del día no esté en manos de la amígdala.', 'herramientas'),
  ('Protocolo de Crisis', 'Plan preestablecido para los días 🔴. Sin él, la crisis se gestiona desde la crisis misma.', 'herramientas'),
  ('Registro Emocional', 'Diario estructurado con campos mínimos. Base de datos sobre vos mismo.', 'herramientas'),
  ('Dashboard de Auditoría', 'Vista agregada de tus registros para ver patrones a lo largo del tiempo.', 'herramientas'),
  ('Círculo de confianza', '2 a 4 personas informadas sobre tu sistema, que saben qué pedir y qué dar en cada estado.', 'herramientas'),
  -- Técnicas
  ('Grounding', 'Técnica de regreso al presente vía sensaciones físicas. La más conocida: 5-4-3-2-1.', 'tecnicas'),
  ('5-4-3-2-1', 'Técnica de grounding: 5 cosas que ves, 4 que tocás, 3 que oís, 2 que olés, 1 que saboreás.', 'tecnicas'),
  ('Pausa de decisiones', 'Los 30 minutos post-despertar donde ninguna decisión importante se toma. La amígdala todavía manda.', 'tecnicas'),
  ('Decisión diferida', 'Postergar conscientemente una decisión cuando los semáforos están en rojo. Mínimo 24h, idealmente 7d.', 'tecnicas'),
  ('Validación emocional', 'Reconocer que una emoción existe y tiene razón de ser, sin necesariamente actuar sobre ella.', 'tecnicas'),
  -- Conceptos clave del sistema
  ('Trazabilidad', 'Capacidad de seguir un dato a lo largo del tiempo. La diferencia entre tener sistema y no tenerlo.', 'conceptos'),
  -- Ecosistema
  ('KAIA', 'Metodología propia de Jennifer Salazar Duke — aprendizaje inverso, primero el por qué.', 'ecosistema'),
  ('THT', 'Test de perfil cognitivo (Talent Hunter Test) — sistema de colores que mapea estilos de pensamiento.', 'ecosistema'),
  ('Salazar Duke Impact Hub', 'Emprendimiento social fundado por Jennifer Salazar Duke que capacita a personas con diagnósticos de salud mental en habilidades digitales.', 'ecosistema')
) AS t(term, definition, category)
WHERE w.slug = 'sistema-auto-proteccion-mental';

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
-- FROM workshops w WHERE slug = 'sistema-auto-proteccion-mental';
--
-- Esperado: 5 secciones · 16 slides · 10 ejercicios · 33 términos
