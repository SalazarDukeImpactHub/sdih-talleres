-- ============================================================
-- TALLER 06 — Tu Mapa Personal de Recuperación de Depresión
-- ============================================================
-- ⚠️ TALLER CLÍNICAMENTE SENSIBLE
-- Basado en marco CBT publicado por The Depression Project.
-- NO reemplaza terapia ni tratamiento psiquiátrico.
--
-- Cómo usar este archivo:
-- Opción A (recomendada): abrir en TablePlus conectado a Supabase y correr todo de una.
-- Opción B: pegar entero en Supabase SQL Editor (web).
--
-- Es idempotente: el DELETE inicial limpia residuos de intentos previos.
-- Si todo va bien al final tenés: 1 workshop, 5 secciones (con 21 slides
-- de aprendizaje), 10 ejercicios y 33 términos de glosario.
-- ============================================================

-- 1) Cleanup defensivo
DELETE FROM workshops WHERE slug = 'mapa-recuperacion-depresion';

-- 2) Workshop
INSERT INTO workshops (
  slug, title, description, instructor,
  date_live, duration_min, prerequisites, status,
  whatsapp_message_template
) VALUES (
  'mapa-recuperacion-depresion',
  'Tu Mapa Personal de Recuperación: organizarte sistémicamente cuando atravesás una depresión',
  'A la mayoría de las personas con depresión nunca le entregaron una explicación clara, detallada y paso-a-paso de cómo organizarse para recuperarse. Te diagnostican, te medican, te mencionan terapia — pero nadie te entrega un mapa. Este taller te entrega el mapa. No el cura mágica — un mapa psicoeducativo basado en Terapia Cognitivo-Conductual (CBT), adaptado del marco publicado por The Depression Project. Vas a entender los 5 frentes en los que la depresión te ataca, distinguir en qué fase de severidad estás (Storm-Rain-Cloud-Sun), y construir tus propios kits de estrategias para cada zona. Funciona MEJOR como complemento a tu tratamiento profesional — no como sustituto.',
  'Jennifer Salazar Duque',
  NULL,
  360,
  'AVISO CLÍNICO: Este taller NO es tratamiento clínico, NO es terapia, NO es psiquiatría. Es psicoeducativo basado en CBT publicado. Funciona MEJOR como complemento a: acompañamiento psiquiátrico, terapia psicológica activa (CBT/ACT/DBT idealmente), red de soporte personal informada. NO es para vos si: estás en crisis aguda en este momento (buscá atención clínica primero); tenés ideación suicida activa (línea de salud mental + atención profesional ahora); esperás que el taller cure tu depresión (esa no es la promesa). Obligatorios: estar fuera de una crisis aguda; disposición a observarte sin juicio 6h + 30 días; libreta exclusiva; si estás en tratamiento, avisarle a tu profesional; privacidad para ser honesta. Muy recomendados: tener acceso a terapia o estar gestionándolo; haber completado el Taller 04 - Sistema de Auto-Protección Mental; al menos 2 personas de confianza identificadas. Si necesitás ayuda urgente: Colombia 192 op.4 / Medellín 123 op.4 / Bogotá 106; Argentina 135 o (011) 5275-1135; México 800-290-0024; España 024; internacional findahelpline.com.',
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
  "title": "Bienvenida — tu mapa de recuperación",
  "description": "## ⚠️ AVISO CLÍNICO — leelo antes de empezar\n\n**Este taller NO es tratamiento clínico, NO es terapia, NO es psiquiatría.**\n\nEs un taller psicoeducativo basado en un marco publicado y validado (CBT) que te ayuda a:\n- Entender los 5 frentes en los que la depresión te ataca\n- Distinguir en qué fase de severidad estás en cada momento\n- Construir tu propio mapa de estrategias para cada fase\n\n**Funciona MEJOR como complemento a:**\n- Acompañamiento psiquiátrico (si necesitás medicación)\n- Terapia psicológica activa (idealmente CBT, ACT, DBT o similar)\n- Red de soporte personal informada\n\n**NO es para vos si:**\n- Estás en crisis aguda en este momento → buscá atención clínica primero\n- Tenés ideación suicida activa → línea de salud mental + atención profesional ahora\n- Esperás que el taller *cure* tu depresión — esa no es la promesa\n\n### Si necesitás ayuda urgente\n\n| País | Línea |\n|------|-------|\n| Colombia | 192 opción 4 / Medellín: 123 opción 4 / Bogotá: 106 |\n| Argentina | 135 (CABA-GBA) / (011) 5275-1135 |\n| México | 800-290-0024 |\n| España | 024 |\n| Internacional | [findahelpline.com](https://findahelpline.com) |\n\n**Si tenés terapeuta:** comentale que vas a hacer este taller. El sistema funciona mejor en diálogo con tu proceso clínico.\n\n---\n\n## Algo personal antes de empezar\n\nSi llegaste hasta acá, probablemente vos misma estás atravesando un proceso depresivo, o acompañás a alguien que lo atraviesa.\n\nTe voy a hablar con honestidad — desde la persona que perdió a su hermano Stiven, atravesó procesos largos y construyó, con apoyo clínico, sistemas para sostenerse.\n\nHay algo que **The Depression Project** — la organización en la que se basa este taller — encontró después de hablar con millones de personas con depresión en sus redes:\n\n> **La mayoría de las personas con depresión nunca recibió una explicación clara, detallada y paso-a-paso de cómo superarla.**\n\nTe diagnostican, te medican, te mencionan terapia (que muchas veces no podés pagar) — pero nadie te entrega un **mapa**. Como si quisieran que cocines un plato complicado sin la receta.\n\nEste taller te entrega el mapa. No el *cura mágica* — un mapa basado en investigación clínica (Terapia Cognitivo-Conductual), publicado en libro por The Depression Project, adaptado a formato de taller práctico.\n\n## Qué vas a salir teniendo\n\n1. Vas a entender los **5 frentes de batalla** de la depresión (pensamientos, emociones, comportamientos, entorno, fisiología) y cómo se alimentan entre sí\n2. Vas a tener mapeado **tu propio frente de batalla** — cómo se manifiesta la depresión en vos específicamente\n3. Vas a entender el **marco Storm-Sun** y vas a saber identificar en qué zona estás en cada momento\n4. Vas a tener tu **kit de estrategias de supervivencia** (para Storm Zone)\n5. Vas a tener tu **kit de estrategias de afrontamiento** (para Rain Zone)\n6. Vas a tener tu **kit de estrategias de sanación** (para Cloud Zone)\n7. Vas a saber cuándo aplicar cada tipo de estrategia y por qué importa\n8. Vas a tener un **plan de 30 días** con seguimiento grupal\n\n## Qué NO vas a aprender\n\n- **No es terapia.** No vamos a procesar trauma — vamos a construir un mapa\n- **No es coaching motivacional.** No hay *tú puedes* sin sustento. Hay protocolos basados en evidencia\n- **No reemplaza medicación.** La fisiología es uno de los 5 frentes — ese requiere médico\n- **No promete cura inmediata.** Promete que sepas qué hacer en cada estado y cómo organizarte para recuperarte\n\n## Duración y acompañamiento\n\n- 6 horas en vivo (2 sesiones de 3h)\n- 30 días de acompañamiento\n- 4 check-ins grupales semanales (45 min, opcional asistir)\n- Canal privado de soporte\n- Revisión personalizada al día 30\n\n## Una promesa importante\n\n> **Este taller no te promete que vas a estar bien en 30 días. Te promete que vas a tener un mapa claro de qué hacer en cada zona — y eso lo cambia todo.**\n\nCuando tenés mapa, dejás de gastar la poca energía que la depresión te deja en **adivinar qué hacer**. La invertís en **ejecutar el plan que ya construiste**.",
  "quick_links": [
    {"label": "21 diapositivas — los 5 frentes + Storm-Sun", "target_section": "aprendizaje"},
    {"label": "10 ejercicios — construí tus 3 kits", "target_section": "taller"},
    {"label": "Setup del sistema + líneas de crisis", "target_section": "instalacion"},
    {"label": "Glosario", "target_section": "glosario"}
  ]
}
$inicio$::jsonb
FROM workshops WHERE slug = 'mapa-recuperacion-depresion';

