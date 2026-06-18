-- ============================================================
-- TALLER 03 — Del Sueño a la Convocatoria
-- ============================================================
-- Cómo usar este archivo:
-- Opción A (recomendada): abrir en TablePlus conectado a Supabase y correr todo de una.
-- Opción B: pegar entero en Supabase SQL Editor (web).
--
-- Es idempotente: el DELETE inicial limpia residuos de intentos previos.
-- Si todo va bien al final tenés: 1 workshop, 5 secciones (con 31 slides
-- de aprendizaje), 14 ejercicios y 47 términos de glosario.
-- ============================================================

-- 1) Cleanup defensivo
DELETE FROM workshops WHERE slug = 'del-sueno-a-la-convocatoria';

-- 2) Workshop
INSERT INTO workshops (
  slug, title, description, instructor,
  date_live, duration_min, prerequisites, status,
  whatsapp_message_template
) VALUES (
  'del-sueno-a-la-convocatoria',
  'Del Sueño a la Convocatoria: cómo nace un negocio con propósito',
  'Tu idea de negocio te da vueltas pero no sabés por dónde empezar. O ya emprendiste pero te quemás. O querés postular a una convocatoria y no sabés qué escribir. Todas son normales. Y todas parten del mismo error: mezclar etapas que tienen que ir en orden. En este taller te paso el método: 4 fases (porqué, terreno, modelo, validación), una caja de tecnología (TechBox) y un mapa de convocatorias activas en Colombia para que tu propuesta encuentre financiación.',
  'Jennifer Salazar Duque',
  NULL,
  600,
  'Obligatorios: tener una idea de negocio, un negocio en marcha o un proyecto social, una computadora con navegador moderno, email activo (preferentemente Gmail), celular con WhatsApp y 3 horas de tiempo concentrado por sesión (2 sesiones de 3h). Recomendados: tener identificado al menos un cliente potencial real, conocer al menos un Objetivo de Desarrollo Sostenible (ODS) que se conecte con tu propuesta, y unos 200.000 COP / 50 USD mensuales para herramientas (la mayoría tiene versión gratis para arrancar).',
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
  "title": "Bienvenida — del sueño a la convocatoria",
  "description": "Si llegaste hasta acá probablemente tenés una idea dándote vueltas hace meses, o ya emprendiste y sentís que algo no termina de cuadrar, o querés postular a una convocatoria y no sabés qué escribir. Todas esas situaciones son normales — y todas parten del mismo error: **mezclar etapas que tienen que ir en orden**.\n\nSoy Jennifer Salazar Duque. Hace más de seis años trabajo en estrategia digital, optimización operativa y traducción simultánea en entornos internacionales. Hoy lidero **Salazar Duke Impact Hub**, un emprendimiento social que capacita a personas con diagnósticos de salud mental en habilidades digitales para darles oportunidades laborales reales — mientras ofrecemos a otros emprendedores servicios de organización digital, automatización e internacionalización.\n\nEste taller te entrega un método replicable: **4 fases** (porqué, terreno, modelo, validación), una **TechBox** adaptada a vos, y un **mapa de convocatorias activas** en Colombia para que tu propuesta encuentre financiación.\n\n> El capital existe. El impacto también puede ser financiado. Solo hay que saber dónde buscar y cómo presentar lo que hacés.\n\nDuración: 6 horas en vivo (2 sesiones de 3h) + 4 horas de práctica autónoma.",
  "quick_links": [
    {"label": "Las 4 fases + TechBox", "target_section": "aprendizaje"},
    {"label": "Ejercicios prácticos", "target_section": "taller"},
    {"label": "Setup de herramientas", "target_section": "instalacion"},
    {"label": "Glosario", "target_section": "glosario"}
  ]
}
$inicio$::jsonb
FROM workshops WHERE slug = 'del-sueno-a-la-convocatoria';

