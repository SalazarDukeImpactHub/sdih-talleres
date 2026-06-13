-- Seed Data for Sections and Glossary Terms
-- Purpose: Populate test/demo workshops with complete content
-- Used by: Playwright fixtures (tests/playwright/_helpers/) and development
-- Note: Jennifer can extend/override with real workshop content

-- ==============================================================
-- Seed sections for test workshop (slug: 'engram')
-- ==============================================================

INSERT INTO public.sections (workshop_id, type, content_json, section_order) VALUES
(
  (SELECT id FROM public.workshops WHERE slug = 'engram'),
  'inicio',
  jsonb_build_object(
    'type', 'inicio',
    'title', 'Memoria Persistente para Agentes de IA',
    'description', 'Aprende cómo implementar un sistema de recuerdo en tus agentes sin perder escala.',
    'quick_links', jsonb_build_array(
      jsonb_build_object('label', 'Aprendizaje', 'target_section', 'aprendizaje'),
      jsonb_build_object('label', 'Taller', 'target_section', 'taller'),
      jsonb_build_object('label', 'Instalación', 'target_section', 'instalacion'),
      jsonb_build_object('label', 'Glosario', 'target_section', 'glosario')
    )
  ),
  1
),
(
  (SELECT id FROM public.workshops WHERE slug = 'engram'),
  'aprendizaje',
  jsonb_build_object(
    'type', 'aprendizaje',
    'title', 'El modelo mental de la memoria',
    'slides', jsonb_build_array(
      jsonb_build_object(
        'kicker', 'Concepto',
        'title', 'Qué es la memoria persistente',
        'body', 'Un sistema que recuerda información entre sesiones, escalable y actualizable. No solo localStorage: una base de datos de conocimiento con búsqueda semántica.',
        'notes', 'En vivo: preguntarles qué tipos de memoria usan en sus sistemas'
      ),
      jsonb_build_object(
        'kicker', 'Práctica',
        'title', 'Implementación básica',
        'body', 'Vector DB + embedding: búsqueda semántica en 3 líneas de código. Opciones: Pinecone, Chroma, Weaviate.',
        'notes', 'Demo: usar Pinecone o Chroma'
      ),
      jsonb_build_object(
        'kicker', 'Avanzado',
        'title', 'Optimizaciones a escala',
        'body', 'Cache de embeddings, índices HNSW, filtros RLS. Pasar de 100ms a 10ms de latencia.',
        'notes', null
      )
    ),
    'pdf_url', 'https://ejemplo.com/engram-slides.pdf'
  ),
  2
),
(
  (SELECT id FROM public.workshops WHERE slug = 'engram'),
  'taller',
  jsonb_build_object(
    'type', 'taller',
    'title', 'Ejercicios accionables',
    'instructions', 'Copia el prompt, pruébalo con tu modelo, guarda tu respuesta. Marca cada ejercicio al terminar.',
    'placeholder', 'Ejercicios disponibles en la siguiente versión. Por ahora, practica con los prompts del Aprendizaje.'
  ),
  3
),
(
  (SELECT id FROM public.workshops WHERE slug = 'engram'),
  'instalacion',
  jsonb_build_object(
    'type', 'instalacion',
    'title', 'Deja Engram corriendo en 5 pasos',
    'steps', jsonb_build_array(
      jsonb_build_object(
        'order', 1,
        'title', 'Instala engram',
        'description', 'Descarga y configura la librería desde PyPI',
        'code', 'pip install engram-sdk',
        'language', 'bash'
      ),
      jsonb_build_object(
        'order', 2,
        'title', 'Inicia sesión',
        'description', 'Autentica con tu API key',
        'code', 'from engram import Engram\ne = Engram(api_key="sk-...")',
        'language', 'python'
      ),
      jsonb_build_object(
        'order', 3,
        'title', 'Guarda tu primer recuerdo',
        'description', 'Prueba el endpoint de almacenamiento',
        'code', 'e.remember("contexto importante")\nprint(e.recall("contexto"))',
        'language', 'python'
      ),
      jsonb_build_object(
        'order', 4,
        'title', 'Integra con tu agente',
        'description', 'Conecta al sistema de LLM',
        'code', 'agent.memory = e\nagent.run("¿Quién soy?")',
        'language', 'python'
      ),
      jsonb_build_object(
        'order', 5,
        'title', 'Valida en consola',
        'description', 'Verifica logs y errores',
        'code', 'engram logs --last 10',
        'language', 'bash'
      )
    ),
    'success_message', '¡Engram está corriendo! Ahora tu agente tiene memoria persistente.'
  ),
  4
),
(
  (SELECT id FROM public.workshops WHERE slug = 'engram'),
  'glosario',
  jsonb_build_object(
    'type', 'glosario',
    'title', 'Términos clave del taller',
    'search_placeholder', 'Buscar término o definición…'
  ),
  5
);