-- APRENDIZAJE (21 slides: intro + 20)
INSERT INTO sections (workshop_id, type, section_order, content_json)
SELECT id, 'aprendizaje', 2,
$apr$
{
  "type": "aprendizaje",
  "title": "El marco — los 5 frentes y las 4 zonas",
  "slides": [
    {"kicker": "Introducción", "title": "Por qué el mapa importa", "body": "La depresión no es una sola cosa. Es la suma de 5 cosas que se alimentan entre sí en un espiral descendente.\n\nSi solo atacás una (típicamente: medicación → fisiología), las otras 4 siguen tirando del espiral hacia abajo. Por eso tanta gente toma antidepresivos durante años y siente alivio parcial pero **no recuperación**.\n\nEl mapa que vas a construir ataca los 5 frentes, en la zona correcta, con la estrategia correcta.", "notes": null},
    {"kicker": "Diapositiva 1 · El modelo", "title": "Los 5 frentes de batalla", "body": "The Depression Project, basándose en CBT, identifica 5 aspectos de la depresión que tenés que atacar:\n\n| Frente | Qué incluye |\n|--------|-------------|\n| 🧠 **1. Pensamientos** | Negativos, hopeless, worry, rumiación, creencias sobre vos misma |\n| 💔 **2. Emociones** | Tristeza profunda, vergüenza, irritabilidad, vacío, soledad, hopeless |\n| 🚶 **3. Comportamientos** | Aislamiento social, dificultad de funcionar, autosabotaje, autodaño |\n| 🏠 **4. Entorno** | Estado físico de tu casa, trabajo, relaciones, finanzas |\n| 🫀 **5. Fisiología** | Química cerebral, sueño, energía, dolores, apetito |\n\n**Regla dura:** medicar solo el frente 5 deja los otros 4 intactos. Por eso no alcanza.", "notes": null},
    {"kicker": "Diapositiva 2 · Frente 1", "title": "Pensamientos en detalle", "body": "Los pensamientos depresivos típicos:\n\n| Tipo | Ejemplos |\n|------|----------|\n| **Sin valor** | *Soy un fracaso*, *Soy inútil*, *Soy una carga* |\n| **Sin esperanza** | *Nada bueno me va a pasar*, *Esto nunca va a mejorar* |\n| **Preocupación catastrófica** | *Si pasa X, mi vida se destruye* |\n| **Sobre el impacto en otros** | *Mi familia estaría mejor sin mí* |\n| **Rumiación** | Dar vueltas sobre un error o pérdida del pasado |\n\n**Cuanto más severa la depresión:**\n- Más frecuentes son estos pensamientos\n- Más se parecen a **creencias** (los crees verdaderos)\n- Menos distancia podés tomar de ellos", "notes": null},
    {"kicker": "Diapositiva 3 · Frente 2", "title": "Emociones en detalle", "body": "Las emociones depresivas típicas:\n\n| Emoción | Cómo se siente |\n|---------|----------------|\n| **Miseria intensa** | Hasta el punto de cuestionar si vale la pena vivir |\n| **Sin valor** | Sentir que no merecés amor |\n| **Sin motivación** | Perder interés en cosas que disfrutabas |\n| **Entumecimiento** | *Existir* más que *vivir* — desconexión total |\n| **Irritabilidad** | Saltar por cosas chicas |\n| **Vergüenza** | Por estar deprimida, por no funcionar como antes |\n| **Soledad** | Sentir que nadie entiende lo que pasás |\n| **Culpa / arrepentimiento** | Por el pasado |\n| **Duelo** | Por pérdidas o por la vida que esperabas tener |\n| **Sin esperanza** | No poder imaginar que mejore |", "notes": null},
    {"kicker": "Diapositiva 4 · Frente 3", "title": "Comportamientos en detalle", "body": "Los comportamientos depresivos típicos:\n\n- **Disminución de funcionamiento:** ducharte, vestirte, levantarte se siente imposible\n- **Aislamiento social:** no querés ver a nadie por múltiples razones\n- **Shutdown:** dejás de comunicar incluso en conversaciones\n- **Dificultad para concentrarte / recordar cosas**\n- **Comer por consuelo / consumo de alcohol** como afrontamiento\n- **Autodaño** — por castigo, distracción del dolor mental, o liberación\n\n**Sobre autodaño / ideación:** si esto aparece, atención clínica inmediata. No es algo a procesar en taller — es algo a tratar con profesional.", "notes": null},
    {"kicker": "Diapositiva 5 · Frente 4", "title": "Entorno en detalle", "body": "La depresión afecta tu entorno físico y situacional:\n\n**Físico:**\n- Casa más desordenada de lo que sería\n- Lista de pendientes que se va acumulando\n\n**Situacional:**\n- Trabajo afectado por dificultad de concentración\n- Dificultades financieras\n- Relaciones erosionadas por el aislamiento\n- Problemas existentes en pareja que se agravan\n- Problemas nuevos que aparecen\n\n**Insight clave:** muchas veces lo que llamás *depresión* es en parte el entorno tóxico que la depresión empeoró y que te está empeorando a vos.", "notes": null},
    {"kicker": "Diapositiva 6 · Frente 5", "title": "Fisiología en detalle", "body": "Lo que la depresión hace en tu cuerpo:\n\n- **Desequilibrio químico cerebral** (serotonina, dopamina, etc.)\n- **Agotamiento crónico**\n- **Insomnio** o **hipersomnia** (dormir demasiado)\n- **Disfunción sexual**\n- **Dolores corporales** sin causa clara\n- **Cefaleas**, pérdida o aumento de apetito\n\n**Este es el frente donde la medicación actúa.** No es magia — es bioquímica.", "notes": null},
    {"kicker": "Diapositiva 7 · El sistema", "title": "El espiral descendente", "body": "> **Los 5 frentes no operan aislados. Se alimentan entre sí en un círculo vicioso.**\n\n**Ejemplo real:**\n\n```\nCrítica de alguien (entorno)\n    ↓\nPensamiento: \"Soy un fracaso\"\n    ↓\nEmoción: vergüenza, miseria\n    ↓\nComportamiento: tomar alcohol para soportarlo\n    ↓\nFisiología: serotonina baja, resaca, menos energía\n    ↓\nMás pensamientos negativos\n    ↓\n(el ciclo se profundiza)\n```\n\n**Por eso es tan difícil salir.** No estás peleando contra UN problema. Estás peleando contra **un sistema que se autoalimenta**.\n\n**Esto también es la solución:** atacando varios frentes en simultáneo, el espiral se revierte. Cada victoria parcial debilita el ciclo.", "notes": null},
    {"kicker": "Diapositiva 8 · Las zonas", "title": "El marco Storm-Sun — las 4 fases de severidad", "body": "La depresión no es constante. Tiene **niveles de severidad** que cambian con el tiempo. Reconocer en qué nivel estás determina qué estrategia usar.\n\n| Zona | Símbolo | Cómo se siente | Estrategia |\n|------|---------|----------------|------------|\n| **Storm** | ⛈️ | Severa. Sobrevivir es la única misión | Estrategias de supervivencia |\n| **Rain** | 🌧️ | Moderada. Difícil pero funcional con esfuerzo | Estrategias de afrontamiento |\n| **Cloud** | ☁️ | Leve. Síntomas suaves, mejor energía | Estrategias de sanación |\n| **Sun** | ☀️ | Recuperada / estable | Mantenimiento + prevención |\n\n**Regla crítica:** las estrategias para una zona **no funcionan en otra zona**. Por eso la mayoría falla — aplican estrategias de Cloud (terapia profunda, ejercicio, alimentación saludable) cuando están en Storm. En Storm, eso es imposible. Hay que sobrevivir primero.", "notes": null},
    {"kicker": "Diapositiva 9 · Auto-diagnóstico", "title": "Cómo identificar en qué zona estás", "body": "### ⛈️ Storm Zone — señales\n- Pensamientos negativos casi constantes\n- Sentís que la vida no vale la pena\n- Funcionalidad mínima — ducharte es escalar una montaña\n- Te aislás completamente\n- Querés solo dormir y desaparecer\n- Cualquier estrategia *compleja* es imposible\n\n### 🌧️ Rain Zone — señales\n- Síntomas presentes pero podés funcionar haciendo esfuerzo\n- Faking smile para sostener trabajo / responsabilidades\n- Cansancio acumulado por sostener apariencias\n- Pensamientos negativos frecuentes pero no constantes\n- Energía intermitente\n- En riesgo de bajar a Storm si no cuidás\n\n### ☁️ Cloud Zone — señales\n- Síntomas suaves\n- Funcionás bien la mayor parte del tiempo\n- Capacidad para reflexionar, hacer cambios, ejercitarte\n- Algunos días malos sueltos\n- Es la zona ideal para hacer trabajo de sanación profundo\n\n### ☀️ Sun Zone — señales\n- Estable\n- Sin síntomas significativos\n- Disfrute de la vida\n- **Vulnerabilidad:** olvidar que hubo zonas anteriores y descuidar mantenimiento", "notes": null},
    {"kicker": "Diapositiva 10 · El error común", "title": "Por qué fallan los enfoques tradicionales", "body": "Cuando alguien te dice cosas como:\n- *Salí a caminar*\n- *Pensá positivo*\n- *Hacé yoga*\n- *Comé sano*\n\n**No es que sean malos consejos.** El problema es que son **estrategias de Cloud Zone aplicadas en Storm Zone**.\n\nPedirle a alguien en Storm que salga a correr es como pedirle a alguien con la pierna rota que corra una maratón. La intención puede ser buena. La ejecución, imposible.\n\n**La clave del taller:** estrategias específicas para CADA zona.", "notes": null},
    {"kicker": "Diapositiva 11 · El kit", "title": "Las 3 categorías de estrategias", "body": "| Categoría | Para qué zona | Característica clave |\n|-----------|---------------|---------------------|\n| **Survival** (Supervivencia) | ⛈️ Storm | Alivio rápido, simples, ejecutables incluso casi sin energía |\n| **Coping** (Afrontamiento) | 🌧️ Rain | Sostener funcionalidad sin quemarte |\n| **Healing** (Sanación) | ☁️ Cloud | Recuperación profunda y prevención de recaída |\n\n**Tu kit completo necesita las 3 categorías**, cubriendo los 5 frentes en cada una.", "notes": null},
    {"kicker": "Diapositiva 12 · Para Storm", "title": "Estrategias de Supervivencia", "body": "**Criterios:**\n- Tienen que dar **alivio rápido** (idealmente instantáneo)\n- Tienen que ser **muy simples** de ejecutar\n- Tienen que funcionar **incluso casi sin energía**\n\n**Ejemplos por frente:**\n\n| Frente | Estrategia de supervivencia |\n|--------|----------------------------|\n| 🧠 Pensamientos | Leer una lista preparada de frases ancla; ver fotos de momentos buenos |\n| 💔 Emociones | Llorar sin culpa; abrazo profundo; música específica |\n| 🚶 Comportamientos | Mensaje preescrito al círculo de confianza; movimiento mínimo (caminar al baño) |\n| 🏠 Entorno | Acostarte en el lugar más confortable de la casa; bajar luces; manta |\n| 🫀 Fisiología | Agua; comer algo simple; respiración 4-7-8 |\n\n**Las estrategias de supervivencia son las que tenés listas de antemano**, porque en Storm no podés diseñar nada — solo ejecutar.", "notes": null},
    {"kicker": "Diapositiva 13 · Para Rain", "title": "Estrategias de Afrontamiento", "body": "**Criterios:**\n- Te permiten **sostener funcionalidad**\n- **Previenen** que caigas a Storm\n- **Conservan energía** — no te queman\n\n**Ejemplos por frente:**\n\n| Frente | Estrategia de afrontamiento |\n|--------|----------------------------|\n| 🧠 Pensamientos | Journaling estructurado; cuestionar el pensamiento (*¿es real?*) |\n| 💔 Emociones | Validación emocional (*es válido sentir esto*); compartir con persona segura |\n| 🚶 Comportamientos | Una tarea por día (no más); rutinas mínimas; decir no a lo no esencial |\n| 🏠 Entorno | Orden mínimo (10 min de limpieza); reducir estímulos tóxicos |\n| 🫀 Fisiología | Sueño protegido; hidratación; nutrición funcional; caminata corta |\n\n**La clave en Rain es:** menos exigencia, más sostenibilidad. No es momento de ambiciones — es momento de no caer.", "notes": null},
    {"kicker": "Diapositiva 14 · Para Cloud", "title": "Estrategias de Sanación", "body": "**Criterios:**\n- Trabajan **causas profundas** de la depresión\n- Construyen **prevención** de recaída\n- Requieren **energía sostenida** (por eso solo se hacen en Cloud)\n\n**Ejemplos por frente:**\n\n| Frente | Estrategia de sanación |\n|--------|------------------------|\n| 🧠 Pensamientos | Reestructuración cognitiva con terapeuta; trabajo con creencias profundas |\n| 💔 Emociones | Procesamiento de duelo / trauma; trabajo de auto-compasión profundo |\n| 🚶 Comportamientos | Ejercicio regular; mindfulness; activación conductual; hábitos sostenidos |\n| 🏠 Entorno | Cambios estructurales (cambiar trabajo tóxico, alejarte de relaciones dañinas) |\n| 🫀 Fisiología | Ajuste de medicación con psiquiatra; rutina de sueño estable; nutrición integral |\n\n**Cloud es la zona donde realmente recuperás terreno.** Storm es sobrevivir. Rain es no caer. Cloud es subir.", "notes": null},
    {"kicker": "Diapositiva 15 · Lo que mata el sistema", "title": "La trampa más común — saltarse zonas", "body": "| Error | Qué pasa |\n|-------|----------|\n| Estar en Storm y querer hacer estrategias de Cloud | Te frustrás, te culpás, caés más profundo |\n| Estar en Rain y forzar productividad como en Sun | Quemás reservas, caés a Storm |\n| Estar en Cloud y bajar la guardia (*ya estoy bien*) | Sin mantenimiento, volvés a Rain o Storm |\n| Estar en Sun y olvidar el mapa | Recaída sin haber preparado prevención |\n\n**La sabiduría está en:** reconocer tu zona AHORA y aplicar SOLO las estrategias de esa zona.", "notes": null},
    {"kicker": "Diapositiva 16 · El profesional", "title": "El rol de la terapia", "body": "La terapia (especialmente CBT, ACT, DBT) trabaja principalmente en **Cloud Zone** — es donde tenés capacidad para hacer trabajo profundo.\n\n**Esto explica algo importante:** si vas a terapia en Storm sin estrategias de supervivencia paralelas, sentís que *la terapia no funciona*. No es que la terapia no funcione — es que la zona equivocada para esa intervención.\n\n**La integración óptima:**\n\n| Zona | Foco | Rol del terapeuta |\n|------|------|-------------------|\n| ⛈️ Storm | Supervivencia | Contención, ajuste medicación, validación |\n| 🌧️ Rain | Afrontamiento | Herramientas prácticas, estructura |\n| ☁️ Cloud | Sanación | Trabajo profundo, reestructuración, raíces |\n| ☀️ Sun | Mantenimiento | Prevención, integración, cierre |", "notes": null},
    {"kicker": "Diapositiva 17 · El frente 5", "title": "El rol de la medicación", "body": "La medicación trabaja en el frente 5 (fisiología). Cuando funciona:\n- Reduce intensidad de síntomas\n- Hace más estables las transiciones entre zonas\n- Da espacio para que las otras estrategias funcionen\n\n**Pero la medicación sola:**\n- No cambia tus pensamientos automáticos\n- No te enseña a regular emociones\n- No modifica tus comportamientos de autosabotaje\n- No arregla un entorno tóxico\n\nPor eso, **medicar sin trabajar los otros 4 frentes deja gran parte del trabajo sin hacer**.\n\n**Esto NO significa abandonar medicación.** Significa: medicación + trabajo en los otros 4 frentes = recuperación real.", "notes": null},
    {"kicker": "Diapositiva 18 · No estás sola", "title": "El círculo de confianza", "body": "Una pieza crítica: **necesitás aliados informados**.\n\nPersonas que:\n- Saben que tenés un sistema\n- Conocen tus señales por zona\n- Saben qué pedirte / qué darte en cada zona\n- Tienen los mensajes preescritos que les vas a mandar\n\n**En Storm:** estas personas son tu línea de vida. No las activás *cuando podés* — tenés que tenerlas activadas de antemano.", "notes": null},
    {"kicker": "Diapositiva 19 · La medida real", "title": "El sistema no es perfecto — es trazabilidad", "body": "Vas a fallar. Vas a aplicar Cloud strategies en Storm. Vas a olvidar el sistema. Vas a recaer.\n\n**El sistema no se rompe por eso.** Se rompe cuando dejás de registrar lo que pasó.\n\n| Sin sistema | Con sistema |\n|-------------|-------------|\n| Recaída sin explicación | Recaída con datos del antes |\n| Mismo patrón de espiral | Veo el espiral, lo interrumpo antes |\n| Me culpo por recaer | Observo qué disparó y ajusto |\n| Cada recaída duele igual | Cada recaída deja aprendizaje |", "notes": null},
    {"kicker": "Diapositiva 20 · Cierre", "title": "5 ideas para llevarte", "body": "1. **La depresión tiene 5 frentes, no uno.** Medicar solo trata el frente 5\n2. **Los 5 frentes se alimentan entre sí.** Atacando varios en simultáneo, el espiral se revierte\n3. **No estás siempre en la misma zona.** Reconocer la zona AHORA es lo que cambia todo\n4. **Las estrategias correctas en la zona equivocada no funcionan.** La sabiduría es zona+estrategia\n5. **El mapa no cura.** Pero te dice qué hacer en cada momento — y eso te ahorra años\n\n> **No vas a salir de este taller curada. Vas a salir con el mapa que te va a guiar mientras avanzás hacia la recuperación.**", "notes": null}
  ]
}
$apr$::jsonb
FROM workshops WHERE slug = 'mapa-recuperacion-depresion';