-- APRENDIZAJE (31 slides: intro + 30 diapositivas)
INSERT INTO sections (workshop_id, type, section_order, content_json)
SELECT id, 'aprendizaje', 2,
$apr$
{
  "type": "aprendizaje",
  "title": "La ruta completa",
  "slides": [
    {"kicker": "Introducción", "title": "La ruta de 4 fases", "body": "```\n🎯 Fase 1        🔍 Fase 2          🏗️ Fase 3         🧪 Fase 4\nEl porqué    →   El terreno    →    El modelo    →   La validación\nlo haces         y la propuesta     estructurado     antes de escalar\n```\n\nDespués de las 4 fases:\n\n```\n⚡ TechBox    →   🚀 Convocatorias\nTu caja de        Mapa de\nherramientas      financiación\n```\n\n**Regla dura:** no podés saltarte ninguna fase. Si lo hacés, vas a tener un negocio sin propósito (Fase 1), sin clientes claros (Fase 2), sin sostenibilidad (Fase 3) o sin demanda real (Fase 4).", "notes": null},
    {"kicker": "Diapositiva 1 · Fase 1", "title": "Antes de cualquier idea, una pausa", "body": "> *Antes de construir una idea, diseñar una marca o pensar en monetizar, es vital que te conectes contigo mismo. Esta etapa es una invitación a pausar y preguntarte: ¿Por qué quiero emprender? ¿Qué historia, necesidad o deseo me impulsa?*\n\nAcá no buscamos respuestas perfectas ni modelos de negocio. Buscamos **una conexión honesta con tu esencia**.\n\nVamos a usar cuatro herramientas: **Ikigai · Golden Circle · GROW · Conexión historia-problema-solución**.", "notes": null},
    {"kicker": "Diapositiva 2 · Fase 1", "title": "Ikigai — propósito personal", "body": "Ikigai es una palabra japonesa que significa *razón de ser*. Es el cruce de cuatro preguntas:\n\n| Pregunta | Qué explora |\n|----------|-------------|\n| 💜 ¿Qué amás? | Lo que harías aunque no te pagaran |\n| 💙 ¿Qué necesita el mundo? | Los problemas reales que te duelen |\n| 💚 ¿En qué sos bueno/a? | Las habilidades que tenés naturales o desarrolladas |\n| 💛 ¿Por qué te pueden pagar? | Lo que el mercado valora económicamente |\n\n**Reflexioná y respondé:**\n- ¿Qué actividades disfrutás tanto que el tiempo se te pasa volando?\n- ¿Qué te dicen constantemente que hacés bien o que ayudás a otros a lograr?\n- ¿Qué problemas del mundo te duelen o te motivan a actuar?\n- ¿Qué habilidades tenés que podrían convertirse en una forma de servir o trabajar?\n\nEl punto donde las cuatro se cruzan **es tu Ikigai**.", "notes": null},
    {"kicker": "Diapositiva 3 · Fase 1", "title": "Las intersecciones también enseñan", "body": "Cuando solo tenés tres de las cuatro:\n\n- **Amás + Mundo necesita + Bueno** (sin te pagan) → **Misión sin sostenibilidad** (te quemás)\n- **Amás + Mundo necesita + Te pagan** (sin bueno) → **Pasión sin maestría** (te frustrás)\n- **Amás + Bueno + Te pagan** (sin mundo necesita) → **Profesión sin propósito** (te aburrís)\n- **Mundo necesita + Bueno + Te pagan** (sin amás) → **Vocación que no querés** (te resentís)\n\nSi te sentís quemado/a, frustrado/a, aburrido/a o resentido/a — **revisá cuál de las cuatro te falta**.", "notes": null},
    {"kicker": "Diapositiva 4 · Fase 1", "title": "Golden Circle de Simon Sinek", "body": "Simon Sinek descubrió que las marcas y líderes que generan transformación profunda **comunican al revés** que el resto.\n\n```\nLa mayoría:        QUÉ → CÓMO → POR QUÉ\nLos que impactan:  POR QUÉ → CÓMO → QUÉ\n```\n\nReflexioná desde lo más profundo hacia lo más concreto:\n- **Why (¿Por qué?):** ¿Qué te mueve emocionalmente a emprender o crear algo propio?\n- **How (¿Cómo?):** ¿Cómo querés hacer las cosas diferente? ¿Con qué valores o principios?\n- **What (¿Qué?):** ¿Qué ideas tenés en mente? Aunque no estén definidas, escribilas libremente.\n\n**La gente no compra el QUÉ. Compra el POR QUÉ.**", "notes": null},
    {"kicker": "Diapositiva 5 · Fase 1", "title": "GROW Model — proyección y autoevaluación", "body": "GROW es un modelo de coaching que te ayuda a ver dónde estás y proyectar hacia dónde vas.\n\n| Letra | Pregunta |\n|-------|----------|\n| **G** — Goal (Meta) | ¿Qué te gustaría lograr en tu vida en los próximos 3 años? |\n| **R** — Reality (Realidad) | ¿Dónde estás ahora en relación con esa meta? |\n| **O** — Options (Opciones) | ¿Qué caminos podrías tomar? ¿Qué te impide avanzar? |\n| **W** — Will (Voluntad) | ¿Qué estás dispuesto/a a hacer desde hoy para acercarte a ese sueño? |\n\n**Por qué GROW importa:** Ikigai te muestra el destino. Golden Circle te da el mensaje. GROW te da la **brújula del próximo paso concreto**.", "notes": null},
    {"kicker": "Diapositiva 6 · Fase 1", "title": "El problema nace de tu historia", "body": "> *Antes de formular una idea de negocio, es clave entender qué problema querés resolver y por qué ese problema te importa realmente.*\n\nMuchas veces, la raíz de lo que queremos transformar está en nuestras propias experiencias, heridas, frustraciones o vivencias personales.\n\nLa pregunta clave:\n> **¿Qué problema existe en el mundo que me duele porque yo también lo he vivido, sentido o enfrentado?**\n\nCuando conectás tu historia con una necesidad real, el problema que elegís resolver cobra:\n- **Más sentido** — sabés exactamente qué duele porque te dolió\n- **Más fuerza** — la energía no se agota porque viene de adentro\n- **Más compromiso** — no abandonás cuando se pone difícil\n\n**Mi ejemplo:** la pérdida de mi hermano Stiven me conectó con el dolor de las personas con diagnósticos de salud mental que el sistema laboral excluye. Por eso Salazar Duke Impact Hub capacita a esas personas en habilidades digitales — porque ese dolor lo viví desde adentro.", "notes": null},
    {"kicker": "Diapositiva 7 · Fase 1", "title": "La solución nace de ti", "body": "Después de reconocer lo que te mueve y el problema que te duele:\n\n> **¿Qué puedo ofrecer desde mi experiencia, habilidades o mirada única para aportar a esa realidad?**\n\nNo se trata aún de tener una empresa estructurada ni una idea pulida. Se trata de imaginar, desde tu autenticidad:\n- Qué **podrías crear**\n- Qué **podrías hacer**\n- Qué **podrías activar**\n\nPara empezar a resolver el problema que te importa.\n\n**No necesitás saberlo todo.** Solo atreverte a nombrar la forma en la que vos podrías empezar a cambiar las cosas con lo que tenés hoy.\n\nAcá sembrás **la semilla de tu propuesta de valor**.", "notes": null},
    {"kicker": "Diapositiva 8 · Fase 2", "title": "Mirar hacia afuera", "body": "Una vez que tenés claro tu por qué, el problema y una posible solución, **es momento de mirar hacia afuera**.\n\nEsta fase te prepara para tomar decisiones **informadas, estratégicas y realistas**. Vamos a investigar:\n\n- **Tu cliente** — quién es, cómo se comporta, qué necesita, cómo conectar con él\n- **El mercado** — tamaño, tendencias, comportamiento\n- **Tus competidores** — directos e indirectos\n- **Las regulaciones** que aplican a tu sector\n- **La tecnología** disponible o necesaria\n- **Los referentes** que te pueden inspirar o diferenciar", "notes": null},
    {"kicker": "Diapositiva 9 · Fase 2", "title": "El buyer persona", "body": "Un buyer persona es una **representación semi-ficcional de tu cliente ideal**, basada en datos reales.\n\nPor cada buyer persona, definí:\n\n| Campo | Ejemplo |\n|-------|---------|\n| **Nombre ficticio** | Camila, 32 años |\n| **Demografía** | Vive en Medellín, profesional independiente |\n| **Situación actual** | Emprendedora solitaria, factura 8M COP/mes |\n| **Dolor / problema** | No tiene tiempo para producir contenido en LinkedIn |\n| **Objetivo** | Visibilidad profesional sin perder horas |\n| **Objeciones** | Cree que la IA le va a sacar el alma a su voz |\n| **Dónde está** | LinkedIn, Instagram, grupos de WhatsApp de emprendedoras |\n| **Cómo decide** | Compra cuando otra emprendedora cercana le recomienda |\n| **Frase típica** | *Quiero crecer sin volverme una influencer falsa* |\n\n**Regla:** mínimo 2 buyer personas. Máximo 4. Si tenés 7, todavía no elegiste.", "notes": null},
    {"kicker": "Diapositiva 10 · Fase 2", "title": "Investigación de mercado con IA", "body": "Antes la investigación tomaba semanas. Hoy con IA toma horas — si sabés preguntar.\n\nHerramientas clave:\n- **Perplexity** para datos con fuentes reales\n- **ChatGPT/Claude** para estructurar análisis\n- **Google Trends** para validar interés temporal\n- **Notion AI** para organizar hallazgos\n\n**Ejemplo de prompt para Perplexity:**\n\n```\nSoy emprendedora de [sector] en Colombia.\nInvestigá:\n1. Tamaño del mercado en Colombia 2026\n2. 5 competidores directos con su propuesta y precio\n3. 3 competidores indirectos (sustitutos)\n4. Tendencias del consumidor en los últimos 12 meses\n5. Regulaciones aplicables (DIAN, INVIMA, lo que corresponda)\n6. Tecnologías que están adoptando los líderes del sector\nPor cada punto, citá fuentes reales y actualizadas.\n```", "notes": null},
    {"kicker": "Diapositiva 11 · Fase 2", "title": "Propuesta de valor — más que un producto", "body": "> *El valor no solo está en lo que entregás, sino en cómo lo entregás.*\n\nTu propuesta de valor incluye:\n\n| Dimensión | Qué define |\n|-----------|------------|\n| **Producto / servicio** | Lo que el cliente recibe |\n| **Cómo lo entregás** | Procesos, experiencia, vínculo |\n| **Tecnología** | Qué herramientas amplifican tu valor |\n| **Impacto** | Qué transformación generás en el cliente y en el entorno |\n| **Diferenciación** | Por qué te eligen a vos y no a otros |", "notes": null},
    {"kicker": "Diapositiva 12 · Fase 2", "title": "Alineación con los ODS", "body": "Los **Objetivos de Desarrollo Sostenible (ODS)** son 17 metas globales de la ONU para 2030. Tu emprendimiento puede contribuir a uno o varios — y eso no es decoración, es estrategia.\n\n**Por qué importa alinearte con ODS:**\n- Las convocatorias públicas y privadas priorizan proyectos con impacto medible\n- Los clientes corporativos buscan proveedores alineados con sus reportes ESG\n- Te da un marco para medir tu impacto más allá de la facturación\n\n**Los ODS más relevantes para emprendimientos de impacto en Colombia:**\n\n| ODS | Tema |\n|-----|------|\n| 3 | Salud y bienestar |\n| 4 | Educación de calidad |\n| 5 | Igualdad de género |\n| 8 | Trabajo decente y crecimiento económico |\n| 9 | Industria, innovación e infraestructura |\n| 10 | Reducción de desigualdades |\n| 12 | Producción y consumo responsables |\n| 17 | Alianzas para lograr los objetivos |\n\n**Mi caso:** Salazar Duke Impact Hub se alinea con el ODS 3 (salud mental), ODS 8 (empleo digno para excluidos) y ODS 10 (reducción de desigualdades).", "notes": null},
    {"kicker": "Diapositiva 13 · Fase 2", "title": "Construir una propuesta con propósito", "body": "Tu propuesta de valor escrita debería poder responder estas 5 preguntas:\n\n1. **¿Para quién?** (segmento específico)\n2. **¿Qué problema le resolvés?** (con palabras del cliente, no las tuyas)\n3. **¿Cómo lo resolvés?** (tu método)\n4. **¿Por qué a vos?** (diferencial)\n5. **¿Qué transformación genera?** (impacto en cliente + ODS)\n\nSi no podés responder las 5 con claridad, **todavía no la tenés**.", "notes": null},
    {"kicker": "Diapositiva 14 · Fase 3", "title": "Business Model Canvas", "body": "> *Una idea con propósito también necesita estructura para convertirse en un proyecto real y sostenible.*\n\nEl Business Model Canvas es un mapa de **una sola página con 9 bloques** que describe cualquier negocio. Lo creó Alexander Osterwalder.", "notes": null},
    {"kicker": "Diapositiva 15 · Fase 3", "title": "Los 9 bloques", "body": "| Bloque | Pregunta que responde |\n|--------|----------------------|\n| 💎 Propuesta de valor | ¿Qué problema resolvés y por qué importa? |\n| 👥 Segmento de clientes | ¿A quién se lo resolvés? |\n| 🚀 Canales | ¿Cómo llega tu propuesta al cliente? |\n| 💬 Relación con clientes | ¿Cómo te vinculás con ellos? |\n| 💰 Fuentes de ingresos | ¿De dónde sale la plata? |\n| 🔧 Recursos clave | ¿Qué necesitás tener? (gente, dinero, tecnología) |\n| ⚡ Actividades clave | ¿Qué hacés todos los días? |\n| 🤝 Socios clave | ¿Quién te apoya o complementa? |\n| 💸 Estructura de costos | ¿En qué se va la plata? |", "notes": null},
    {"kicker": "Diapositiva 16 · Fase 3", "title": "Reglas duras del Canvas", "body": "1. **Especificidad obligatoria.** Si decís *mis clientes son emprendedores* — mal. *Mujeres emprendedoras de servicios profesionales en Medellín, 28-45 años, facturan menos de 20M COP/mes* — bien.\n\n2. **Cada bloque debe dialogar con la propuesta de valor.** Si un canal o socio no se conecta con cómo entregás valor, revisalo.\n\n3. **El Canvas evoluciona.** El primero está mal. El tercero está cerca. El décimo empieza a ser útil.\n\n4. **Validá cada bloque con clientes reales.** Las hipótesis del Canvas se prueban en la Fase 4.", "notes": null},
    {"kicker": "Diapositiva 17 · Fase 3", "title": "Mi Canvas como ejemplo (Salazar Duke Impact Hub)", "body": "| Bloque | Mi respuesta |\n|--------|--------------|\n| 💎 Propuesta de valor | Capacitación digital para personas con diagnósticos de salud mental + servicios de organización digital, automatización e internacionalización para emprendedores |\n| 👥 Segmento | (1) Personas con diagnósticos de salud mental que buscan trabajo digital · (2) Emprendedores que necesitan optimización operativa |\n| 🚀 Canales | LinkedIn, talleres, alianzas institucionales, referidos |\n| 💬 Relación | Mentoría directa, comunidad SEWHO, talleres presenciales |\n| 💰 Ingresos | Consultoría a empresas, formación corporativa, productos digitales, convocatorias públicas |\n| 🔧 Recursos | Metodología propia, sistemas IA, expertise legal-tech, marca personal, traducción simultánea |\n| ⚡ Actividades | Consultoría, formación, diseño de sistemas, postulación a convocatorias |\n| 🤝 Socios | SENA, iNNpulsa, Secretaría de Juventudes, Trazzos Labs, IXL Center |\n| 💸 Costos | Mi tiempo, herramientas IA, infraestructura digital, formación continua |", "notes": null},
    {"kicker": "Diapositiva 18 · Fase 4", "title": "Por qué validar", "body": "> *Una idea puede sonar increíble en el papel, pero es en el contacto con la realidad donde se demuestra su verdadero potencial.*\n\nValidar significa **probar tus supuestos antes de invertir grande**. La mayoría de los emprendedores fracasan no porque su idea era mala — sino porque **escalaron una hipótesis sin probarla**.\n\n**Validar no es demostrar que tenés razón.** Es aprender lo suficiente para **mejorar, ajustar o incluso rediseñar** tu idea con base en datos reales y no suposiciones.", "notes": null},
    {"kicker": "Diapositiva 19 · Fase 4", "title": "Cuatro herramientas de validación", "body": "| Herramienta | Para qué |\n|-------------|----------|\n| **Entrevistas** | Profundidad — entender el dolor real |\n| **Encuestas** | Volumen — cuantificar hipótesis |\n| **Observación** | Comportamiento real — qué hace el cliente, no qué dice |\n| **MVP (Producto Mínimo Viable)** | Validar con producto/servicio real chico antes de construir el grande |", "notes": null},
    {"kicker": "Diapositiva 20 · Fase 4", "title": "Cómo hacer entrevistas que sirvan", "body": "Las entrevistas que sirven no son encuestas grabadas. Son conversaciones sobre **el pasado**, no sobre el futuro hipotético.\n\n**Mal:** *¿Comprarías un producto que te ayude a organizar tus gastos?* (te van a decir que sí por cortesía)\n\n**Bien:** *Contame la última vez que intentaste organizar tus gastos. ¿Qué pasó? ¿Qué usaste? ¿Por qué dejaste de usarlo?*\n\n**Estructura recomendada (Mom Test):**\n1. Hablá de **su vida**, no de tu idea\n2. Preguntá sobre **lo específico del pasado**, no sobre **lo genérico del futuro**\n3. Hablá **menos** y escuchá **más**", "notes": null},
    {"kicker": "Diapositiva 21 · Fase 4", "title": "Diseñar un MVP", "body": "Un MVP es la versión **más pequeña posible** de tu producto/servicio que aún resuelve el problema del cliente.\n\n**Tipos de MVP por etapa:**\n\n| Tipo | Cuándo usarlo |\n|------|---------------|\n| **Landing page** | Validar si hay interés antes de construir nada |\n| **Concierge** | Vos hacés a mano lo que después será automatizado |\n| **Mago de Oz** | Parece automático pero detrás hay humano |\n| **Producto piloto** | Versión funcional limitada con 5-10 clientes reales |\n\n**Regla:** tu primer MVP no es tu primer producto vendible. Es tu **primer aprendizaje validado**.", "notes": null},
    {"kicker": "Diapositiva 22 · Fase 4", "title": "El criterio de validado", "body": "Tu hipótesis está validada cuando:\n\n- ✅ Al menos 10 clientes potenciales confirmaron el dolor (entrevistas)\n- ✅ Al menos 3 pagaron por una versión inicial (no por amistad, por valor real)\n- ✅ Repiten o recomiendan (señal de demanda real, no curiosidad)\n\nSi no tenés esos tres, **seguís en hipótesis** — no escalés.", "notes": null},
    {"kicker": "Diapositiva 23 · TechBox", "title": "El principio del TechBox", "body": "> *La clave no está en usarlo todo, sino en saber elegir.*\n\nCada emprendedor debería construir su propia TechBox adaptada a:\n- Su modelo de negocio\n- Su etapa (idea / validación / escala)\n- Sus objetivos del trimestre\n\n**Tu TechBox es el motor silencioso que puede llevar tu emprendimiento al siguiente nivel.**", "notes": null},
    {"kicker": "Diapositiva 24 · TechBox", "title": "5 categorías de TechBox", "body": "| Categoría | Para qué |\n|-----------|----------|\n| 🧩 Organización y gestión de proyectos | Mantener orden y trazabilidad |\n| 🧠 Automatización y productividad | Que el sistema trabaje por vos |\n| 🎨 Diseño y contenido visual | Comunicar profesional sin diseñador |\n| 🤖 Inteligencia artificial | Amplificar pensamiento y ejecución |\n| 📈 Análisis, ventas y marketing | Medir y vender |", "notes": null},
    {"kicker": "Diapositiva 25 · TechBox", "title": "Catálogo de herramientas recomendadas", "body": "**🧩 Organización y gestión de proyectos**\n- **Notion** — organización integral, bases de datos, calendarios\n- **Trello / ClickUp** — gestión de tareas, equipos y flujos de trabajo\n- **Google Workspace** — documentos, hojas de cálculo, almacenamiento\n\n**🧠 Automatización y productividad**\n- **Make (Integromat)** — automatización entre apps\n- **Zapier** — automatización sin código para conectar herramientas\n- **Calendly / Cal.com** — agendamiento automático de reuniones\n\n**🎨 Diseño y contenido visual**\n- **Canva (con IA)** — creación de contenido gráfico, videos y presentaciones\n- **CapCut** — edición rápida de videos para redes sociales\n- **Remove.bg / Magic Studio** — eliminación de fondos y edición básica\n\n**🤖 Inteligencia artificial**\n- **ChatGPT / Claude** — asistentes para redacción, estrategia, análisis\n- **Gemini** — IA de Google para análisis y búsqueda avanzada\n- **Gamma** — creador de presentaciones con IA\n- **Claude + HTML** — presentaciones 100% personalizadas con tu identidad\n- **Perplexity** — investigación con fuentes reales y citadas\n- **Looka / Brandmark** — generadores de logotipos con IA\n\n**📈 Análisis, ventas y marketing**\n- **Metricool** — programación y análisis de redes sociales\n- **MailerLite / Mailchimp** — email marketing\n- **Google Analytics** — análisis del tráfico web\n- **Linktree / Beacons** — centralización de links en redes\n- **ManyChat** — automatización de conversaciones", "notes": null},
    {"kicker": "Diapositiva 26 · TechBox", "title": "Regla del TechBox", "body": "> *Tu TechBox debe adaptarse a lo que necesitás hoy, sin saturarte.*\n\nElegí solo las herramientas que realmente te ayudan a:\n- **Ahorrar tiempo**\n- **Escalar lo que ya funciona**\n- **Mejorar la experiencia del cliente**\n\n**Una herramienta dominada vale más que diez probadas.**", "notes": null},
    {"kicker": "Diapositiva 27 · Convocatorias", "title": "El capital existe — solo hay que saber dónde buscar", "body": "Una parte clave del crecimiento es saber **dónde están las oportunidades**. En Colombia hay decenas de programas activos que financian emprendimientos con propósito.\n\n**Lo que estos programas buscan financiar es exactamente lo que construiste en las 4 fases anteriores.**", "notes": null},
    {"kicker": "Diapositiva 28 · Convocatorias", "title": "Convocatorias activas (Colombia 2026)", "body": "| Programa | Entidad | Qué ofrece |\n|----------|---------|------------|\n| **Fondo Emprender SENA** | SENA | Capital semilla hasta 180 SMLMV |\n| **Capital Semilla Medellín** | Créame · Alcaldía | Capital semilla para emprendedores antioqueños |\n| **Social Skin** | Privado | Capital para emprendimientos de impacto social |\n| **Nestlé Desafío de Creadores** | Nestlé | Reto para jóvenes emprendedores |\n| **Social Hackathon Medellín** | Y4PT | Hackathon de innovación social |\n| **iNNpulsa Colombia** | Gobierno | Convocatorias de emprendimiento de alto impacto |\n| **Apps.co · MinTIC** | Gobierno | Formación + capital para emprendimiento digital |\n\nLinks: [sena.edu.co/fondo-emprender](https://www.sena.edu.co/es-co/trabajo/Paginas/fondo-emprender.aspx), [creame.com.co/capital-semilla](https://www.creame.com.co/capital-semilla), [socialskin.com](https://www.socialskin.com/), [nestleyouthentrepreneurship.com](https://www.nestleyouthentrepreneurship.com/events/desafio-de-creadores), [y4pt.org/medellin](https://y4pt.org/medellin/), [innpulsacolombia.com](https://innpulsacolombia.com), [apps.co](https://apps.co)", "notes": null},
    {"kicker": "Diapositiva 29 · Convocatorias", "title": "Cómo elegir a cuál postular", "body": "Antes de postular, validá estos 4 criterios:\n\n1. **Encaje:** ¿tu propuesta calza con los criterios del fondo?\n2. **Etapa:** ¿el fondo es para tu etapa (idea / validación / crecimiento)?\n3. **Tiempo:** ¿tenés 4-8 semanas para preparar postulación seria?\n4. **Contrapartida:** ¿podés cumplir los compromisos que pide?\n\n**Postular a un fondo donde no encajás es perder tiempo.** Es mejor postularse bien a 2 que mal a 10.", "notes": null},
    {"kicker": "Diapositiva 30 · Cierre", "title": "Las 5 ideas para llevarte", "body": "1. **El orden importa.** Saltarte una fase no te ahorra tiempo — te lo cuesta multiplicado más adelante.\n2. **Tu historia es tu ventaja.** El problema que más auténticamente podés resolver es el que vos viviste.\n3. **Validá antes de escalar.** Una hipótesis no es un negocio. Probala con clientes reales.\n4. **La tecnología amplifica, no reemplaza.** TechBox bien elegido = sistema que opera. TechBox saturado = caos amplificado.\n5. **El capital existe.** Si tenés tu modelo claro y validado, hay fondos para impulsarlo.\n\n> *La IA no reemplaza tu propósito — lo amplifica. Pero solo si ya existe.*", "notes": null}
  ]
}
$apr$::jsonb
FROM workshops WHERE slug = 'del-sueno-a-la-convocatoria';

