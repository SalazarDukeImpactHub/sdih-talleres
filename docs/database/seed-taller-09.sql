-- ============================================================
-- TALLER 09 — Blockchain sin el hype: cuándo, cómo y para qué
-- ============================================================
-- Cómo usar este archivo:
-- Opción A (recomendada): abrir en TablePlus conectado a Supabase y correr todo de una.
-- Opción B: pegar entero en Supabase SQL Editor (web).
--
-- Es idempotente: el DELETE inicial limpia residuos de intentos previos.
-- Si todo va bien al final tenés: 1 workshop, 5 secciones (con 11 slides
-- de aprendizaje), 5 ejercicios + 5 pasos de instalación con prompts
-- listos para IA, y 25 términos de glosario.
-- ============================================================

-- 1) Cleanup defensivo
DELETE FROM workshops WHERE slug = 'blockchain-sin-hype-decision-framework';

-- 2) Workshop
INSERT INTO workshops (
  slug, title, description, instructor,
  date_live, duration_min, prerequisites, status,
  whatsapp_message_template
) VALUES (
  'blockchain-sin-hype-decision-framework',
  'Blockchain sin el hype: cuándo, cómo y para qué',
  'Hubo un momento en que nadie podía terminar una reunión sin mencionar blockchain. Hoy el péndulo se fue al otro extremo: tanto escepticismo como entusiasmo, ninguno bien fundamentado. Este taller no te vende blockchain. Tampoco te la descarta. Te da un marco de decisión — el mismo que usan los ejecutivos del Foro Económico Mundial (WEF) y los técnicos del BID — para que vos puedas responder honestamente: ¿tiene sentido blockchain para lo que estoy construyendo? Vas a aplicar el árbol de 11 preguntas del WEF a tu propio caso, conocer LACChain y casos reales de impacto social en LATAM, evaluar riesgos éticos, y salir con una posición clara: blockchain sí, blockchain no, o blockchain en 18 meses con estas condiciones. Al final no vas a saber programar contratos inteligentes. Pero sí vas a saber cuándo pedirle a alguien que los programe — y cuándo decirle que no.',
  'Jennifer Salazar Duque',
  NULL,
  360,
  'Para aprovechar al máximo: tener un proyecto, empresa o idea en mente — aunque sea en etapa de exploración; acceso a una herramienta de IA durante el taller (Claude, ChatGPT, Gemini — cualquiera); haber escuchado *blockchain* en contexto de tu sector y querer entender si te aplica. NO necesitás: saber programar; entender criptografía; tener un caso de uso definido de antemano (lo construimos durante el taller). Si sos consultor/a o asesor/a, los análisis de este taller los podés replicar con tus clientes — están diseñados para producir una evaluación concreta, no un documento genérico sobre *el futuro de blockchain*. Duración: 4h en vivo + 2h de trabajo autónomo.',
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
  "title": "Bienvenida — del hype a la decisión",
  "description": "## Hubo un momento\n\nNadie podía terminar una reunión sin mencionar blockchain.\n\nStartups, bancos, ONGs, gobiernos — todos querían *poner eso en blockchain*. La mayoría no sabía exactamente qué significaba. Solo sabía que sonaba importante, que prometía transparencia, que prometía eliminar intermediarios, que prometía cambiar todo.\n\nPasaron los años. Muchos proyectos fallaron. Otros prosperaron. Y hoy seguimos confundidos — pero de otra manera: ahora la palabra genera tanto escepticismo como entusiasmo, y **ninguno de los dos está bien fundamentado**.\n\n**Este taller no te vende blockchain. Tampoco te la descarta.**\n\nTe da un **marco de decisión** — el mismo que usan los ejecutivos del Foro Económico Mundial (WEF) y los técnicos del Banco Interamericano de Desarrollo (BID) — para que vos puedas responder honestamente: *¿tiene sentido blockchain para lo que estoy construyendo?*\n\nAl final de este taller **no vas a saber programar contratos inteligentes**. Pero sí vas a saber cuándo pedirle a alguien que los programe — y cuándo decirle que no.\n\n## Qué vas a salir teniendo\n\n1. Entender qué es blockchain y qué tipos existen — **sin jerga**, con ejemplos reales\n2. Poder aplicar el **árbol de decisión del WEF** para evaluar cualquier caso de uso\n3. Conocer casos reales en **América Latina** y en contextos de impacto social\n4. Entender los **principios éticos** que deben guiar cualquier implementación\n5. Un **análisis de caso** de tu propio proyecto completado durante el taller\n6. Una posición clara: **blockchain sí / blockchain no / blockchain en 18 meses con estas condiciones**\n\n## Una advertencia honesta\n\nHay dos tipos de talleres de blockchain.\n\nLos primeros te dicen que blockchain va a cambiar el mundo. Te muestran gráficos de adopción, casos de éxito, y terminás con entusiasmo pero sin saber qué hacer el lunes siguiente.\n\nLos segundos te dicen que blockchain es puro hype. Que ya pasó de moda, que solo sirve para Bitcoin, que es lento y costoso.\n\n**Este taller no es ninguno de los dos.**\n\nEs el taller que te da un marco de análisis para que **vos tomes la decisión** — con evidencia, con casos reales de América Latina, y con una IA que te ayuda a aplicarlo a tu contexto específico.",
  "quick_links": [
    {"label": "11 diapositivas — qué es, árbol WEF, LACChain", "target_section": "aprendizaje"},
    {"label": "5 ejercicios — análisis de tu caso con IA", "target_section": "taller"},
    {"label": "Herramientas para explorar sin programar", "target_section": "instalacion"},
    {"label": "Glosario", "target_section": "glosario"}
  ]
}
$inicio$::jsonb
FROM workshops WHERE slug = 'blockchain-sin-hype-decision-framework';