-- TALLER
INSERT INTO sections (workshop_id, type, section_order, content_json)
SELECT id, 'taller', 3,
$taller$
{
  "type": "taller",
  "title": "Construí tus 3 kits y tu plan de 30 días",
  "instructions": "Tenés **10 ejercicios** ordenados como una secuencia que sí podés terminar.\n\n**Ejercicios 1-2**: auto-diagnóstico — tu mapa personal de los 5 frentes y tu espiral descendente típico.\n\n**Ejercicio 3**: tu sistema de zonas — qué señales tuyas indican Storm, Rain, Cloud o Sun.\n\n**Ejercicios 4-6**: los 3 kits operativos — Supervivencia (Storm), Afrontamiento (Rain), Sanación (Cloud).\n\n**Ejercicios 7-8**: activar el sistema en el mundo — círculo de confianza informado + registro diario simple.\n\n**Ejercicios 9-10**: el compromiso — 30 días firmados + comunicación con tu profesional de salud.\n\n**Reglas del taller:**\n- Hacelos en orden. Cada uno depende del anterior\n- **No los hagas en estado Storm** — esperá a estar en Rain o Cloud\n- Especificá. Las descripciones genéricas no te van a servir cuando las necesites\n- Si algún ejercicio te activa fuerte emocionalmente, parálo y volvé mañana\n- Si aparece ideación suicida en cualquier momento → **línea de crisis + atención profesional** antes de seguir",
  "placeholder": "Si no ves los ejercicios todavía, recargá la página."
}
$taller$::jsonb
FROM workshops WHERE slug = 'mapa-recuperacion-depresion';