-- TALLER
INSERT INTO sections (workshop_id, type, section_order, content_json)
SELECT id, 'taller', 3,
$taller$
{
  "type": "taller",
  "title": "Manos a la obra",
  "instructions": "Tenés **13 ejercicios + 1 bonus**. **Todos se hacen en PC con IA como sparring partner** — primero generás vos el borrador, después la IA te confronta con preguntas. Los ejercicios 1-4 son de Fase 1 (porqué). Los 5-7 de Fase 2 (terreno). El 8 es Fase 3 (Canvas). El 9 es Fase 4 (validación). El 10 es tu TechBox. El 11 es tu pitch. El 12 es tu deck. El 13 es tu mapa de convocatorias. El bonus es tu plan de 90 días. **Hacelos en orden**.",
  "placeholder": "Si no ves los ejercicios todavía, recargá la página."
}
$taller$::jsonb
FROM workshops WHERE slug = 'del-sueno-a-la-convocatoria';

-- INSTALACIÓN
INSERT INTO sections (workshop_id, type, section_order, content_json)
SELECT id, 'instalacion', 4,
$inst$
{
  "type": "instalacion",
  "title": "Setup de tu espacio de trabajo y herramientas",
  "steps": [
    {"order": 1, "title": "Carpeta de trabajo del taller", "description": "Antes de las herramientas, **organizá tu espacio**. En Google Drive o Notion creá una carpeta llamada **Mi Negocio con Propósito**. Adentro creá 6 subcarpetas: `Fase 1 - Porqué`, `Fase 2 - Mercado`, `Fase 3 - Modelo`, `Fase 4 - Validación`, `TechBox`, `Convocatorias`. Todo tu trabajo del taller va a vivir ahí.", "code": "Mi Negocio con Propósito/\n  Fase 1 - Porqué/\n  Fase 2 - Mercado/\n  Fase 3 - Modelo/\n  Fase 4 - Validación/\n  TechBox/\n  Convocatorias/", "language": "bash"},
    {"order": 2, "title": "Cuenta de Google profesional", "description": "Si todavía no tenés Gmail con email profesional, andá a accounts.google.com/signup y creá una cuenta con un email **profesional** (no chiquitalinda1992@gmail.com — algo serio). Activá la **verificación en 2 pasos**.", "code": "https://accounts.google.com/signup", "language": "bash"},
    {"order": 3, "title": "Herramientas de organización (Notion + Calendly)", "description": "**Notion** (gratis suficiente para arrancar): notion.so → Sign up con Google. Importá la plantilla del taller que te paso en la sesión en vivo.\n\n**Calendly** (o Cal.com): calendly.com → Sign up con Google. Configurá tipos de evento de 30 y 60 min. Conectalo con Google Calendar.", "code": "https://notion.so\nhttps://calendly.com", "language": "bash"},
    {"order": 4, "title": "Herramientas de IA (ChatGPT + Claude + Perplexity)", "description": "**Recomendación:** arrancá los 3 en gratis. Pagá el que más uses después de 2 semanas.\n\n- **ChatGPT** (chatgpt.com): gratis · Plus 20 USD/mes ilimitado + modelos avanzados\n- **Claude** (claude.ai): gratis · Pro 20 USD/mes uso 5x mayor + Claude Opus\n- **Perplexity** (perplexity.ai): gratis 5 búsquedas Pro/día · Pro 20 USD/mes ilimitadas", "code": "https://chatgpt.com\nhttps://claude.ai\nhttps://perplexity.ai", "language": "bash"},
    {"order": 5, "title": "Diseño y contenido (Canva + Gamma + CapCut)", "description": "- **Canva** (canva.com): gratis con funciones IA limitadas · **Canva Pro 55.000 COP/mes — la mejor inversión de la lista** (Magic Studio completo, brand kit, fondo transparente)\n- **Gamma** (gamma.app): gratis 400 créditos · Plus 10 USD/mes ilimitado (presentaciones con IA)\n- **CapCut** (capcut.com): gratis funciones esenciales · Pro 8 USD/mes efectos premium", "code": "https://canva.com\nhttps://gamma.app\nhttps://capcut.com", "language": "bash"},
    {"order": 6, "title": "Automatización (Make + ManyChat)", "description": "- **Make** (make.com): gratis 1.000 operaciones/mes · Core 9 USD/mes 10.000 ops + integraciones avanzadas\n- **ManyChat** (manychat.com): conectá WhatsApp Business o Instagram. Gratis hasta 1.000 contactos · Pro desde 15 USD/mes con WhatsApp Business API", "code": "https://make.com\nhttps://manychat.com", "language": "bash"},
    {"order": 7, "title": "Análisis y marketing (Metricool + MailerLite)", "description": "- **Metricool** (metricool.com): conectá tus redes sociales. Gratis con 1 marca + métricas básicas · Pro desde 19 USD/mes con múltiples marcas\n- **MailerLite** (mailerlite.com): gratis hasta 1.000 suscriptores + 12.000 emails/mes · Pago desde 10 USD/mes según volumen", "code": "https://metricool.com\nhttps://mailerlite.com", "language": "bash"},
    {"order": 8, "title": "Inversión escalonada recomendada", "description": "**Mes 1 (13 USD):** Solo Canva Pro.\n**Mes 2 (+20 USD):** Agregá ChatGPT Plus o Claude Pro.\n**Mes 3 (+9 USD):** Agregá Make Core si necesitás automatizar.\n**Mes 4 en adelante:** sumá ManyChat, Perplexity Pro o Gamma según el problema que necesites resolver.\n\n**Inversión recomendada para arrancar bien:** ~42 USD/mes (~170.000 COP).", "code": "Mes 1: Canva Pro                  → 13 USD\nMes 2: + ChatGPT Plus o Claude Pro → 33 USD\nMes 3: + Make Core                 → 42 USD", "language": "bash"},
    {"order": 9, "title": "Gestor de contraseñas (Bitwarden)", "description": "Con tantas cuentas, no podés depender de la memoria. Instalá **Bitwarden** (bitwarden.com — gratis y excelente). Activá la verificación en 2 pasos en todas las herramientas críticas. Guardá ahí TODAS las contraseñas del negocio.", "code": "https://bitwarden.com", "language": "bash"}
  ],
  "success_message": "¡Listo! Verificá: carpeta Mi Negocio con Propósito creada con 6 subcarpetas · email profesional con verificación en 2 pasos · cuentas creadas en 4 herramientas IA · Calendly conectado · Make o Zapier listo · Bitwarden instalado."
}
$inst$::jsonb
FROM workshops WHERE slug = 'del-sueno-a-la-convocatoria';