-- APRENDIZAJE (11 slides)
INSERT INTO sections (workshop_id, type, section_order, content_json)
SELECT id, 'aprendizaje', 2,
$apr$
{
  "type": "aprendizaje",
  "title": "El marco de análisis — WEF + casos reales + ética",
  "slides": [
    {"kicker": "Módulo 1 · Diapositiva 1", "title": "La pregunta correcta no es *qué es blockchain*", "body": "La pregunta correcta es:\n\n> **¿Qué problema resuelve blockchain que otras tecnologías no pueden resolver?**\n\nY la respuesta es una sola:\n\n> **Confianza entre partes que no se conocen o que no se fían entre sí, sin necesidad de un intermediario central.**\n\nEso es todo. Todo lo demás — los bloques, la cadena, los nodos, los contratos inteligentes — es el **mecanismo técnico** para lograr ese resultado.", "notes": null},
    {"kicker": "Módulo 1 · Diapositiva 2", "title": "La analogía del libro de registros compartido", "body": "Imaginá un cuaderno donde se anotan todas las transacciones de un negocio. Ese cuaderno normalmente lo tiene **una sola persona** — el banco, el notario, la plataforma digital, el gobierno. Vos confiás en lo que dice ese cuaderno porque confiás en quien lo custodia.\n\nAhora imaginá que ese mismo cuaderno existe en **miles de copias simultáneas**, distribuidas en computadoras de distintas personas alrededor del mundo.\n\n- Cada vez que alguien quiere anotar una nueva transacción, **la mayoría de las copias tienen que estar de acuerdo**\n- Una vez que la anotación se hace, **no puede borrarse ni modificarse** sin que todas las copias lo rechacen\n\n> **Eso es blockchain. Un cuaderno que nadie controla individualmente, pero que todos pueden verificar.**", "notes": null},
    {"kicker": "Módulo 1 · Diapositiva 3", "title": "Los 3 tipos de blockchain que necesitás conocer", "body": "El Foro Económico Mundial identifica **3 categorías principales**:\n\n### 1. Blockchain pública sin permisos (Permissionless Public)\n- **Ejemplos:** Bitcoin, Ethereum\n- **Quién participa:** cualquier persona en el mundo\n- **Para qué sirve:** criptomonedas, aplicaciones descentralizadas\n- **Ventaja:** máxima descentralización, censura imposible\n- **Desventaja:** lenta, cara en alta demanda, sin control regulatorio\n\n### 2. Blockchain pública con permisos (Permissioned Public)\n- **Ejemplos:** LACChain (América Latina), redes gubernamentales\n- **Quién participa:** cualquiera puede leer; solo organizaciones autorizadas pueden escribir\n- **Para qué sirve:** diplomas universitarios, trazabilidad de alimentos, identidad digital, salud pública\n- **Ventaja:** auditabilidad pública + control de calidad en quien escribe\n- **Desventaja:** requiere una entidad de gobernanza confiable\n\n### 3. Blockchain privada con permisos (Permissioned Private)\n- **Ejemplos:** redes internas de bancos, consorcios de empresas\n- **Quién participa:** solo organizaciones específicas invitadas\n- **Para qué sirve:** finanzas interbanciarias, cadenas de suministro entre empresas aliadas\n- **Ventaja:** velocidad alta, control total, cumplimiento regulatorio sencillo\n- **Desventaja:** si la red la controla una sola empresa, ¿para qué necesitás blockchain?", "notes": null},
    {"kicker": "Módulo 1 · Diapositiva 4", "title": "La distinción más importante", "body": "El WEF hace una distinción fundamental que mucha gente no conoce:\n\n| Tipo de intercambio | Tecnología adecuada |\n|---------------------|---------------------|\n| **Intercambio de información** | Bases de datos compartidas. Más rápidas, más baratas, más fáciles de administrar. **Blockchain es excesivo** |\n| **Intercambio de valor** | Cuando mover un activo de A a B requiere que A lo pierda y B lo gane, **simultáneamente y sin intermediario**. Acá **blockchain tiene sentido** |\n\n**Un ejemplo:**\n\n- Si querés compartir el historial médico de un paciente entre hospitales → una base de datos compartida con buenas políticas de acceso hace el trabajo\n- Si querés transferir la propiedad de un inmueble entre dos personas que no se conocen, sin notario, con trazabilidad permanente → ahí blockchain cobra sentido", "notes": null},
    {"kicker": "Módulo 2 · Diapositiva 5", "title": "El árbol de decisión del WEF", "body": "Este árbol de **11 preguntas** viene del documento *Blockchain Beyond the Hype* del Foro Económico Mundial (2018). Fue diseñado para que ejecutivos sin conocimiento técnico puedan evaluar honestamente si blockchain es la herramienta correcta.\n\n**Reglas del árbol:**\n- Las preguntas se responden **en orden**\n- Un **NO** en cualquiera significa que probablemente no necesitás blockchain\n- Un **DEPENDE** es signo de que falta clarificar el caso de uso\n\n> **El objetivo no es demostrar que blockchain sirve. Es descubrir honestamente si sirve para tu problema específico.**", "notes": null},
    {"kicker": "Módulo 2 · Diapositiva 6", "title": "Las 11 preguntas — parte 1 (A-F)", "body": "**A. ¿Hay múltiples partes que necesitan escribir en el mismo registro de datos?**\nSi sos la única parte que escribe → base de datos convencional.\n\n**B. ¿Las partes que escriben se desconfían entre sí o no tienen relación establecida?**\nSi ya se conocen y se fían → un acuerdo contractual con DB central es más barato.\n\n**C. ¿Necesitás un registro permanente e inmutable?**\nSi el dato puede modificarse legalmente (correcciones, actualizaciones), la inmutabilidad complica.\n\n**D. ¿Las transacciones involucran activos digitales o representaciones digitales de activos físicos?**\nBlockchain es ideal para tokens, certificados, derechos de propiedad. Para procesos operativos sin transferencia de valor, otras herramientas son más eficientes.\n\n**E. ¿La velocidad puede tolerar cierta latencia (segundos a minutos)?**\nLas blockchains públicas procesan menos transacciones/seg que sistemas bancarios. Si necesitás miles de tx/seg en tiempo real → limitación seria.\n\n**F. ¿Los datos a almacenar son pequeños en volumen?**\nBlockchain almacena referencias (hashes), no archivos. Para videos/PDFs → solución híbrida: archivo fuera, hash dentro.", "notes": null},
    {"kicker": "Módulo 2 · Diapositiva 7", "title": "Las 11 preguntas — parte 2 (G-K)", "body": "**G. ¿Podés identificar a las partes de confianza que validarán las transacciones?**\nPara blockchains con permisos, necesitás definir quién valida. Si no podés responderlo → diseño de gobernanza incompleto.\n\n**H. ¿Las relaciones contractuales son suficientemente simples como para codificarse?**\nLos contratos inteligentes son código. Buenos para reglas claras (*si A paga X, B transfiere Y*). Malos para ambigüedades o condiciones que dependen de contexto humano.\n\n**I. ¿Las partes comparten acceso de escritura al mismo dato?**\nSi cada parte escribe en su propio silo y solo comparte resultados → blockchain agrega complejidad sin resolver.\n\n**J. ¿Necesitás que el sistema funcione aunque una parte salga o sea eliminada?**\nResiliencia. Si un actor clave puede desaparecer y el sistema debe seguir → descentralización es ventaja real.\n\n**K. ¿Las transacciones son públicamente auditables o solo verificables por partes autorizadas?**\nAuditabilidad total → pública. Verificación restringida → privada con permisos.", "notes": null},
    {"kicker": "Módulo 2 · Diapositiva 8", "title": "Resultado del árbol", "body": "| Resultado | Qué hacer |\n|-----------|-----------|\n| **Sí a todas o la mayoría** | Blockchain probablemente tiene sentido — evaluar qué tipo |\n| **NO en A o B** | Usá una base de datos convencional |\n| **NO en C o D** | Evaluá sistemas de gestión documental o APIs compartidas |\n| **NO en E** | Explorá soluciones off-chain con anclaje periódico a blockchain |\n| **Dudas en H o J** | Empezá con un piloto controlado antes de comprometer arquitectura |\n\n> **Un NO honesto vale más que un SÍ entusiasta.** El árbol no busca convencerte — busca evitar que gastes 18 meses en una arquitectura equivocada.", "notes": null},
    {"kicker": "Módulo 3 · Diapositiva 9", "title": "LACChain — la red que cambió el juego en la región", "body": "En 2019, el **BID Lab** (Banco Interamericano de Desarrollo) lanzó **LACChain** — una iniciativa para construir la infraestructura blockchain de América Latina como bien público.\n\nLACChain es una **blockchain pública con permisos**:\n- Cualquiera puede leer las transacciones\n- Solo organizaciones verificadas pueden escribir\n- Los nodos validadores son entidades reconocidas: universidades, bancos centrales, organismos públicos\n\n### Por qué importa para vos\n\n- Los proyectos que se conectan a LACChain **no necesitan construir su propia infraestructura blockchain**\n- LACChain ya cumple con regulaciones de datos de varios países de la región\n- Hay ecosistema de desarrolladores, alianzas institucionales y soporte del BID\n\n### Casos reales en la red\n\n- Certificados académicos verificables (universidades en Colombia, México, Argentina)\n- Trazabilidad de medicamentos en cadenas hospitalarias\n- Identidad digital soberana para personas sin documentos formales\n- Registros de propiedad de tierra en comunidades rurales", "notes": null},
    {"kicker": "Módulo 3 · Diapositiva 10", "title": "Casos de impacto social en la región", "body": "### Trazabilidad de cadena de suministro ético\nProductores de café y cacao en Colombia usan blockchain para que el comprador final en Europa pueda verificar que el producto viene de una finca específica, sin trabajo infantil, con certificación de origen. **Esto abre mercados premium** que de otra forma son inaccesibles.\n\n### Identidad para población vulnerable\nOrganizaciones como ID2020 y proyectos del BID usan blockchain para crear identidades digitales para personas desplazadas, apátridas o indocumentadas. La identidad queda registrada de forma inmutable y **el titular la controla** — no la institución.\n\n### Transparencia en donaciones y fondos sociales\nONGs que trabajan con fondos internacionales usan blockchain para que los donantes puedan rastrear exactamente a dónde fue cada peso. Esto **reduce la corrupción** y aumenta la confianza de los financiadores.\n\n### Derechos de propiedad intelectual para artistas\nMúsicos y artistas visuales en México y Colombia usan NFTs y blockchain para registrar la autoría de su obra y **recibir regalías automáticas** cuando el trabajo se usa comercialmente.", "notes": null},
    {"kicker": "Módulo 4 · Diapositiva 11", "title": "Las 5 preguntas éticas — antes de comprometerte", "body": "Antes de implementar blockchain en cualquier proyecto, hay **5 preguntas éticas** que debés poder responder:\n\n### 1. ¿Quién controla la gobernanza de la red?\nBlockchain descentraliza la escritura — pero alguien siempre define las reglas. Un proyecto responsable tiene **gobernanza documentada y distribuida desde el día uno**.\n\n### 2. ¿Qué datos estás poniendo en la cadena y quién los lee?\nSi ponés datos personales en la cadena, el **derecho al olvido** del GDPR o de la Ley 1581 de Colombia **no existe**. Datos personales fuera de la cadena, solo el hash dentro.\n\n### 3. ¿El diseño excluye a alguien?\nBlockchain requiere internet, dispositivo y conocimiento técnico. Para comunidades rurales, adultos mayores o personas sin smartphone, necesitás una **capa de intermediación** que no arruine la propuesta de valor.\n\n### 4. ¿Estás resolviendo un problema de confianza o de eficiencia?\nBlockchain es cara comparada con una base de datos bien diseñada. **Si el problema es eficiencia operativa, blockchain probablemente no es la herramienta.** Si es confianza entre partes sin relación previa, puede serlo.\n\n### 5. ¿Cuál es el plan de salida?\n¿Qué pasa si la red se abandona? ¿Si el proveedor cierra? Un proyecto responsable tiene **plan de migración o de lectura de datos** aunque la red original deje de existir.", "notes": null}
  ]
}
$apr$::jsonb
FROM workshops WHERE slug = 'blockchain-sin-hype-decision-framework';