-- INSTALACIÓN
INSERT INTO sections (workshop_id, type, section_order, content_json)
SELECT id, 'instalacion', 4,
$inst$
{
  "type": "instalacion",
  "title": "Setup del sistema",
  "steps": [
    {"order": 1, "title": "Materiales físicos", "description": "**Recomendación firme:** papel para los primeros 30 días. La depresión hace pésima compañía con notificaciones de apps.\n\n- **Libreta exclusiva** para este sistema (no la mezcles con trabajo)\n- **Bolígrafos:** azul para texto, rojo para Storm, amarillo para Rain\n- **Marcador o sticker** para señalar páginas críticas (kits, mensaje preescrito)\n- **Una hoja A4 con tu kit de Storm** pegada en lugar visible (puerta del baño, refrigerador) — porque en Storm no vas a poder buscar la libreta", "code": "Libreta:    1 exclusiva\nBolígrafos: azul + rojo (Storm) + amarillo (Rain)\nMarcador:   páginas críticas\nKit Storm:  hoja A4 en lugar visible (NO en cajón)", "language": "bash"},
    {"order": 2, "title": "Recordatorios mínimos", "description": "Solo dos alarmas críticas:\n\n- **Matutina:** *¿En qué zona estoy hoy?*\n- **Nocturna:** *¿Registré el día?*\n\n**Apagá:** notificaciones de redes sociales antes de despertar. La amígdala ya está sensible — no le agregues estímulos.", "code": "08:00  Alarma — ¿En qué zona estoy hoy?\n22:00  Alarma — ¿Registré el día?\nOFF    Notificaciones de redes antes del despertar", "language": "bash"},
    {"order": 3, "title": "Setup digital (opcional, después del día 30)", "description": "Si pasados 30 días querés digital:\n\n**Notion** — workspace privado con:\n- Página de los 5 frentes\n- Página de zonas\n- 3 páginas de kits\n- Base de datos del registro diario\n- Página de círculo de confianza\n\n**Obsidian** — vault dedicado con:\n- Daily notes con frontmatter `zone: storm/rain/cloud/sun`\n- Notas separadas por kit\n- Dataview para revisar patrones", "code": "---\nfecha: 2026-XX-XX\nzone: storm | rain | cloud | sun\nemocion_principal: \nhoras_sueno: \nkit_activado: supervivencia | afrontamiento | sanacion | ninguno\n---", "language": "yaml"},
    {"order": 4, "title": "Seguridad de tus datos", "description": "**Es información profundamente personal.** Tratala como datos médicos.\n\n| Si guardás en... | Recomendación |\n|------------------|---------------|\n| Papel | Cajón privado, no a la vista |\n| Notion | Workspace privado + 2FA + no compartir |\n| Obsidian | Local + sync encriptado |\n| Apps en celular | Carpeta con password + 2FA en cuenta |", "code": "Papel:    cajón privado\nNotion:   workspace privado + 2FA\nObsidian: local + sync encriptado\nApps:     carpeta con password + 2FA", "language": "bash"},
    {"order": 5, "title": "Activar tu círculo de confianza", "description": "1. Hacé las 2-4 conversaciones del Ejercicio 7\n2. Por cada persona:\n   - Guardá el contacto con etiqueta visible (ej: 🆘 Círculo - María)\n   - Anotá su rol\n   - Tu mensaje preescrito de Storm guardado como borrador con su nombre en WhatsApp", "code": "Contacto: 🆘 Círculo - [Nombre]\nRol:      qué le pido en cada zona\nMensaje:  borrador listo en WhatsApp", "language": "bash"},
    {"order": 6, "title": "Coordinación con tratamiento profesional", "description": "**Si tenés terapeuta:**\n- Llevá las páginas clave a la próxima sesión\n- Pedile feedback al sistema\n- Pedile que sea parte del círculo de confianza si así lo decidís\n\n**Si no tenés terapeuta:**\n- Buscá uno (especializado en CBT, ACT o DBT idealmente)\n- Pedile recomendación a tu médico de cabecera\n- Apps confiables para buscar: Doctoralia, Psicología en Línea\n\n**Si no podés costear terapeuta:**\n- Programas públicos del país\n- Universidades con consultorios psicológicos a bajo costo\n- Líneas comunitarias\n- Apps con tarifa accesible (BetterHelp, Therapyland) con disclaimer: no es igual que terapia presencial", "code": "Con terapeuta:  llevar páginas a próxima sesión\nSin terapeuta:  buscar CBT / ACT / DBT\nSin recursos:   programas públicos + universidades", "language": "bash"},
    {"order": 7, "title": "Línea de crisis siempre cargada", "description": "En tu celular, guardá como contacto:\n\n🆘 **Crisis - [tu país]** [número]\n\n**Si en algún momento del taller o después aparece ideación suicida:**\n- **Llamá** inmediatamente\n- **Activá** tu círculo de confianza\n- **Buscá** atención profesional ese día\n\n**Líneas:**\n\n| País | Línea |\n|------|-------|\n| Colombia | 192 op. 4 / Medellín 123 op. 4 / Bogotá 106 |\n| Argentina | 135 / (011) 5275-1135 |\n| México | 800-290-0024 |\n| España | 024 |\n| Internacional | [findahelpline.com](https://findahelpline.com) |", "code": "🆘 Crisis - Colombia: 192 op. 4\n🆘 Crisis - Medellín: 123 op. 4\n🆘 Crisis - Bogotá:   106\n🆘 Crisis - Argentina: 135\n🆘 Crisis - México:   800-290-0024\n🆘 Crisis - España:   024", "language": "bash"},
    {"order": 8, "title": "Verificación final antes del día 1", "description": "Antes de arrancar mañana, asegurate de tener:\n\n- [ ] Libreta dedicada y lugar fijo\n- [ ] Bolígrafos de colores\n- [ ] Mapa de 5 frentes escrito (Ejercicio 1)\n- [ ] Espiral descendente personal mapeado (Ejercicio 2)\n- [ ] Señales por zona definidas (Ejercicio 3)\n- [ ] Kit de Storm escrito y en lugar visible (Ejercicio 4)\n- [ ] Kit de Rain diseñado (Ejercicio 5)\n- [ ] Kit de Cloud diseñado (Ejercicio 6)\n- [ ] Círculo de confianza activado (mínimo 2 personas, Ejercicio 7)\n- [ ] Mensaje preescrito de Storm guardado en WhatsApp\n- [ ] Tratamiento profesional al tanto (o cita agendada, Ejercicio 10)\n- [ ] Registro diario simple listo (Ejercicio 8)\n- [ ] Alarmas matutina y nocturna configuradas\n- [ ] Línea de crisis guardada\n- [ ] Compromiso de 30 días firmado (Ejercicio 9)\n\nSi todo ✅, **mañana arrancás**. Si está incompleto, dedicá 1 hora más antes de iniciar — el sistema funciona solo si está completo.", "code": "Checklist completa → mañana arrancás el flujo diario\n(si falta algo, dedicar 1 hora más antes de iniciar)", "language": "bash"}
  ],
  "success_message": "Listo — el mapa está armado y el sistema en su lugar. Mañana arrancás el flujo diario. Recordá: el objetivo no es estar siempre en Sun. Es saber qué hacer en cada zona y tener trazabilidad. Si fallás un día, no abandones — volvés al siguiente. Y si en algún momento aparece ideación suicida, la línea de crisis y atención profesional van primero."
}
$inst$::jsonb
FROM workshops WHERE slug = 'mapa-recuperacion-depresion';