-- GLOSARIO
INSERT INTO sections (workshop_id, type, section_order, content_json)
SELECT id, 'glosario', 5,
$glo$
{"type": "glosario", "title": "Glosario del taller", "search_placeholder": "Buscá un término (ej: Ikigai, MVP, ODS, CAC)..."}
$glo$::jsonb
FROM workshops WHERE slug = 'del-sueno-a-la-convocatoria';

-- ============================================================
-- 4) EJERCICIOS (14)
-- ============================================================

-- EJ 1
INSERT INTO exercises (workshop_id, title, objective, prompt_text, "order")
SELECT id, 'Tu Ikigai con IA como espejo', 'Mapear las cuatro preguntas que se cruzan en tu razón de ser.',
$ej1$
**Setup**: abrí Notion (o Google Doc) + ChatGPT/Claude en otra pestaña. La IA NO te da las respuestas — te confronta con preguntas.

**Pasos**:

1. En tu doc creá 4 secciones: *Lo que amo · Lo que el mundo necesita · En lo que soy bueno/a · Por lo que me pagan*.

2. Llenalas vos primero, en silencio, 8 minutos por cuadrante. **Sin abrir la IA todavía.**

3. Cuando termines, pegale a la IA este prompt:

```
Actúa como un coach socrático. Te paso 4 listas que armé sobre mi Ikigai
(lo que amo, lo que el mundo necesita, en lo que soy bueno/a, por lo que me pagan).

Tu trabajo NO es darme respuestas ni completar mi lista. Tu trabajo es:
1. Detectar patrones cruzados que yo no esté viendo
2. Hacerme 3-5 preguntas incómodas que me obliguen a profundizar
3. Señalarme si alguna respuesta suena genérica o de manual
4. Identificar contradicciones entre cuadrantes

Acá van mis 4 listas:
[pegá tu doc]
```

4. Respondé las preguntas de la IA en el mismo doc. Profundizá.

5. Subrayá lo que aparece en al menos 3 cuadrantes — **esa es la frase semilla de tu Ikigai**.

**Criterio de hecho**: tenés una frase que cruza al menos 3 cuadrantes, la dijiste en voz alta, y te emociona o te incomoda.
$ej1$, 1
FROM workshops WHERE slug = 'del-sueno-a-la-convocatoria';

-- EJ 2
INSERT INTO exercises (workshop_id, title, objective, prompt_text, "order")
SELECT id, 'Tu Golden Circle con IA como editor', 'Articular tu por qué, cómo y qué — sin palabras vacías.',
$ej2$
**Setup**: doc en Notion + ChatGPT/Claude.

**Paso 1 — borrador crudo**: completá vos primero en el doc:

1. POR QUÉ: "Creo que ____________. Por eso existe lo que hago."
2. CÓMO: "Lo hago a través de ____________ y ____________."
3. QUÉ: "En concreto, ofrezco ____________."

**Paso 2 — IA como editor editorial sin piedad**. Pegale:

```
Actúa como editor editorial de marca con 20 años de experiencia trabajando en pitch decks
de empresas que pasaron por Y Combinator.

Te paso mi Golden Circle (POR QUÉ / CÓMO / QUÉ). Tu trabajo NO es escribirlo por mí. Tu trabajo es:

1. Marcar si mi POR QUÉ suena a frase de Instagram o a convicción real
2. Detectar palabras vacías (transformar, empoderar, revolucionar) y proponer reemplazos
3. Decirme si mi CÓMO realmente diferencia o lo podría decir cualquiera del sector
4. Verificar que mi QUÉ sea verificable y no abstracto
5. Devolverme 2 versiones reescritas: una conservadora y una arriesgada

NO me felicites. Sé brutalmente directo.

Acá va mi Golden Circle:
[pegá tus 3 frases]
```

**Paso 3**: probá leer la versión final en voz alta a 3 personas distintas. Si las 3 entienden de qué se trata tu negocio sin pedir aclaraciones — listo.

**Criterio de hecho**: podés decir las 3 frases en voz alta sin trabarte Y las 3 personas test entienden tu negocio en menos de 10 segundos.
$ej2$, 2
FROM workshops WHERE slug = 'del-sueno-a-la-convocatoria';

-- EJ 3
INSERT INTO exercises (workshop_id, title, objective, prompt_text, "order")
SELECT id, 'Tu plan GROW con IA como challenger', 'Convertir tu visión en próximo paso concreto.',
$ej3$
**Setup**: doc en Notion o Google Docs + ChatGPT/Claude.

**Pasos**:

1. Completá vos primero las 4 letras en el doc:
   - **G** — Goal: Mi meta a 3 años es __________
   - **R** — Reality: Hoy estoy en __________
   - **O** — Options: Los caminos que veo son 1. __ 2. __ 3. __
   - **W** — Will: Esta semana voy a __________

2. Pegale a la IA este prompt:

```
Actúa como un coach de negocios duro pero justo. Te paso mi GROW.

Tu trabajo:
1. Decime si mi Goal es SMART — si no, devolvélo con preguntas
2. Decime si mi Reality es honesto o si estoy edulcorando
3. Decime si las Options son reales y diversas o si son la misma opción disfrazada
4. Decime si el Will es ejecutable esta semana — si dice "investigar más", devolvélo

NO me felicites. Tu trabajo es desafiar.

Acá va mi GROW:
[pegá tu doc]
```

3. Reescribí el W (Will) en base al desafío de la IA. Tiene que poder ejecutarse esta semana.

**Criterio de hecho**: el ítem W tiene fecha, métrica y acción concreta. "Entrevistar a 3 clientes potenciales el viernes 20" — sirve. "Investigar más" — no sirve.
$ej3$, 3
FROM workshops WHERE slug = 'del-sueno-a-la-convocatoria';