-- TALLER
INSERT INTO sections (workshop_id, type, section_order, content_json)
SELECT id, 'taller', 3,
$taller$
{
  "type": "taller",
  "title": "5 ejercicios — análisis de tu caso con IA",
  "instructions": "Tenés **5 ejercicios** que producen un análisis completo de tu caso de uso. Cada uno tiene un **prompt listo para usar con cualquier IA** (Claude, ChatGPT, Gemini). El objetivo del taller no es que salgas con más información — es que salgas con **una decisión**. Incluso si esa decisión es *no es el momento*.\n\n**Ejercicio 1**: Mapeá tu caso de uso — articulá el problema antes de evaluar la tecnología.\n\n**Ejercicio 2**: Aplicá el árbol de decisión del WEF — las 11 preguntas a tu caso específico.\n\n**Ejercicio 3**: Buscá referentes reales en tu sector — casos en LATAM, LACChain, fracasos para aprender.\n\n**Ejercicio 4**: Analizá los riesgos éticos — gobernanza, privacidad, inclusión, proporcionalidad, plan de continuidad.\n\n**Ejercicio 5**: Tu posición final + próximos pasos — la conclusión en primera persona.\n\n**Reglas del taller:**\n- Hacelos en orden — cada uno alimenta al siguiente\n- Personalizá los prompts con datos REALES de tu proyecto antes de ejecutarlos\n- Si la IA te dice *blockchain sí*, **dudá** y revisá las preguntas que respondió con DEPENDE\n- Si la IA te dice *blockchain no*, **agradecé** — acabás de ahorrarte 18 meses\n- Si sos consultor/a, usá los prompts con tus clientes — están diseñados para eso",
  "placeholder": "Si no ves los ejercicios todavía, recargá la página."
}
$taller$::jsonb
FROM workshops WHERE slug = 'blockchain-sin-hype-decision-framework';