-- GLOSARIO
INSERT INTO sections (workshop_id, type, section_order, content_json)
SELECT id, 'glosario', 5,
$glo$
{"type": "glosario", "title": "Glosario del taller", "search_placeholder": "Buscá un término (ej: Storm, CBT, espiral, rumiación)..."}
$glo$::jsonb
FROM workshops WHERE slug = 'mapa-recuperacion-depresion';

-- ============================================================
-- 4) EJERCICIOS (10)
-- ============================================================

-- EJ 1
INSERT INTO exercises (workshop_id, title, objective, prompt_text, "order")
SELECT id, 'Tu mapa personal de los 5 frentes', 'Describir cómo se manifiesta CADA frente en TU experiencia específica.',
$ej1$
**Materiales:** libreta + lápiz.

Por cada frente, respondé:

### 🧠 Frente 1 — Pensamientos
- Los 5 pensamientos negativos más frecuentes que tengo: __________
- Frecuencia con que aparecen (continua / diaria / semanal): __________
- Qué tan cerca están de creencias (1-10): __________

### 💔 Frente 2 — Emociones
- Las 5 emociones más presentes en mi depresión: __________
- Cuál es la más intensa: __________
- ¿Hay alguna que se me dificulta nombrar?: __________

### 🚶 Frente 3 — Comportamientos
- Lo que dejo de hacer cuando estoy deprimida: __________
- Lo que empiezo a hacer (autosabotaje, evasión): __________
- Aislamiento social — escala 1-10: __________