-- EJ 4
INSERT INTO exercises (workshop_id, title, objective, prompt_text, "order")
SELECT id, 'Tu historia → problema → solución con IA como traductor', 'Conectar tu vivencia con el problema que querés resolver.',
$ej4$
**Setup**: doc en Notion + ChatGPT/Claude.

**Pasos**:

1. Escribí vos primero las 5 respuestas en tu doc. SIN editar, sin filtrar:
   1. Una experiencia mía que me marcó: __________
   2. El dolor / problema que esa experiencia me hizo ver: __________
   3. Cuánta gente más sufre eso hoy: __________
   4. Qué tengo yo (habilidad / mirada / red) que podría aportar a resolverlo: __________
   5. Cómo podría empezar a hacerlo con lo que tengo hoy: __________

2. Ahora pegale a la IA:

```
Actúa como un investigador que conecta historia personal con problemas de mercado.
Te paso mis 5 respuestas.

Tu trabajo:
1. Detectar si mi historia y el problema realmente se conectan o si estoy forzando la conexión
2. Ayudarme a CUANTIFICAR cuánta gente sufre eso (datos, estadísticas, fuentes — citá fuentes)
3. Validar si lo que digo que tengo es realmente único o si lo tiene cualquiera del sector
4. Desafiar el paso de inicio: ¿es realmente algo que puedo hacer esta semana sin pedir permiso a nadie?

Devolveme análisis crítico, no validación.

Acá van mis respuestas:
[pegá tu doc]
```

3. Tomá la respuesta de la IA y reescribí tu historia conectada al problema en **una sola frase de 2 líneas**.

**Criterio de hecho**: tu frase final emociona a quien la lee Y tiene un dato cuantitativo. Si emociona pero no tiene número → falta rigor. Si tiene número pero no emociona → falta corazón.
$ej4$, 4
FROM workshops WHERE slug = 'del-sueno-a-la-convocatoria';

-- EJ 5
INSERT INTO exercises (workshop_id, title, objective, prompt_text, "order")
SELECT id, 'Tus 2 buyer personas con IA como investigador', 'Definir a quién le hablás cuando hablás — con datos reales.',
$ej5$
**Setup**: Notion (tabla con 9 columnas) + ChatGPT/Claude + Perplexity.

**Paso 1**: completá vos 2 buyer personas en la tabla. SIN preguntarle a la IA todavía. Datos: nombre ficticio + edad · demografía · situación actual · dolor principal · objetivo · objeciones · canales · cómo decide comprar · frase típica.

**Paso 2 — IA como investigador de mercado**. Por cada buyer persona, pegale:

```
Actúa como investigador de mercado especializado en [tu sector] en [tu país].

Te paso mi buyer persona "Camila, 32, emprendedora en Medellín". Tu trabajo NO es validarla.

1. Decirme si esta persona EXISTE estadísticamente — datos de cuántas hay
2. Encontrar 3 fricciones REALES que sufre y que yo no mencioné (Reddit, comunidades, reseñas)
3. Encontrar 3 frases TEXTUALES que esa persona diría (no inventes, citá fuentes)
4. Decirme si mis canales son donde realmente está o donde yo asumo
5. Identificar el momento del año / día / vida en que está más dispuesta a comprar

Citá fuentes verificables.

Acá va mi buyer persona:
[pegá la ficha]
```

**Paso 3**: reescribí cada buyer persona con los hallazgos. Las frases típicas tienen que ser CITAS reales o muy cercanas.

**Criterio de hecho**: por cada buyer persona tenés mínimo 3 frases textuales con fuente y un dato de tamaño de mercado.
$ej5$, 5
FROM workshops WHERE slug = 'del-sueno-a-la-convocatoria';

-- EJ 6
INSERT INTO exercises (workshop_id, title, objective, prompt_text, "order")
SELECT id, 'Investigación de mercado con Perplexity', 'Entender tu terreno con datos reales.',
$ej6$
Prompt para Perplexity (ajustado a tu sector):

"Soy emprendedor/a de [sector] en Colombia. Mi propuesta es [resumen en 1 línea]. Mis clientes son [buyer persona 1 en 1 línea]. Investigá y dame:

1. Tamaño y crecimiento del mercado en Colombia (último año)
2. 5 competidores directos: nombre, propuesta, rango de precios
3. 3 competidores indirectos / sustitutos
4. Tendencias del consumidor en los últimos 12 meses
5. Regulaciones aplicables (DIAN, INVIMA, sector específico)
6. Tecnologías que están adoptando los líderes del sector
7. Oportunidades no explotadas que ves

Citá fuentes reales con link."

**Criterio de hecho**: tenés un documento de 2-3 páginas con los 7 puntos respondidos y fuentes verificables.
$ej6$, 6
FROM workshops WHERE slug = 'del-sueno-a-la-convocatoria';

-- EJ 7
INSERT INTO exercises (workshop_id, title, objective, prompt_text, "order")
SELECT id, 'Tu propuesta de valor + ODS con IA como evaluador', 'Articular tu propuesta de valor alineada con impacto medible.',
$ej7$
**Setup**: doc + ChatGPT/Claude.

**Paso 1**: completá vos las 5 preguntas + ODS:

1. ¿Para quién? __________ (debe coincidir con tu buyer persona principal del Ej. 5)
2. ¿Qué problema le resolvés? (en SUS palabras): __________
3. ¿Cómo lo resolvés? (tu método único): __________
4. ¿Por qué a vos? (diferencial real, no opinión): __________
5. ¿Qué transformación generás? (impacto + ODS específicos): __________

ODS que toca mi propuesta: ____________ (elegí 1 a 3).

**Paso 2 — IA como evaluador de fondos de impacto**. Pegale:

```
Actúa como evaluador de un fondo de impacto que tiene 50 propuestas en la mesa
y solo plata para financiar 5. Decidí si la mía pasa el primer filtro.

1. Marcá las preguntas que respondí con palabras vacías o genéricas
2. Detectá si mi "para quién" está alineado con mi "problema"
3. Decime si mi "por qué a vos" es un diferencial real o una característica que todos tienen
4. Verificá si los ODS REALMENTE se conectan — por cada ODS, decime qué META específica estoy aportando
   (ej: ODS 8 tiene 12 metas, ¿cuál?)
5. Devolveme la propuesta reescrita en 3 versiones: ascensor 30 seg, párrafo para landing, párrafo para postulación

NO me felicites. Si pasa, pasa. Si no, decime por qué.

Acá va mi propuesta:
[pegá las 5 respuestas + ODS]
```

**Paso 3**: pasá los ODS por unstats.un.org/sdgs para confirmar la meta específica.

**Criterio de hecho**: nombrás la meta específica del ODS (no solo el número). "ODS 8" no sirve. "ODS 8 meta 8.3" sí.
$ej7$, 7
FROM workshops WHERE slug = 'del-sueno-a-la-convocatoria';

-- EJ 8
INSERT INTO exercises (workshop_id, title, objective, prompt_text, "order")
SELECT id, 'Tu Business Model Canvas con IA como VC', 'Mapear tu modelo en una sola hoja y stress-testearlo.',
$ej8$
**Setup**: elegí UNA opción:
- **Digital (recomendado)**: Miro (plantilla "Business Model Canvas") o Figma o Notion con tabla 3x3
- **Analógico**: hoja A3 + posts-its de colores

**Pasos**:

1. Abrí los 9 bloques.
2. Llenalos en este orden: Propuesta → Segmento → Canales → Relación → Ingresos → Recursos → Actividades → Socios → Costos.
3. Regla: una idea = un post-it / una fila. Si decís "todos" o "de todo", está mal — especificá.
4. Cuando tengas el primer borrador, pegale a la IA:

```
Actúa como un VC que evalúa modelos de negocio. Te paso mi Canvas (9 bloques).

1. Detectar inconsistencias entre bloques (ej: propuesta "premium" pero canales orgánicos sin presupuesto)
2. Marcar qué bloques están genéricos y necesitan especificidad
3. Identificar el bloque más débil — el que primero rompería el modelo
4. Proponer 1 hipótesis de Fase 4 que valida ese bloque débil
5. NO me felicites. Devolveme la versión brutalmente honesta.

Acá va mi Canvas:
Propuesta de valor: __________
Segmento: __________
Canales: __________
Relación: __________
Ingresos: __________
Recursos clave: __________
Actividades: __________
Socios: __________
Costos: __________
```

5. Iterá el Canvas. 3-5 iteraciones antes de tener algo decente.

**Criterio de hecho**: podés explicar tu negocio en 90 segundos mirando el Canvas. La IA ya no encuentra inconsistencias graves.
$ej8$, 8
FROM workshops WHERE slug = 'del-sueno-a-la-convocatoria';

-- EJ 9
INSERT INTO exercises (workshop_id, title, objective, prompt_text, "order")
SELECT id, 'Tu plan de validación con IA como Product Manager', 'Diseñar las pruebas que vas a hacer en las próximas 4 semanas.',
$ej9$
**Setup**: Notion (tabla) + ChatGPT/Claude.

**Paso 1**: armá vos primero esta tabla con tus 3 hipótesis principales:

| Hipótesis a validar | Método | Cuándo | Métrica de éxito |
|---|---|---|---|
| Hay dolor real en mi segmento | 10 entrevistas | Semana 1 | ≥7 confirman con ejemplos del pasado |
| Mi propuesta resuelve ese dolor | MVP concierge | Semana 2-3 | 3 personas pagan algo (no por amistad) |
| Repiten o recomiendan | Seguimiento | Semana 4 | ≥2 recomiendan sin que les pida |

**Paso 2 — IA como Product Manager senior**. Pegale:

```
Actúa como PM con 10 años validando productos B2B y B2C.
Conocés a fondo The Mom Test, Running Lean y Continuous Discovery Habits.

Te paso mi plan de validación con 3 hipótesis.

1. Decirme si cada hipótesis es FALSABLE — debe poder demostrarse FALSA. Si dice "los clientes querrán
   mi producto", no es falsable. Reescribíla.
2. Marcar si la métrica de éxito es ESPECÍFICA (números, no adjetivos)
3. Decirme si el método es el adecuado: ¿entrevista valida eso o necesito observación / encuesta / MVP?
4. Proponer 1 hipótesis CRÍTICA que yo no estoy validando y que podría romper todo el modelo
5. Por cada hipótesis, dame 5 preguntas tipo Mom Test (pasado, no futuro; específicas, no abiertas)

NO me dejes pasar hipótesis vagas.

Acá va mi plan:
[pegá tu tabla]
```