-- INSTALACIÓN
INSERT INTO sections (workshop_id, type, section_order, content_json)
SELECT id, 'instalacion', 4,
$inst$
{
  "type": "instalacion",
  "title": "Herramientas para explorar blockchain sin programar",
  "steps": [
    {"order": 1, "title": "Para entender cómo funciona una transacción", "description": "**Blockchain Demo** ([andersbrownworth.com/blockchain](https://andersbrownworth.com/blockchain))\n\n- Visualización interactiva de cómo se crean bloques, cómo se encadenan y qué pasa cuando se intenta modificar un dato\n- **No requiere cuenta ni instalación**\n- Usala durante el taller para ver en tiempo real qué significa *inmutabilidad*\n\nPaso a paso recomendado:\n1. Andá al sitio\n2. Tocá el primer bloque y cambiá un dígito del dato\n3. Mirá cómo todos los bloques siguientes se invalidan (color rojo)\n4. *Re-minean* cada bloque y ves el costo computacional de manipular la cadena", "code": "https://andersbrownworth.com/blockchain", "language": "bash"},
    {"order": 2, "title": "Para explorar transacciones reales en blockchains públicas", "description": "**Etherscan** ([etherscan.io](https://etherscan.io))\n- Explorador de la blockchain de Ethereum\n- Podés buscar cualquier dirección o transacción y ver su historial completo\n- No requiere cuenta\n\n**LACChain Explorer**\n- Para explorar transacciones en la red LACChain de América Latina\n- Disponible en el sitio oficial de LACChain ([lacchain.net](https://lacchain.net))\n\nQué probar:\n- Pegá una dirección pública conocida (ej. la wallet de una fundación o de Vitalik Buterin) y mirá todo su historial\n- Ves que cada transacción tiene fecha, monto, destinatario y un hash que la identifica\n- **No podés modificarla. Solo leerla.** Esa es la propiedad clave.", "code": "https://etherscan.io\nhttps://lacchain.net", "language": "bash"},
    {"order": 3, "title": "Para crear un certificado verificable sin programar", "description": "**Blockcerts** ([blockcerts.org](https://blockcerts.org))\n- Estándar abierto para crear certificados académicos y profesionales en blockchain\n- Existe una versión de escritorio para emitir certificados sin servidor propio\n- Compatible con múltiples blockchains\n\n**Certif-ID y proveedores regionales**\n- Buscar proveedores regionales que ofrezcan emisión de credenciales sobre LACChain\n- Algunos ya operan en Colombia, México y Argentina con universidades y entidades de capacitación\n\nCaso de uso típico: si tu organización emite diplomas, certificados de cursos o credenciales profesionales, blockchain te permite que el receptor pueda **verificar la autenticidad sin contactarte a vos**.", "code": "https://blockcerts.org\nhttps://lacchain.net  # para proveedores regionales", "language": "bash"},
    {"order": 4, "title": "Para prototipar un contrato inteligente simple", "description": "**Remix IDE** ([remix.ethereum.org](https://remix.ethereum.org))\n\n- Editor en el navegador para escribir y probar contratos inteligentes en **Solidity**\n- No requiere instalación\n- Tiene contratos de ejemplo que podés modificar\n- Podés desplegar en una red de prueba (testnet) sin gastar dinero real\n\n**⚠️ Nota:** Esto requiere **conocimiento técnico básico** — es el paso siguiente *después* de validar el caso de uso. **Si todavía no sabés si blockchain te sirve, no empieces por acá** — empezá por el árbol de decisión.\n\nSecuencia recomendada:\n1. Primero terminá los 5 ejercicios del taller\n2. Si tu análisis dice *blockchain sí*, recién ahí abrí Remix\n3. Antes de Remix → contactá a alguien con experiencia (LACChain Alliance, BID Lab, consultoras)", "code": "https://remix.ethereum.org\n// Empezá con SimpleStorage.sol (viene de ejemplo)", "language": "javascript"},
    {"order": 5, "title": "Para conectarte con el ecosistema LACChain + verificación final", "description": "**LACChain Alliance**\n- Red de organizaciones en América Latina que operan sobre la infraestructura LACChain\n- Punto de entrada para proyectos que quieren desplegar sobre la red sin construir infraestructura propia\n- Contacto inicial: [lacchain.net](https://lacchain.net)\n\n### Verificación final del taller\n\nAntes de dar el taller por completado, asegurate de tener:\n\n- [ ] Pudiste abrir Blockchain Demo y modificar un bloque para ver cómo se invalida la cadena\n- [ ] Pudiste abrir Etherscan y buscar una dirección para ver su historial\n- [ ] Tenés clara la diferencia entre los 3 tipos de blockchain y cuál correspondería a tu caso\n- [ ] Completaste los 5 ejercicios\n- [ ] Tenés una **posición escrita en primera persona** sobre tu caso de uso (Ej. 5)\n- [ ] Tenés al menos **3 próximos pasos concretos** definidos\n\nSi todo ✅, **el taller cumplió su objetivo**: tenés una decisión, no más información.", "code": "https://lacchain.net\n\n# Checklist final:\n# - Blockchain Demo: ✓\n# - Etherscan / LACChain Explorer: ✓\n# - 3 tipos de blockchain: claros\n# - 5 ejercicios: completos\n# - Posición + próximos pasos: escritos", "language": "bash"}
  ],
  "success_message": "El objetivo del taller no era convertirte en experta en blockchain. Era darte el marco para decidir honestamente. Si tu análisis dice SÍ, ya tenés 3 próximos pasos. Si dice NO, te ahorraste 18 meses. Si dice DEPENDE, sabés exactamente qué tenés que aclarar antes de decidir. Eso es lo que vale el taller."
}
$inst$::jsonb
FROM workshops WHERE slug = 'blockchain-sin-hype-decision-framework';