### 🏠 Frente 4 — Entorno
- Cómo se ve mi espacio físico: __________
- Qué relaciones se erosionaron: __________
- Trabajo / finanzas afectadas: __________
- ¿Hay un entorno específico tóxico que contribuye?: __________

### 🫀 Frente 5 — Fisiología
- Sueño (insomnio o exceso): __________
- Energía: __________
- Apetito: __________
- Dolores corporales: __________
- ¿Estoy medicada actualmente?: sí / no

**Criterio de hecho:** las 5 páginas están llenas con TU experiencia específica, no descripciones genéricas.
$ej1$, 1
FROM workshops WHERE slug = 'mapa-recuperacion-depresion';

-- EJ 2
INSERT INTO exercises (workshop_id, title, objective, prompt_text, "order")
SELECT id, 'Tu espiral descendente personal', 'Mapear cómo tus 5 frentes se alimentan entre sí.',
$ej2$
**Pasos:**

1. Identificá una situación reciente donde cayó tu estado
2. Dibujá el espiral siguiendo qué frente disparó qué otro

```
Mi espiral típico:

[Disparador inicial / frente]
        ↓
[Lo que se activó después]
        ↓
[Y después]
        ↓
[Y después]
        ↓
[Punto donde quedé]
```

**Reflexión:**
- ¿En qué punto de ese espiral pude haberlo interrumpido?
- ¿Qué frente fue el más fácil de identificar?
- ¿Cuál se me escapó hasta que era tarde?

**Criterio de hecho:** tenés un espiral concreto dibujado y al menos 1 punto identificado donde podrías haberlo interrumpido.
$ej2$, 2
FROM workshops WHERE slug = 'mapa-recuperacion-depresion';

-- EJ 3
INSERT INTO exercises (workshop_id, title, objective, prompt_text, "order")
SELECT id, 'Tu sistema de zonas — señales específicas', 'Definir TUS señales específicas para cada zona.',
$ej3$
Para cada zona, completá:

### ⛈️ STORM ZONE — mis señales
- Pensamientos típicos: __________
- Cómo se siente mi cuerpo: __________
- Qué dejo de hacer: __________
- Cómo respondo a la gente: __________
- Mi frase típica: __________

### 🌧️ RAIN ZONE — mis señales
- Pensamientos típicos: __________
- Cómo se siente mi cuerpo: __________
- Qué hago con esfuerzo: __________
- Cómo respondo a la gente: __________
- Mi frase típica: __________

### ☁️ CLOUD ZONE — mis señales
- Pensamientos típicos: __________
- Cómo se siente mi cuerpo: __________
- Qué puedo retomar: __________
- Cómo respondo a la gente: __________
- Mi frase típica: __________

### ☀️ SUN ZONE — mis señales
- Cómo se siente: __________
- Riesgo que tengo en esta zona: __________

**Criterio de hecho:** podés reconocer en qué zona estás **antes** de que escale o caiga. Si las descripciones son genéricas, no te van a servir.
$ej3$, 3
FROM workshops WHERE slug = 'mapa-recuperacion-depresion';