-- ==============================================================
-- Seed glossary terms for 'engram' workshop
-- ==============================================================

INSERT INTO public.glossary_terms (workshop_id, term, definition, category) VALUES
(
  (SELECT id FROM public.workshops WHERE slug = 'engram'),
  'Vector Embedding',
  'Representación numérica de texto que captura su significado semántico. Usado para búsqueda similar por significado, no solo por palabras clave.',
  'Conceptos'
),
(
  (SELECT id FROM public.workshops WHERE slug = 'engram'),
  'Recuperación Aumentada (RAG)',
  'Técnica de buscar información relevante en una base de datos y pasarla al LLM para mejorar respuestas. Combina búsqueda + generación.',
  'Técnicas'
),
(
  (SELECT id FROM public.workshops WHERE slug = 'engram'),
  'Base de Datos Vectorial',
  'Sistema especializado en almacenar y buscar vectors (embeddings). Ejemplos: Pinecone, Weaviate, Milvus, Chroma.',
  'Infraestructura'
),
(
  (SELECT id FROM public.workshops WHERE slug = 'engram'),
  'Latencia',
  'Tiempo que tarda una operación (query, insert) de principio a fin. En memoria: <100ms. Ideal para agentes: <50ms.',
  'Performance'
),
(
  (SELECT id FROM public.workshops WHERE slug = 'engram'),
  'Índice HNSW',
  'Algoritmo de búsqueda aproximada en vecinos cercanos. Rápido (O(log n)) pero no exacto. Usado en Weaviate, Qdrant.',
  'Algoritmos'
),
(
  (SELECT id FROM public.workshops WHERE slug = 'engram'),
  'Context Window',
  'Cantidad de tokens que un modelo puede procesar en una sola llamada. GPT-4: 128k tokens. Límite importante para memoria persistente.',
  'Conceptos'
),
(
  (SELECT id FROM public.workshops WHERE slug = 'engram'),
  'Fine-tuning',
  'Entrenar un modelo con datos específicos del dominio. Alternativa a RAG cuando tienes datos fijos y predecibles.',
  'Técnicas'
),
(
  (SELECT id FROM public.workshops WHERE slug = 'engram'),
  'Sesión vs Persistencia',
  'Sesión: datos en memoria (rápido, temporal). Persistencia: datos en DB (lento, permanente). Engram: lo mejor de ambos.',
  'Conceptos'
);

-- ==============================================================
-- OPTIONAL: Seed additional workshops
-- Uncomment/extend as needed for testing multi-workshop scenarios
-- ==============================================================

-- INSERT INTO public.sections (workshop_id, type, content_json, section_order) VALUES
-- (
--   (SELECT id FROM public.workshops WHERE slug = 'otro-taller'),
--   'inicio',
--   jsonb_build_object(
--     'type', 'inicio',
--     'title', 'Otro taller de ejemplo',
--     'description', 'Contenido de prueba para otro workshop',
--     'quick_links', jsonb_build_array(...)
--   ),
--   1
-- );