-- GLOSARIO
INSERT INTO sections (workshop_id, type, section_order, content_json)
SELECT id, 'glosario', 5,
$glo$
{"type": "glosario", "title": "Glosario del taller", "search_placeholder": "Buscá un término (ej: blockchain, hash, smart contract, LACChain)..."}
$glo$::jsonb
FROM workshops WHERE slug = 'blockchain-sin-hype-decision-framework';

-- ============================================================
-- 4) EJERCICIOS (5) — cada uno con un prompt listo para IA
-- ============================================================

-- EJ 1
INSERT INTO exercises (workshop_id, title, objective, prompt_text, "order")
SELECT id, 'Mapeá tu caso de uso', 'Identificar el problema específico que querés resolver y determinar si involucra las características clave de blockchain.',
$ej1$
**Contexto:** Antes de aplicar el árbol de decisión, necesitás articular con claridad **qué problema estás tratando de resolver** — no qué tecnología querés usar.

**Prompt para tu agente:**

```
Voy a describirte un problema o necesidad de mi organización/proyecto y quiero que me ayudes a analizarlo antes de evaluar si blockchain es una solución relevante.

Mi proyecto es: [describe en 3-4 oraciones qué hace tu organización o proyecto]

El problema específico que quiero resolver es: [describe el problema — qué falla hoy, con quién, por qué genera fricción]

Las partes involucradas son: [lista quiénes participan: proveedores, clientes, reguladores, beneficiarios, socios]

El tipo de información o activos que circulan son: [documentos, dinero, derechos de propiedad, certificaciones, datos de usuarios, etc.]

Con esta información:
1. Resumí el problema central en una sola oración
2. Identificá si hay un problema de CONFIANZA entre partes o un problema de EFICIENCIA operativa
3. Listá qué partes necesitan escribir en el mismo registro y si actualmente se fían entre sí
4. Señalá cualquier ambigüedad en mi descripción que necesite aclaración antes de seguir
```