-- EJ 4
INSERT INTO exercises (workshop_id, title, objective, prompt_text, "order")
SELECT id, 'Tu kit de Supervivencia (Storm Zone)', 'Preparar lo que vas a usar cuando ya no podés diseñar nada.',
$ej4$
**Diseñá ahora — porque en Storm no vas a poder.**

Por cada frente, lista 2-3 estrategias de supervivencia (rápidas, simples, energía mínima):

### 🧠 Pensamientos en Storm — qué hago
1.
2.
3.

### 💔 Emociones en Storm — qué hago
1.
2.
3.

### 🚶 Comportamientos en Storm — qué hago
1.
2.
3.

### 🏠 Entorno en Storm — qué hago
1.
2.
3.

### 🫀 Fisiología en Storm — qué hago
1.
2.
3.

### Mensaje preescrito para mi círculo en Storm

> *Estoy en Storm. No necesito que me soluciones nada. Lo que necesito es: ____________*

### Lista de frases ancla para Storm

*(escribilas ahora — las vas a releer en Storm)*

1.
2.
3.

**Criterio de hecho:** tu kit está listo en una sola hoja accesible (foto en celular, hoja pegada en heladera). Si tenés que buscarla en Storm, no la vas a usar.
$ej4$, 4
FROM workshops WHERE slug = 'mapa-recuperacion-depresion';

-- EJ 5
INSERT INTO exercises (workshop_id, title, objective, prompt_text, "order")
SELECT id, 'Tu kit de Afrontamiento (Rain Zone)', 'Sostener funcionalidad sin quemarte.',
$ej5$
Por cada frente, lista 2-3 estrategias de afrontamiento:

### 🧠 Pensamientos en Rain — qué hago
1.
2.
3.

### 💔 Emociones en Rain — qué hago
1.
2.
3.

### 🚶 Comportamientos en Rain — qué hago
1.
2.
3.

### 🏠 Entorno en Rain — qué hago
1.
2.
3.

### 🫀 Fisiología en Rain — qué hago
1.
2.
3.

### Mis 3 reglas de Rain

1. Una sola tarea importante por día
2. ___________
3. ___________

**Criterio de hecho:** sabés exactamente qué reducir y qué sostener cuando estás en Rain. Tu kit es realista para tu vida.
$ej5$, 5
FROM workshops WHERE slug = 'mapa-recuperacion-depresion';

-- EJ 6
INSERT INTO exercises (workshop_id, title, objective, prompt_text, "order")
SELECT id, 'Tu kit de Sanación (Cloud Zone)', 'Aprovechar las ventanas de Cloud para hacer trabajo real.',
$ej6$
Por cada frente, lista 2-3 estrategias de sanación:

### 🧠 Pensamientos en Cloud — qué trabajo
1.
2.
3.

### 💔 Emociones en Cloud — qué proceso
1.
2.
3.

### 🚶 Comportamientos en Cloud — qué construyo
1.
2.
3.

### 🏠 Entorno en Cloud — qué cambio
1.
2.
3.

### 🫀 Fisiología en Cloud — qué consolido
1.
2.
3.

### Mi trabajo más importante para hacer en Cloud

__________________________________

*(esto es lo que vas a priorizar cada vez que entrés en Cloud)*

**Criterio de hecho:** sabés qué hacer cuando tenés energía. La próxima ventana de Cloud no se te pasa improductiva.
$ej6$, 6
FROM workshops WHERE slug = 'mapa-recuperacion-depresion';

-- EJ 7
INSERT INTO exercises (workshop_id, title, objective, prompt_text, "order")
SELECT id, 'Tu círculo de confianza informado', 'Convertir personas cercanas en aliados informados.',
$ej7$
Elegí 2-4 personas para tener esta conversación:

```
Estoy trabajando con un sistema basado en CBT para gestionar mi depresión.
Quiero hacerte parte para que sepas cómo apoyarme.

Tengo 4 zonas según severidad: Storm (severa), Rain (moderada),
Cloud (leve), Sun (estable).

Cuando te diga "estoy en Storm" necesito que:
[mensajes específicos que vos definas — ej: solo me escuches,
me traigas comida, te quedes en silencio, llames a mi terapeuta si lo necesito]

Cuando te diga "estoy en Rain" necesito que:
[ej: me bajes la exigencia, no me pidas mucho]

Cuando estoy en Cloud o Sun:
[ej: podemos hablar normal, hacer planes, etc.]

¿Tenés preguntas? ¿Algo te incomoda?
```

Por cada persona del círculo, anotá:
- **Nombre:** __________
- **Su rol específico en mi sistema:** __________
- **Cómo me contacto con ella en cada zona:** __________

**Criterio de hecho:** al menos 2 personas ya tuvieron la conversación y entendieron. Tu mensaje preescrito de Storm está guardado en borradores de WhatsApp con los contactos elegidos.
$ej7$, 7
FROM workshops WHERE slug = 'mapa-recuperacion-depresion';

-- EJ 8
INSERT INTO exercises (workshop_id, title, objective, prompt_text, "order")
SELECT id, 'Tu registro diario simple', 'Llevar trazabilidad mínima viable.',
$ej8$
Diseñá tu registro diario (nivel mínimo, 1 minuto):

```
FECHA:
ZONA HOY: ⛈️ / 🌧️ / ☁️ / ☀️
EMOCIÓN PRINCIPAL:
HORAS DE SUEÑO:
KIT ACTIVADO HOY: supervivencia / afrontamiento / sanación / ninguno
```

**Recordatorio matutino:** alarma a la hora habitual con texto *¿En qué zona estoy?*

**Recordatorio nocturno:** alarma con texto *¿Anoté el día?*

**Criterio de hecho:** la plantilla está en tu libreta o app. Mañana arrancás.
$ej8$, 8
FROM workshops WHERE slug = 'mapa-recuperacion-depresion';

-- EJ 9
INSERT INTO exercises (workshop_id, title, objective, prompt_text, "order")
SELECT id, 'Tu compromiso de 30 días', 'Convertir el sistema en hábito antes de que se enfríe.',
$ej9$
```
COMPROMISO DE 30 DÍAS

Yo, ____________, me comprometo a:

- Registrar mi zona TODOS los días (nivel mínimo)
- Cuando esté en Storm, activar mi kit de supervivencia (no improvisar)
- Cuando esté en Rain, aplicar mis 3 reglas
- Cuando esté en Cloud, hacer mi trabajo más importante
- Asistir a los 4 check-ins grupales (o ver grabaciones)
- Mantener mi tratamiento profesional activo

AL DÍA 30 voy a revisar:
- En qué zonas estuve y cuántos días
- Qué kit funcionó y cuál ajustar
- Qué patrones aparecieron
- Qué necesito agregar al sistema

Si fallo un día, no abandono. Vuelvo al día siguiente.

Firma: ____________
Fecha: ____________
```