**Paso 3**: agendá las 10 entrevistas ESTA semana en Calendly. Si no las agendás, la hipótesis muere.

**Criterio de hecho**: 3 hipótesis falsables, 30 preguntas tipo Mom Test listas, 10 entrevistas agendadas con fecha y hora real.
$ej9$, 9
FROM workshops WHERE slug = 'del-sueno-a-la-convocatoria';

-- EJ 10
INSERT INTO exercises (workshop_id, title, objective, prompt_text, "order")
SELECT id, 'Tu TechBox con IA como CTO consultor', 'Elegir las 4-6 herramientas que vas a operar — no 12.',
$ej10$
**Setup**: doc + ChatGPT/Claude.

**Paso 1**: respondé vos primero (sin IA):
- Mi modelo de negocio en 1 línea: __________
- Mi etapa: idea / validación / primeros clientes / escala
- Mi presupuesto mensual para herramientas: __________ USD
- Qué tareas me consumen MÁS tiempo hoy: __________
- Qué tareas me gustaría automatizar primero: __________

**Paso 2 — IA como CTO consultor que cobra por minuto**. Pegale:

```
Actúa como CTO consultor freelance que arma stacks tecnológicos para emprendedores en etapa temprana.
Tu reputación está en juego: si me recomendás 12 herramientas, mi negocio colapsa.

1. Recomendarme MÁXIMO 6 herramientas en total (una por categoría: organización, automatización,
   diseño, IA, marketing, finanzas)
2. Justificar por qué CADA UNA antes que 3 alternativas posibles
3. Decirme cuál arrancar PRIMERO y cuál posponer
4. Estimar costo mensual total y advertirme si supera mi presupuesto
5. Proponer 1 automatización específica que puedo armar ESTA semana (con pasos concretos)
6. Decirme qué herramienta NO necesito ahora aunque parezca tentadora

Si me recomendás más de 6, perdiste el cliente. Sé despiadado.

Acá va mi contexto:
[pegá tu respuesta del paso 1]
```

**Paso 3**: creá la cuenta de las 6 herramientas. Ejecutá la automatización propuesta.

**Criterio de hecho**: tu lista final tiene entre 4 y 6 herramientas, todas con cuenta creada Y un primer caso real ejecutado en la principal.
$ej10$, 10
FROM workshops WHERE slug = 'del-sueno-a-la-convocatoria';

-- EJ 11
INSERT INTO exercises (workshop_id, title, objective, prompt_text, "order")
SELECT id, 'Tu pitch de 60 seg con IA como pitch coach', 'Poder presentar tu negocio en 60 segundos siguiendo el Golden Circle.',
$ej11$
**Setup**: doc + ChatGPT/Claude + grabadora del celular.

**Paso 1**: escribí vos primero el pitch siguiendo Golden Circle:

1. "Creo que ____________." (POR QUÉ, 15 seg)
2. "Por eso construí ____________, que ayuda a ____________ a ____________." (QUÉ + para quién, 20 seg)
3. "Lo hago de manera diferente porque ____________." (CÓMO, 15 seg)
4. "Hoy ya hemos logrado ____________ y buscamos ____________." (Tracción + ask, 10 seg)

**Paso 2 — IA como pitch coach de Demo Day**. Pegale:

```
Actúa como pitch coach que entrenó a 100+ emprendedores que pitchearon en Demo Days
(Y Combinator, 500 Startups, Endeavor). Tu único KPI: que el inversor pida la segunda reunión.

Te paso mi pitch de 60 segundos.

1. Cronometralo: ¿realmente entra en 60 seg o estoy mintiéndome?
2. Identificá la frase GANCHO — si los primeros 5 segundos son débiles, perdí
3. Marcá las palabras vagas (innovador, único, revolucionario) y reemplazalas por datos
4. Decime si mi diferencial es REAL o es marketing
5. Verificá que mi "ask" sea concreto: ¿qué le pido específicamente?
6. Devolveme 2 versiones: una para inversor, una para cliente potencial

Si mi pitch no genera "contame más", perdí el pitch.

Acá va mi pitch:
[pegá las 4 frases]
```

**Paso 3**: grabate en video diciendo el pitch reescrito. Mirate. Cronometrate. Repetí 10 veces.

**Paso 4 — test real**: probálo con 3 personas distintas (1 emprendedor, 1 inversor, 1 random). Si las 3 entienden y al menos 1 te pide más info → listo.

**Criterio de hecho**: pitch dicho en menos de 60 seg, sin notas. Mínimo 1 de las 3 personas test te pidió más detalles sin que vos preguntes.
$ej11$, 11
FROM workshops WHERE slug = 'del-sueno-a-la-convocatoria';

-- EJ 12 (Deck — el más largo, con HTML)
INSERT INTO exercises (workshop_id, title, objective, prompt_text, "order")
SELECT id, 'Tu primer deck profesional (Vía A: Gamma · Vía B: Claude+HTML)', 'Crear una presentación profesional de tu negocio para clientes o convocatorias.',
$ej12$
Elegí UNA de las dos vías según tu nivel y necesidad. Las dos son válidas.

🅰️ VÍA RÁPIDA — Gamma (default, sin código)
Para vos si querés un deck decente en 20 minutos, no sabés HTML, y la identidad visual genérica de Gamma te alcanza.

Pasos:
1. Andá a gamma.app
2. Generate → Presentation
3. Pegá este prompt:

"Generá una presentación de 10 slides para [nombre de tu negocio].
Slide 1: portada con propuesta de valor
Slide 2: el problema que resuelvo (con tu historia)
Slide 3: mi por qué (Golden Circle)
Slide 4: mi propuesta de valor
Slide 5: para quién (buyer persona)
Slide 6: cómo lo hago (3 pilares)
Slide 7: cómo me diferencio
Slide 8: alineación con ODS + impacto
Slide 9: tracción / casos
Slide 10: contacto + llamado a la acción
Tono: profesional con calidez humana. Estilo: moderno minimalista. Idioma: español."

4. Editá slide por slide
5. Aplicá tus colores de marca

Criterio de hecho: tenés un deck listo para presentar.

🅱️ VÍA PRO — Claude + HTML (control total de marca)
Para vos si querés que el deck respire tu identidad (paleta, fuentes, animaciones propias), vas a presentar a un fondo o cliente importante.

Por qué gana cuando importa: control 100% del visual, animaciones sutiles (glow, pulse), imprimible en A4, cero costo adicional, cero marca de "Hecho con Gamma", versionable.

No necesitás saber HTML. Solo copiar, pegar, reemplazar texto y abrir en navegador.

Pasos:
1. Copiá la plantilla HTML completa de abajo
2. Pegá en un chat con Claude.ai (o ChatGPT) con este prompt:

"Esta es una plantilla HTML de presentación profesional con identidad visual cuidada (paleta cyan/magenta/naranja, fuentes Space Grotesk + Inter, animaciones sutiles). Reemplazá los placeholders [ENTRE CORCHETES] con la información de mi negocio. Mantené EXACTAMENTE el estilo visual y las animaciones — solo cambiá el texto.

NEGOCIO:
- Nombre: [tu nombre comercial]
- Propuesta de valor: [tu propuesta en 1 línea]
- Mi por qué (Golden Circle): [tu por qué del Ejercicio 2]
- Mi historia: [tu historia del Ejercicio 4 en 2 líneas]
- Buyer persona principal: [del Ejercicio 5]
- Mis 3 pilares (cómo): [tres palabras clave]
- Mi diferencial: [por qué a vos]
- ODS que toco: [del Ejercicio 7]
- Tracción actual: [cifras o casos o 'en validación']
- Llamado a la acción: [qué querés que haga el que ve el deck]
- Mi contacto: [email, web, LinkedIn, WhatsApp]

Devolveme el HTML completo listo para guardar.

[PEGÁ ACÁ LA PLANTILLA HTML]"

3. Claude te devuelve el HTML completo
4. Copialo, pegalo en un archivo .html
5. Doble click → se abre en tu navegador
6. Para exportar a PDF: Ctrl+P → Guardar como PDF → A4

PERSONALIZAR PALETA: en la sección :root del CSS cambiá --cyan, --magenta y --orange por tus colores.

PLANTILLA HTML COMPLETA:

<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8">
<title>[NOMBRE DEL NEGOCIO] — Deck</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@500;600;700&family=Inter:wght@400;500;600&display=swap" rel="stylesheet">
<style>
* { margin:0; padding:0; box-sizing:border-box; }
:root {
  --bg: #0B1220; --bg2: #05080F; --cyan: #19C6E6; --magenta: #D946EF;
  --orange: #FF7A1A; --lime: #A3E635; --text: #E8EDF6; --muted: #95A2B8;
  --display: 'Space Grotesk', sans-serif; --body: 'Inter', sans-serif;
}
body { font-family: var(--body); background: var(--bg); color: var(--text); overflow: hidden; height: 100vh; }
@keyframes pulse { 0%,100% { opacity:.4 } 50% { opacity:1 } }
.slide { display:none; width:100vw; height:100vh; padding:80px 100px; position:absolute; flex-direction:column; justify-content:center; }
.slide.active { display:flex; }
.tag { display:inline-block; padding:6px 18px; border-radius:100px; font-size:.78rem; font-weight:700; letter-spacing:.1em; text-transform:uppercase; margin-bottom:24px; background:rgba(25,198,230,.15); color:var(--cyan); border:1px solid rgba(25,198,230,.4); font-family:var(--display); width:fit-content; }
.h1 { font-family:var(--display); font-size:4rem; font-weight:700; line-height:1.05; letter-spacing:-.02em; margin-bottom:24px; }
.h2 { font-family:var(--display); font-size:2.4rem; font-weight:600; line-height:1.15; margin-bottom:20px; }
.lead { font-size:1.4rem; color:var(--muted); line-height:1.5; max-width:760px; margin-bottom:28px; }
.body-text { font-size:1.1rem; color:var(--muted); line-height:1.7; max-width:680px; }
.sep { width:60px; height:4px; border-radius:2px; background:linear-gradient(90deg,var(--cyan),var(--magenta)); margin:20px 0; }
.bg-glow-cy { position:absolute; top:-200px; right:-200px; width:600px; height:600px; border-radius:50%; background:radial-gradient(circle, rgba(25,198,230,.15), transparent 70%); filter:blur(20px); animation: pulse 8s ease-in-out infinite; }
.bg-glow-mg { position:absolute; bottom:-200px; left:-200px; width:600px; height:600px; border-radius:50%; background:radial-gradient(circle, rgba(217,70,239,.12), transparent 70%); filter:blur(20px); animation: pulse 10s ease-in-out infinite; }
.grid-2 { display:grid; grid-template-columns:1fr 1fr; gap:40px; margin-top:30px; }
.grid-3 { display:grid; grid-template-columns:1fr 1fr 1fr; gap:24px; margin-top:30px; }
.card { background:rgba(255,255,255,.04); border:1px solid rgba(255,255,255,.1); border-radius:14px; padding:26px; }
.card-cy { border-color:rgba(25,198,230,.4); } .card-mg { border-color:rgba(217,70,239,.4); }
.card-or { border-color:rgba(255,122,26,.4); } .card-lm { border-color:rgba(163,230,53,.4); }
.card-label { font-size:.7rem; text-transform:uppercase; letter-spacing:.15em; color:var(--cyan); margin-bottom:10px; font-family:var(--display); }
.card-content { font-size:1.05rem; line-height:1.55; color:var(--text); }
.quote { font-style:italic; font-size:1.5rem; line-height:1.5; color:var(--text); border-left:3px solid var(--cyan); padding-left:24px; max-width:760px; }
.nav { position:fixed; bottom:30px; right:40px; display:flex; gap:12px; z-index:100; }
.nav button { background:rgba(25,198,230,.15); border:1px solid rgba(25,198,230,.4); color:var(--text); padding:10px 22px; border-radius:8px; cursor:pointer; font-family:inherit; font-size:.95rem; }
.nav button:hover { background:var(--cyan); color:var(--bg); }
.counter { position:fixed; bottom:35px; left:40px; color:var(--muted); font-size:.85rem; z-index:100; font-family:var(--display); }
.progress { position:fixed; top:0; left:0; height:3px; background:linear-gradient(90deg,var(--cyan),var(--magenta),var(--orange)); z-index:200; transition:width .35s ease; }
@media print { @page { size: A4 landscape; margin: 0; } body { overflow: visible; height: auto; } .slide { display: flex !important; page-break-after: always; position: relative; } .nav, .counter, .progress { display: none; } }
</style></head><body>
<div class="progress" id="prog"></div><div class="counter" id="cnt"></div>
<div class="nav"><button onclick="prev()">← Anterior</button><button onclick="next()">Siguiente →</button></div>
<section class="slide active" id="s1"><div class="bg-glow-cy"></div><div class="bg-glow-mg"></div><div style="position:relative;z-index:2;"><div class="tag">[FECHA · CONTEXTO]</div><h1 class="h1">[TU PROPUESTA DE VALOR EN 1 LÍNEA].</h1><div class="sep"></div><p class="lead">[SUBTÍTULO EN 2 LÍNEAS]</p><div style="margin-top:50px;"><div style="font-family:var(--display);font-size:1.1rem;font-weight:600;">[TU NOMBRE]</div><div style="font-size:.9rem;color:var(--muted);margin-top:5px;">[TU ROL]</div></div></div></section>
<section class="slide" id="s2"><div class="bg-glow-mg"></div><div class="tag" style="background:rgba(217,70,239,.15);color:var(--magenta);border-color:rgba(217,70,239,.4);">El problema</div><h2 class="h2">[TITULAR DEL PROBLEMA]</h2><div class="sep" style="background:linear-gradient(90deg,var(--magenta),var(--orange));"></div><p class="body-text">[DESARROLLO 3-4 LÍNEAS]</p><div class="quote" style="margin-top:30px;border-color:var(--magenta);">"[TU HISTORIA EN 2 LÍNEAS]"</div></section>
<section class="slide" id="s3"><div class="bg-glow-cy"></div><div class="tag">Mi por qué</div><h2 class="h2">[TU GOLDEN CIRCLE]</h2><div class="sep"></div><div class="quote">"[TU FRASE DE POR QUÉ]"</div></section>
<section class="slide" id="s4"><div class="bg-glow-cy"></div><div class="tag">Mi propuesta de valor</div><h2 class="h2">[QUÉ ENTREGO]</h2><div class="sep"></div><div class="grid-2"><div class="card card-cy"><div class="card-label" style="color:var(--cyan);">Lo que hago</div><div class="card-content">[ACCIÓN]</div></div><div class="card card-mg"><div class="card-label" style="color:var(--magenta);">Para quién</div><div class="card-content">[BUYER PERSONA]</div></div><div class="card card-or"><div class="card-label" style="color:var(--orange);">Por qué importa</div><div class="card-content">[DOLOR]</div></div><div class="card card-lm"><div class="card-label" style="color:var(--lime);">Mi diferencial</div><div class="card-content">[DIFERENCIAL]</div></div></div></section>
<section class="slide" id="s5"><div class="bg-glow-mg"></div><div class="tag">Cómo lo hago</div><h2 class="h2">Tres pilares operativos</h2><div class="sep"></div><div class="grid-3"><div class="card card-cy"><div style="font-size:2rem;margin-bottom:8px;">⚡</div><div class="card-label">Pilar 1</div><div class="card-content">[PILAR 1]</div></div><div class="card card-mg"><div style="font-size:2rem;margin-bottom:8px;">🎯</div><div class="card-label" style="color:var(--magenta);">Pilar 2</div><div class="card-content">[PILAR 2]</div></div><div class="card card-or"><div style="font-size:2rem;margin-bottom:8px;">🚀</div><div class="card-label" style="color:var(--orange);">Pilar 3</div><div class="card-content">[PILAR 3]</div></div></div></section>
<section class="slide" id="s6"><div class="bg-glow-cy"></div><div class="tag" style="background:rgba(163,230,53,.15);color:var(--lime);border-color:rgba(163,230,53,.4);">Impacto medible</div><h2 class="h2">Aporto a estos ODS</h2><div class="sep" style="background:linear-gradient(90deg,var(--lime),var(--cyan));"></div><div class="grid-3"><div class="card card-lm"><div class="card-label" style="color:var(--lime);">ODS [#]</div><div class="card-content"><strong>[NOMBRE]</strong><br>[CÓMO]</div></div><div class="card card-lm"><div class="card-label" style="color:var(--lime);">ODS [#]</div><div class="card-content"><strong>[NOMBRE]</strong><br>[CÓMO]</div></div><div class="card card-lm"><div class="card-label" style="color:var(--lime);">ODS [#]</div><div class="card-content"><strong>[NOMBRE]</strong><br>[CÓMO]</div></div></div></section>
<section class="slide" id="s7"><div class="bg-glow-mg"></div><div class="tag" style="background:rgba(255,122,26,.15);color:var(--orange);border-color:rgba(255,122,26,.4);">Lo que ya logramos</div><h2 class="h2">Tracción</h2><div class="sep" style="background:linear-gradient(90deg,var(--orange),var(--lime));"></div><div class="grid-3"><div class="card card-or"><div style="font-size:2.8rem;font-family:var(--display);font-weight:700;color:var(--orange);margin-bottom:8px;">[CIFRA 1]</div><div class="card-content">[QUÉ MIDE]</div></div><div class="card card-or"><div style="font-size:2.8rem;font-family:var(--display);font-weight:700;color:var(--cyan);margin-bottom:8px;">[CIFRA 2]</div><div class="card-content">[QUÉ MIDE]</div></div><div class="card card-or"><div style="font-size:2.8rem;font-family:var(--display);font-weight:700;color:var(--magenta);margin-bottom:8px;">[CIFRA 3]</div><div class="card-content">[QUÉ MIDE]</div></div></div></section>
<section class="slide" id="s8"><div class="bg-glow-cy"></div><div class="bg-glow-mg"></div><div style="position:relative;z-index:2;max-width:800px;"><div class="tag">Qué busco</div><h2 class="h2">[LLAMADO A LA ACCIÓN]</h2><div class="sep"></div><p class="lead">[QUÉ NECESITÁS]</p><div style="margin-top:40px;display:flex;flex-direction:column;gap:12px;font-size:1rem;color:var(--muted);"><div>📧 [TU EMAIL]</div><div>🌐 [TU WEB]</div><div>💼 [TU LINKEDIN]</div><div>📱 [TU WHATSAPP]</div></div></div></section>
<script>const TOTAL=8;let cur=1;function go(n){document.getElementById('s'+cur).classList.remove('active');cur=Math.max(1,Math.min(TOTAL,n));document.getElementById('s'+cur).classList.add('active');document.getElementById('cnt').textContent=cur+' / '+TOTAL;document.getElementById('prog').style.width=(cur/TOTAL*100)+'%';}function next(){go(cur+1);}function prev(){go(cur-1);}document.addEventListener('keydown',e=>{if(e.key==='ArrowRight'||e.key===' ')next();if(e.key==='ArrowLeft')prev();});go(1);</script>
</body></html>

CUÁNDO ELEGIR CADA VÍA:
- Reunión mañana, primera vez → Gamma
- Fondo importante o cliente clave → Claude+HTML
- Ya tenés marca propia → Claude+HTML
- Lo usás una vez y descartás → Gamma
- Será tu deck institucional permanente → Claude+HTML

Criterio de hecho: tenés un deck listo (Gamma o HTML) con todos los datos personalizados a tu negocio.
$ej12$, 12
FROM workshops WHERE slug = 'del-sueno-a-la-convocatoria';

-- EJ 13
INSERT INTO exercises (workshop_id, title, objective, prompt_text, "order")
SELECT id, 'Tu mapa de 3 convocatorias con IA como gestora de fondos', 'Salir del taller con 3 convocatorias activas para postular en los próximos 3 meses.',
$ej13$
**Setup**: Notion (tabla) + ChatGPT/Claude + Perplexity.

**Paso 1**: copiá las 7 convocatorias de la Diapositiva 28 a una tabla con columnas: nombre, entidad, cierre, encaje (1-10), tiempo de preparación, contrapartida, fecha de postulación.

**Paso 2 — IA como gestora de fondos especializada en impacto**. Pegale:

```
Actúa como gestora de fondos con 15 años ayudando a emprendedores colombianos a GANAR
convocatorias públicas y privadas.

Te paso mi propuesta de valor + ODS (Ejercicio 7) y la lista de 7 convocatorias.
Tu trabajo NO es decirme "postulá a todas".

1. Hacer matching: por cada convocatoria, calculá un score de encaje 1-10 contra mi propuesta
   y explicá los puntos. Usá datos reales de los criterios del fondo.
2. Marcar las 3 con mejor encaje y descartar el resto
3. Por cada una de las 3, decirme:
   - Documentos que necesito preparar (con tiempo estimado)
   - Métricas / cifras que voy a tener que sustentar (¿las tengo?)
   - El "trampolín" — el dato o relato que más pesa en esa convocatoria
   - El error fatal más común que descalifica (para evitarlo)
4. Proponerme el ORDEN cronológico de postulación para los próximos 6 meses
5. Decirme si me falta tracción para alguna y por cuál tengo que esperar 3 meses

NO me dejes postular a algo donde no encajo solo por entusiasmo.

Mi propuesta:
[pegá del Ej. 7]

Las 7 convocatorias:
[pegá la lista]
```

**Paso 3**: agendá en calendar cada fecha de postulación con 4 semanas de anticipación.

**Criterio de hecho**: 3 convocatorias con score 7+ de encaje, fecha de postulación en calendar, lista de documentos a preparar, plan cronológico para 6 meses.
$ej13$, 13
FROM workshops WHERE slug = 'del-sueno-a-la-convocatoria';

-- EJ 14
INSERT INTO exercises (workshop_id, title, objective, prompt_text, "order")
SELECT id, 'Tu plan de 90 días con IA como COO (bonus)', 'Comprometerte con 3 acciones concretas por mes para los próximos 3 meses.',
$ej14$
**Setup**: Notion (tabla) + ChatGPT/Claude.

**Paso 1**: completá vos primero la tabla con 3 acciones por mes:

**Mes 1 (Validación)**: 1. __ 2. __ 3. __
**Mes 2 (Sistema operando)**: 1. __ 2. __ 3. __
**Mes 3 (Postulación)**: 1. __ 2. __ 3. __

**Paso 2 — IA como COO que detecta planes irreales**. Pegale:

```
Actúa como COO con 10 años operando startups de impacto en LATAM. Viste 200+ planes de 90 días.
El 80% falla porque mezclan deseos con acciones.

Te paso mi plan de 9 acciones (3 por mes).

1. Por cada acción, evaluala con estos 4 criterios:
   - ¿Es ESPECÍFICA? (puede ser tachada de una lista)
   - ¿Es MEDIBLE? (tiene número, fecha o entregable)
   - ¿Es EJECUTABLE por mí solo/a o necesito a otros (¿están comprometidos?)?
   - ¿Está alineada con la etapa correcta (no estoy queriendo postular antes de validar)?
2. Marcar las acciones que son DESEOS disfrazados y reescribirlas como acciones reales
3. Detectar si hay dependencias mal ordenadas (ej: postular en mes 3 sin haber validado en mes 1)
4. Decirme qué acción del Mes 1 es la PIEDRA ANGULAR — si esa no se hace, las otras 8 no importan
5. Proponer 1 ritual semanal de seguimiento (15 min)

NO me dejes pasar acciones que son aspiraciones.

Acá va mi plan:
[pegá tu tabla]
```

**Paso 3**: pegá el plan reescrito en tu home de Notion. Agendá la revisión semanal de 15 min como evento recurrente.

**Criterio de hecho**: las 9 acciones pasan los 4 criterios del COO, la piedra angular está identificada, el ritual semanal está agendado. Firmá y datá la tabla.
$ej14$, 14
FROM workshops WHERE slug = 'del-sueno-a-la-convocatoria';

-- ============================================================
-- 5) GLOSARIO (47 términos)
-- ============================================================
INSERT INTO glossary_terms (workshop_id, term, definition, category)
SELECT w.id, t.term, t.definition, t.category FROM workshops w,
(VALUES
  ('Ikigai', 'Concepto japonés de razón de ser. Cruce de 4 preguntas: qué amás, qué necesita el mundo, en qué sos bueno/a, por qué te pagan.', 'fundamentos'),
  ('Golden Circle', 'Modelo de Simon Sinek con 3 círculos: POR QUÉ → CÓMO → QUÉ. Las marcas que impactan empiezan por el por qué.', 'fundamentos'),
  ('GROW Model', 'Modelo de coaching: Goal, Reality, Options, Will. Para proyectar próximo paso concreto.', 'fundamentos'),
  ('Propuesta de valor', 'El núcleo del Canvas: qué problema resolvés, para quién, cómo y con qué impacto.', 'fundamentos'),
  ('ODS (Objetivos de Desarrollo Sostenible)', '17 metas globales de la ONU para 2030. Marco de impacto para emprendedores.', 'fundamentos'),
  ('Business Model Canvas', 'Plantilla visual de 9 bloques para describir cualquier modelo de negocio. Creado por Alexander Osterwalder.', 'metodologia'),
  ('Buyer persona', 'Representación semi-ficcional de tu cliente ideal basada en datos reales.', 'metodologia'),
  ('Validación', 'Proceso de probar hipótesis con clientes reales antes de invertir en escala.', 'metodologia'),
  ('MVP (Producto Mínimo Viable)', 'La versión más pequeña posible de un producto/servicio que aún resuelve el problema.', 'metodologia'),
  ('Hipótesis', 'Suposición que tenés sobre tu negocio y que necesitás validar con datos reales.', 'metodologia'),
  ('Mom Test', 'Marco para entrevistas que evita las respuestas de cortesía. Libro de Rob Fitzpatrick.', 'metodologia'),
  ('Entrevista', 'Herramienta de validación cualitativa, profunda, sobre comportamiento pasado.', 'metodologia'),
  ('Encuesta', 'Herramienta de validación cuantitativa con muchos datos en poco tiempo.', 'metodologia'),
  ('Concierge MVP', 'Tipo de MVP donde vos hacés a mano lo que después será automatizado.', 'metodologia'),
  ('Mago de Oz MVP', 'MVP que parece automático pero detrás hay un humano operando.', 'metodologia'),
  ('Landing page', 'Página web simple para validar interés antes de construir el producto completo.', 'metodologia'),
  ('Producto piloto', 'MVP funcional limitado, probado con 5-10 clientes reales antes de escalar.', 'metodologia'),
  ('Prototipo', 'Versión preliminar y de bajo costo de un producto para probar antes de invertir.', 'metodologia'),
  ('Pitch', 'Presentación corta y persuasiva de un emprendimiento (3-10 minutos).', 'metodologia'),
  ('Modelo de negocio', 'Cómo una organización crea, entrega y captura valor económico.', 'emprendimiento'),
  ('Aceleradora', 'Programa que ayuda a emprendimientos a crecer con mentoría, capital y red de contactos.', 'emprendimiento'),
  ('Capital semilla', 'Primera inversión que recibe un emprendimiento para arrancar.', 'emprendimiento'),
  ('Segmento de clientes', 'Grupo específico de personas a quienes les resolvés un problema.', 'emprendimiento'),
  ('Lead', 'Persona interesada en tus servicios que dejó sus datos.', 'emprendimiento'),
  ('Stack tecnológico', 'Conjunto de herramientas digitales que usa un negocio para operar.', 'emprendimiento'),
  ('ESG', 'Environmental, Social, Governance. Estándares de impacto que las empresas reportan.', 'emprendimiento'),
  ('Brand kit', 'Conjunto de elementos visuales (colores, tipografías, logo) que definen una marca.', 'emprendimiento'),
  ('Emprendimiento de impacto', 'Negocio que combina rentabilidad económica con impacto social o ambiental medible.', 'emprendimiento'),
  ('CAC (Costo de Adquisición de Cliente)', 'Cuánto te cuesta conseguir un cliente nuevo (suma de marketing + ventas dividido por clientes ganados). Si tu CAC es mayor que el LTV, tu modelo no es sostenible.', 'emprendimiento'),
  ('LTV (Lifetime Value)', 'El valor total que un cliente te genera durante toda su relación con tu negocio. Regla de oro: LTV debería ser ≥ 3× CAC para que el modelo escale.', 'emprendimiento'),
  ('Convocatoria', 'Programa que ofrece financiación, mentoría o premios a emprendimientos.', 'convocatorias'),
  ('Fondo Emprender SENA', 'Capital semilla colombiano hasta 180 SMLMV para emprendedores con estudio técnico o universitario.', 'convocatorias'),
  ('iNNpulsa Colombia', 'Agencia colombiana de emprendimiento e innovación.', 'convocatorias'),
  ('Apps.co', 'Programa de MinTIC Colombia para emprendimiento digital.', 'convocatorias'),
  ('Créame', 'Entidad de Medellín que opera el Capital Semilla de la Alcaldía.', 'convocatorias'),
  ('Social Skin', 'Fondo privado de capital para emprendimientos de impacto social.', 'convocatorias'),
  ('Social Hackathon', 'Hackathon enfocado en innovación social. En Medellín lo organiza Y4PT.', 'convocatorias'),
  ('Contrapartida', 'Compromiso (financiero, de tiempo, de resultados) que un fondo pide al beneficiario.', 'convocatorias'),
  ('TechBox', 'Caja personalizada de herramientas digitales adaptada a un modelo de negocio específico.', 'herramientas'),
  ('Notion', 'Herramienta de organización todo-en-uno: docs, bases de datos, calendarios.', 'herramientas'),
  ('Perplexity', 'Buscador con IA que responde con fuentes reales y citas.', 'herramientas'),
  ('Salazar Duke Impact Hub', 'Emprendimiento social fundado por Jennifer Salazar Duque que capacita a personas con diagnósticos de salud mental en habilidades digitales y ofrece servicios de organización digital y automatización.', 'ecosistema'),
  ('KAIA', 'Metodología de aprendizaje propia del Salazar Duke Impact Hub.', 'ecosistema'),
  ('SEWHO', 'Comunidad de emprendimiento que lidera Jennifer Salazar Duke.', 'ecosistema'),
  ('Trazzos Labs', 'Laboratorio de innovación de Salazar Duke Impact Hub para proyectos legal-tech e IA inclusiva.', 'ecosistema'),
  ('SENA', 'Servicio Nacional de Aprendizaje (Colombia). Opera el Fondo Emprender.', 'ecosistema'),
  ('SMLMV', 'Salario Mínimo Legal Mensual Vigente. Unidad usada en convocatorias colombianas.', 'ecosistema'),
  ('Voseo', 'Forma del español que usa vos en lugar de tú. Típico de Argentina, Uruguay y partes de Colombia.', 'ecosistema')
) AS t(term, definition, category)
WHERE w.slug = 'del-sueno-a-la-convocatoria';

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
-- FROM workshops w WHERE slug = 'del-sueno-a-la-convocatoria';
--
-- Esperado: 5 secciones · 31 slides · 14 ejercicios · 47 términos