**Criterio de hecho:** Tenés una descripción clara del problema, identificaste si hay múltiples partes escritoras y si existe un problema de confianza real.
$ej1$, 1
FROM workshops WHERE slug = 'blockchain-sin-hype-decision-framework';

-- EJ 2
INSERT INTO exercises (workshop_id, title, objective, prompt_text, "order")
SELECT id, 'Aplicá el árbol de decisión WEF', 'Responder las 11 preguntas del árbol de decisión del WEF aplicadas a tu caso específico.',
$ej2$
**Contexto:** El árbol de decisión es la herramienta más rigurosa disponible para evaluar si blockchain tiene sentido. **Un NO honesto es mejor que un SÍ entusiasta.**

**Prompt para tu agente:**

```
Voy a aplicar el árbol de decisión de blockchain del Foro Económico Mundial a mi caso de uso.

Mi caso de uso (del ejercicio anterior): [pegá el resumen del ejercicio 1]

Para cada pregunta del árbol, quiero que me ayudes a responder con SÍ, NO o DEPENDE — y que expliques brevemente el razonamiento para mi caso específico:

A. ¿Hay múltiples partes que necesitan escribir en el mismo registro?
B. ¿Esas partes se desconfían entre sí o no tienen relación establecida?
C. ¿Se necesita un registro permanente e inmutable?
D. ¿Las transacciones involucran activos digitales o representaciones de activos físicos?
E. ¿La velocidad puede tolerar latencia de segundos a minutos?
F. ¿El volumen de datos es pequeño (referencias y metadatos, no archivos grandes)?
G. ¿Se pueden identificar las partes de confianza que validarían transacciones?
H. ¿Las reglas contractuales son suficientemente simples para codificarse?
I. ¿Las partes comparten acceso de escritura al mismo dato base?
J. ¿Se necesita que el sistema funcione aunque una parte desaparezca?
K. ¿Las transacciones requieren auditabilidad pública o solo verificación restringida?

Al final, dame:
- Un puntaje de compatibilidad con blockchain (0-11)
- Una recomendación clara: blockchain sí / blockchain no / blockchain con estas condiciones
- Si la respuesta es sí, qué tipo de blockchain (pública sin permisos / pública con permisos / privada con permisos)
```

**Criterio de hecho:** Tenés las 11 preguntas respondidas con razonamiento específico a tu caso y una recomendación clara.
$ej2$, 2
FROM workshops WHERE slug = 'blockchain-sin-hype-decision-framework';

-- EJ 3
INSERT INTO exercises (workshop_id, title, objective, prompt_text, "order")
SELECT id, 'Buscá referentes reales en tu sector', 'Identificar si ya hay proyectos blockchain en tu sector o región que podés estudiar o con los que podés conectarte.',
$ej3$
**Contexto:** No necesitás reinventar la rueda. En muchos sectores ya hay implementaciones, redes (como LACChain) y **casos fallidos de los que aprender**.

**Prompt para tu agente:**

```
Mi proyecto está en el sector de [tu sector: salud, educación, cadena de suministro, identidad, finanzas, agricultura, arte, impacto social, etc.] y opera principalmente en [país/región].

Quiero que me ayudes a:

1. Listar los casos de uso de blockchain más relevantes en mi sector a nivel global y en América Latina
2. Identificar si LACChain u otras redes regionales tienen iniciativas activas en mi área
3. Describir 2-3 casos que hayan fracasado en mi sector y qué lección dejaron
4. Recomendarme con qué tipo de organización debería contactarme si quisiera explorar una implementación (academia, BID Lab, operadores LACChain, proveedores privados)

Dame los casos más relevantes para alguien que quiere tomar una decisión informada — no los más famosos a nivel global, sino los más útiles para mi contexto.
```

**Criterio de hecho:** Tenés al menos 3 casos relevantes en tu sector, 1-2 casos de fracaso con lección aprendida, y una lista de posibles aliados o redes para explorar.
$ej3$, 3
FROM workshops WHERE slug = 'blockchain-sin-hype-decision-framework';