**Criterio de hecho:** firmado y en lugar visible.
$ej9$, 9
FROM workshops WHERE slug = 'mapa-recuperacion-depresion';

-- EJ 10
INSERT INTO exercises (workshop_id, title, objective, prompt_text, "order")
SELECT id, 'Tu plan de comunicación con terapeuta / médico', 'Alinear el sistema con tu tratamiento profesional.',
$ej10$
**Pasos:**

1. Imprimí o mostrale a tu profesional las páginas clave del sistema:
   - Tu mapa de 5 frentes (Ejercicio 1)
   - Tus señales por zona (Ejercicio 3)
   - Tus kits (Ejercicios 4, 5, 6)

2. **Preguntas para hacerle:**
   - ¿Cómo encaja este sistema con mi tratamiento actual?
   - ¿Hay algún kit que ajustarías?
   - ¿Querés que te muestre el registro semanal en cada sesión?
   - ¿Qué señal de Storm es prioridad que me contactes inmediatamente?

3. Anotá las respuestas y ajustá el sistema.

**Si no tenés terapeuta:** este es el momento de buscar uno. El sistema funciona DRAMÁTICAMENTE mejor con apoyo clínico activo.

**Criterio de hecho:** o tenés profesional al tanto del sistema, o tenés agendada una cita para comentárselo.
$ej10$, 10
FROM workshops WHERE slug = 'mapa-recuperacion-depresion';

-- ============================================================
-- 5) GLOSARIO (33 términos)
-- ============================================================
INSERT INTO glossary_terms (workshop_id, term, definition, category)
SELECT w.id, t.term, t.definition, t.category FROM workshops w,
(VALUES
  -- Marco teórico
  ('CBT (Terapia Cognitivo-Conductual)', 'Enfoque terapéutico basado en evidencia que trabaja pensamientos, emociones y comportamientos.', 'marco-teorico'),
  ('The Depression Project', 'Organización que publicó el marco teórico base de este taller.', 'marco-teorico'),
  ('Reestructuración cognitiva', 'Técnica CBT para identificar y modificar pensamientos disfuncionales.', 'marco-teorico'),
  ('Activación conductual', 'Estrategia CBT de retomar actividades placenteras de forma gradual para mejorar el estado de ánimo.', 'marco-teorico'),
  ('Mindfulness', 'Práctica de atención plena al momento presente, útil en Cloud Zone.', 'marco-teorico'),
  ('Grounding', 'Técnicas para volver al presente vía sensaciones físicas.', 'marco-teorico'),
  -- Frentes
  ('Battlegrounds (Frentes de batalla)', 'Los 5 aspectos de la depresión: pensamientos, emociones, comportamientos, entorno, fisiología.', 'frentes'),
  ('Pensamientos automáticos', 'Pensamientos rápidos no conscientes que aparecen ante estímulos.', 'frentes'),
  ('Comportamientos depresivos', 'Patrones como aislamiento, autosabotaje, autodaño que la depresión induce.', 'frentes'),
  ('Entorno', 'Cuarto frente — espacio físico + relaciones + trabajo + finanzas.', 'frentes'),
  ('Fisiología', 'Quinto frente — química cerebral, sueño, energía, dolores.', 'frentes'),
  ('Espiral descendente', 'Patrón donde los 5 frentes se alimentan entre sí intensificando la depresión.', 'frentes'),
  -- Pensamientos disfuncionales
  ('Creencias profundas (core beliefs)', 'Pensamientos automáticos sobre vos misma muy arraigados (*no valgo*, *soy un fracaso*).', 'pensamientos'),
  ('Hopeless thoughts', 'Pensamientos sin esperanza, típicos de depresión severa.', 'pensamientos'),
  ('Rumiación', 'Patrón de pensamiento repetitivo sobre algo negativo del pasado.', 'pensamientos'),
  ('Worry thoughts', 'Pensamientos de preocupación catastrófica sobre el futuro.', 'pensamientos'),
  ('Worthless thoughts', 'Pensamientos sobre no valer nada — típicos de depresión severa.', 'pensamientos'),
  -- Zonas
  ('Storm Zone (⛈️)', 'Zona de síntomas severos — modo supervivencia.', 'zonas'),
  ('Rain Zone (🌧️)', 'Zona de síntomas moderados — funcionalidad con esfuerzo.', 'zonas'),
  ('Cloud Zone (☁️)', 'Zona de síntomas leves donde podés hacer trabajo de sanación profundo.', 'zonas'),
  ('Sun Zone (☀️)', 'Zona estable / recuperada — foco en mantenimiento y prevención.', 'zonas'),
  ('Storm-Sun Framework', 'Marco de 4 zonas según severidad de síntomas.', 'zonas'),
  ('Mapa de zonas', 'Sistema personalizado de identificar en qué zona estás según señales propias.', 'zonas'),
  -- Estrategias por categoría
  ('Supervivencia (Survival)', 'Estrategias para Storm Zone, rápidas y de mínima energía.', 'estrategias'),
  ('Afrontamiento (Coping)', 'Estrategias para sostener funcionalidad en Rain Zone sin quemarte.', 'estrategias'),
  ('Sanación (Healing)', 'Estrategias para Cloud Zone que trabajan causas profundas y previenen recaída.', 'estrategias'),
  -- Conceptos clínicos
  ('Depresión', 'Trastorno del ánimo caracterizado por múltiples síntomas en 5 frentes.', 'conceptos-clinicos'),
  ('Aislamiento social', 'Patrón de retirarse de relaciones, común en depresión.', 'conceptos-clinicos'),
  ('Antidepresivos', 'Medicamentos que trabajan el frente 5 (fisiología) de la depresión.', 'conceptos-clinicos'),
  ('Disparadores (triggers)', 'Estímulos que activan el espiral descendente.', 'conceptos-clinicos'),
  ('Ideación suicida', 'Pensamientos sobre quitarse la vida. Si aparecen, atención clínica inmediata.', 'conceptos-clinicos'),
  ('Validación emocional', 'Reconocer que una emoción tiene razón de ser, sin necesariamente actuar sobre ella.', 'conceptos-clinicos'),
  -- Ecosistema
  ('KAIA', 'Metodología de aprendizaje propia de Salazar Duke Impact Hub.', 'ecosistema')
) AS t(term, definition, category)
WHERE w.slug = 'mapa-recuperacion-depresion';

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
-- FROM workshops w WHERE slug = 'mapa-recuperacion-depresion';
--
-- Esperado: 5 secciones · 21 slides · 10 ejercicios · 33 términos