-- EJ 4
INSERT INTO exercises (workshop_id, title, objective, prompt_text, "order")
SELECT id, 'Analizá los riesgos éticos de tu implementación', 'Anticipar los riesgos éticos antes de comprometerte con una arquitectura técnica.',
$ej4$
**Contexto:** Los problemas éticos de blockchain (gobernanza, privacidad, exclusión, energía) son **más baratos de resolver en papel que en código**. Este ejercicio los saca a la luz.

**Prompt para tu agente:**

```
Tengo el siguiente caso de uso de blockchain:

[Pegá el resumen de tu caso + el resultado del árbol de decisión del ejercicio 2]

Quiero que analices los riesgos éticos de implementar esta solución:

1. GOBERNANZA: ¿Quién debería controlar la red? ¿Qué pasa si ese actor desaparece? ¿Hay riesgo de captura corporativa o política?

2. PRIVACIDAD: ¿Hay datos personales que podrían terminar en la cadena? ¿Cómo se protegen los derechos de los titulares de esos datos en un sistema inmutable?

3. INCLUSIÓN: ¿Hay grupos de beneficiarios o usuarios que podrían quedar excluidos por barreras tecnológicas, de conectividad o de alfabetización digital?

4. PROPORCIONALIDAD: ¿Es blockchain la herramienta más simple que resuelve el problema, o hay soluciones más baratas y menos complejas que logran el mismo resultado?

5. PLAN DE CONTINUIDAD: Si la red o el protocolo elegido deja de funcionar en 5 años, ¿los datos y derechos de los usuarios siguen siendo accesibles?

Para cada punto, dame el riesgo específico para mi caso y una recomendación de mitigación.
```

**Criterio de hecho:** Tenés los 5 riesgos éticos evaluados para tu caso específico y al menos 3 recomendaciones de mitigación accionables.
$ej4$, 4
FROM workshops WHERE slug = 'blockchain-sin-hype-decision-framework';

-- EJ 5
INSERT INTO exercises (workshop_id, title, objective, prompt_text, "order")
SELECT id, 'Tu posición final y próximos pasos', 'Consolidar todo el análisis del taller en una posición clara y un plan de acción concreto.',
$ej5$
**Contexto:** El objetivo del taller no es que salgas con más información — **es que salgas con una decisión**. Incluso si la decisión es *no es el momento*.

**Prompt para tu agente:**

```
Completé el análisis de blockchain para mi proyecto. Acá está el resumen:

- Caso de uso: [resumen del ejercicio 1]
- Resultado del árbol de decisión WEF: [resultado del ejercicio 2]
- Referentes relevantes encontrados: [principales casos del ejercicio 3]
- Riesgos éticos identificados: [principales riesgos del ejercicio 4]

Con toda esta información, quiero que me ayudes a redactar:

1. MI POSICIÓN ACTUAL (2-3 oraciones): ¿Tiene sentido blockchain para mi proyecto hoy? ¿Por qué sí o por qué no?

2. CONDICIONES QUE CAMBIARÍAN MI POSICIÓN: Si mi respuesta fue "no" o "no por ahora", ¿qué tendría que ser verdad para que blockchain tuviera sentido? Si fue "sí", ¿qué riesgos debo mitigar antes de avanzar?

3. PRÓXIMOS PASOS (lista de 3-5 acciones concretas):
   - Si blockchain tiene sentido: primeros pasos para explorar implementación (contactos, recursos, prototipos)
   - Si blockchain no tiene sentido hoy: qué tecnología sí resuelve el problema y por dónde empezar

4. UNA PREGUNTA QUE DEBERÍA RESPONDER ANTES DE LA PRÓXIMA DECISIÓN: la pregunta más importante que todavía no tengo resuelta.

Redactá esto en primera persona, como si fuera mi propia conclusión después del análisis.
```

**Criterio de hecho:** Tenés una posición escrita en primera persona, condiciones claras para revisar esa posición, y al menos 3 próximos pasos concretos.
$ej5$, 5
FROM workshops WHERE slug = 'blockchain-sin-hype-decision-framework';

-- ============================================================
-- 5) GLOSARIO (25 términos)
-- ============================================================
INSERT INTO glossary_terms (workshop_id, term, definition, category)
SELECT w.id, t.term, t.definition, t.category FROM workshops w,
(VALUES
  -- Fundamentos
  ('Blockchain', 'Registro de transacciones distribuido, inmutable y compartido entre múltiples participantes. Ningún actor central lo controla. Cada nueva entrada requiere el consenso de la red para ser aceptada.', 'fundamentos'),
  ('DLT (Distributed Ledger Technology)', 'Tecnología de registro distribuido. Blockchain es el tipo más conocido de DLT, pero no el único. Otros incluyen DAG (Directed Acyclic Graph) y Hashgraph.', 'fundamentos'),
  ('Bloque', 'Unidad básica de almacenamiento en una blockchain. Cada bloque contiene un conjunto de transacciones, una referencia al bloque anterior (hash) y un sello de tiempo. Los bloques se encadenan cronológicamente.', 'fundamentos'),
  ('Nodo', 'Computadora que participa en una red blockchain. Los diferentes tipos de nodo tienen distintos roles: validadores generan bloques, escritores envían transacciones, observadores solo leen.', 'fundamentos'),
  ('Hash', 'Función matemática que convierte cualquier dato en una cadena de caracteres de longitud fija. Pequeños cambios en el dato original producen hashes completamente distintos. Se usa para identificar bloques y verificar integridad.', 'fundamentos'),
  ('Inmutabilidad', 'Propiedad de blockchain por la cual, una vez registrada una transacción, no puede modificarse ni eliminarse sin invalidar toda la cadena posterior. Es una ventaja para trazabilidad y una limitación para corrección de errores.', 'fundamentos'),
  ('Trazabilidad', 'Capacidad de seguir el historial completo de un producto, documento o activo desde su origen hasta su estado actual. Blockchain ofrece trazabilidad con garantías de inmutabilidad que las bases de datos convencionales no tienen por defecto.', 'fundamentos'),
  -- Tipos y tokens
  ('Permissioned blockchain', 'Blockchain donde los participantes necesitan autorización para escribir (y a veces para leer). Contrapuesta a permissionless (sin permisos), donde cualquiera puede participar.', 'tipos'),
  ('Token', 'Representación digital de un activo o derecho en una blockchain. Puede ser fungible (intercambiable con otro del mismo tipo, como una criptomoneda) o no fungible (único, como un NFT).', 'tipos'),
  ('NFT (Non-Fungible Token)', 'Token único en una blockchain que representa la propiedad de un activo digital específico. A diferencia de las criptomonedas (fungibles, intercambiables), cada NFT es único e irrepetible.', 'tipos'),
  -- Consenso
  ('Algoritmo de consenso', 'Mecanismo por el cual los nodos de una red blockchain se ponen de acuerdo en cuál es la versión válida del registro. Los más comunes son Proof of Work, Proof of Stake y Proof of Authority.', 'consenso'),
  ('Proof of Work (PoW)', 'Mecanismo de consenso original de Bitcoin. Los validadores (mineros) compiten para resolver un problema matemático costoso computacionalmente. El ganador valida el bloque y recibe una recompensa. Consume mucha energía.', 'consenso'),
  ('Proof of Stake (PoS)', 'Mecanismo de consenso donde los validadores depositan criptomonedas como garantía. Si actúan de mala fe, pierden el depósito. Ethereum migró a PoS en 2022.', 'consenso'),
  ('Proof of Authority (PoA)', 'Mecanismo de consenso donde los validadores son entidades conocidas e identificadas. Se usa en redes como LACChain porque es eficiente energéticamente y permite cumplimiento regulatorio.', 'consenso'),
  -- Ecosistema y aplicaciones
  ('LACChain', 'Iniciativa del BID Lab (Banco Interamericano de Desarrollo) para crear infraestructura blockchain como bien público en América Latina. Es una blockchain pública con permisos: cualquiera puede leer, solo organizaciones autorizadas pueden escribir.', 'ecosistema'),
  ('Web3', 'Visión de internet descentralizada donde los usuarios controlan sus datos e identidad mediante blockchains y criptografía, en lugar de delegar ese control a plataformas centralizadas.', 'ecosistema'),
  ('Gobernanza de red', 'Conjunto de reglas, actores y procesos que determinan cómo se toman decisiones sobre una blockchain: quién puede ser validador, cómo se actualizan los protocolos, cómo se resuelven disputas.', 'ecosistema'),
  ('Cadena de suministro', 'Secuencia de actores, procesos y recursos que intervienen en la producción y entrega de un producto. Blockchain permite registrar cada paso de esta cadena de forma verificable y a prueba de manipulación.', 'ecosistema'),
  -- Aplicaciones
  ('Contrato inteligente (Smart Contract)', 'Programa que se ejecuta automáticamente en una blockchain cuando se cumplen condiciones predefinidas. No requiere intermediarios humanos. Ejemplo: si A deposita X ETH, B recibe automáticamente el documento firmado.', 'aplicaciones'),
  ('Credencial verificable', 'Documento digital (diploma, certificado, licencia) cuya autenticidad puede verificarse consultando la blockchain donde fue registrado, sin necesidad de contactar a quien lo emitió.', 'aplicaciones'),
  ('Identidad auto-soberana (SSI)', 'Modelo de identidad digital donde el titular controla sus propios datos y credenciales, sin depender de una entidad central. Blockchain se usa para anclar y verificar esas credenciales.', 'aplicaciones'),
  ('Oráculo', 'Servicio que conecta una blockchain con datos del mundo real (precios de mercado, resultados deportivos, datos de sensores). Los contratos inteligentes no pueden leer datos externos por sí solos — necesitan oráculos.', 'aplicaciones'),
  -- Técnico
  ('Criptografía de clave pública', 'Sistema de seguridad que usa un par de claves matemáticamente relacionadas: una pública (compartible con todos) y una privada (secreta). La clave pública identifica al titular. La privada firma las transacciones.', 'tecnico'),
  ('Gas', 'Unidad de medida del costo computacional de ejecutar operaciones en Ethereum. Cada transacción tiene un costo en gas que el usuario paga en ETH. En momentos de alta demanda, el gas sube.', 'tecnico'),
  ('Wallet (billetera digital)', 'Software que gestiona las claves criptográficas de un usuario. NO almacena criptomonedas — las criptomonedas están en la blockchain. La wallet almacena las claves que permiten acceder a ellas y firmar transacciones.', 'tecnico')
) AS t(term, definition, category)
WHERE w.slug = 'blockchain-sin-hype-decision-framework';

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
-- FROM workshops w WHERE slug = 'blockchain-sin-hype-decision-framework';
--
-- Esperado: 5 secciones · 11 slides · 5 ejercicios · 25 términos
