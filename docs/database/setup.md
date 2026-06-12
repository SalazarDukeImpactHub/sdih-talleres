# Setup de Base de Datos — Supabase

Esta guía describe los pasos para configurar la base de datos de Supabase para SDIH Talleres v1, incluyendo la creación del proyecto, la migración de esquema, y la creación del usuario seed para desarrollo.

## Requisitos previos

- Cuenta en [Supabase](https://supabase.com) (gratuita)
- PostgreSQL versión 14+
- `pnpm` instalado localmente

## Paso 1: Crear proyecto Supabase

1. Ingresá a https://supabase.com y creá una nueva cuenta (o loguéate si ya tenés una).
2. Hacé clic en **New Project**.
3. Completá los datos:
   - **Project name**: `sdih-talleres` (o el nombre que prefieras)
   - **Database password**: Generá una contraseña segura; podés usar el generador de Supabase
   - **Region**: Elegí la región más cercana a tu ubicación (ej: São Paulo para Latinoamérica)
4. Hacé clic en **Create new project** y esperá a que Supabase complete la creación (~2 minutos).

## Paso 2: Copiar credenciales

Una vez que el proyecto está listo:

1. Abrí **Settings → Database** (o **Settings → API** para ver URLs)
2. Copiá los siguientes valores y pegalos en `.env.local`:
   - **NEXT_PUBLIC_SUPABASE_URL**: `https://[project-id].supabase.co`
   - **NEXT_PUBLIC_SUPABASE_ANON_KEY**: `anon` key de la sección API
   - **SUPABASE_SERVICE_ROLE_KEY**: `service_role` key (solo disponible en Settings → API Credentials)

Ejemplo de `.env.local`:
```
NEXT_PUBLIC_SUPABASE_URL=https://xxxxxxxxxxxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGc...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGc...
```

## Paso 3: Aplicar migración de esquema

Supabase ejecuta migraciones automáticamente desde el directorio `supabase/migrations/`.

El archivo `supabase/migrations/20260612000000_create_users_table.sql` contiene el esquema necesario:

```sql
-- Crear tabla public.users
CREATE TABLE IF NOT EXISTS public.users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  name TEXT,
  role TEXT CHECK (role IN ('alumno', 'intermediario', 'admin')) DEFAULT 'alumno',
  password_changed BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Crear index en email para búsquedas
CREATE INDEX idx_users_email ON public.users(email);

-- Habilitar RLS (Row Level Security)
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Policy: Usuarios pueden leer su propia fila
CREATE POLICY "Users can read own profile"
  ON public.users
  FOR SELECT
  USING (auth.uid() = id);

-- Policy: Usuarios pueden actualizar su propia fila
CREATE POLICY "Users can update own profile"
  ON public.users
  FOR UPDATE
  USING (auth.uid() = id);

-- Crear tabla de auditoría (opcional, para futuro)
CREATE TABLE IF NOT EXISTS public.audit_log (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  table_name TEXT NOT NULL,
  row_id UUID,
  changes JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);
```

Para aplicar esta migración manualmente:

1. Abrí **SQL Editor** en Supabase dashboard
2. Pegá el contenido del archivo `supabase/migrations/20260612000000_create_users_table.sql`
3. Hacé clic en **Run**

Si usás `supabase-cli` (recomendado para equipo):
```bash
npm install -g supabase
supabase link --project-ref <project-id>
supabase db push
```

## Paso 4: Crear usuario seed para desarrollo

Antes de crear el usuario, debés crear un usuario en Supabase Auth. Para este cambio (change 1), hacemos un seeding manual con privilegios de admin.

### Opción A: Vía dashboard Supabase (simple)

1. Abrí **Auth → Users** en el dashboard
2. Hacé clic en **Add user** (o **Invite user***)
3. Completá:
   - **Email**: `alumna@test.com`
   - **Password**: `Talleres2026!`
   - Dejalas las demás opciones en default
4. Hacé clic en **Create user**

Supabase te asignará un UUID automáticamente. Copialo (lo necesitás para el paso siguiente).

### Opción B: Vía SQL directo (si preferís)

En **SQL Editor**, ejecutá:
```sql
-- Crear usuario en auth.users (Supabase lo maneja internamente)
-- Luego crear su perfil en public.users

-- Primero, obtené el UUID del usuario que creaste vía Auth
-- (Este paso requiere que primero hayas creado el usuario vía Auth o CLI)

-- Luego, insertá el perfil:
INSERT INTO public.users (id, email, name, role, password_changed)
VALUES (
  'd096328a-7ce1-4fc4-b53b-4e1f50691d31'::UUID,
  'alumna@test.com',
  'Alumna de Prueba',
  'alumno',
  FALSE
);
```

Este SQL está documentado en `docs/database/manual-seed.sql`.

### Verificación

Una vez creado, podés verificar que el usuario existe:

```sql
SELECT id, email, name, role, password_changed
FROM public.users
WHERE email = 'alumna@test.com';
```

Esperás ver una fila con:
- `email`: `alumna@test.com`
- `name`: `Alumna de Prueba`
- `role`: `alumno`
- `password_changed`: `false` (importante para el flujo de change-password)

## Paso 5: Configurar variables de entorno en desarrollo

Ya copiaste las credenciales en `.env.local`. Verificá que estén bien:

```bash
# Validar que las credenciales existan
grep SUPABASE .env.local

# Esperás ver:
# NEXT_PUBLIC_SUPABASE_URL=https://...
# NEXT_PUBLIC_SUPABASE_ANON_KEY=...
# SUPABASE_SERVICE_ROLE_KEY=...
```

**Importante**: `.env.local` es ignorado por Git (`.gitignore`). No compartís credenciales vía git.

## Paso 6: Correr tests en desarrollo

Una vez que Supabase está configurado:

```bash
# Instalar dependencias
pnpm install

# Correr tests unitarios (no requieren conexión a Supabase)
pnpm test:unit

# Correr tests de integración (requieren Supabase)
pnpm test

# Correr tests e2e (requieren Supabase + servidor Next.js)
pnpm dev  # En una terminal
pnpm test:e2e  # En otra terminal
```

## Troubleshooting

### "Invalid API key" en tests

**Problema**: Tests fallan con error sobre API key inválida.

**Solución**: Verificá que `.env.local` tenga las credenciales correctas copiadas desde Supabase dashboard. Asegurate de que:
- No hay espacios en blanco al inicio/final de las keys
- La URL termina en `.supabase.co` (sin trailing slash)
- El `SERVICE_ROLE_KEY` viene de **Settings → API**, no del `ANON_KEY`

### "No rows returned" en tests e2e

**Problema**: Tests e2e fallan buscando el usuario seed.

**Solución**: Verificá que la tabla `public.users` tiene una fila con `email = 'alumna@test.com'`. Si no:
```sql
INSERT INTO public.users (id, email, name, role, password_changed)
VALUES (
  'd096328a-7ce1-4fc4-b53b-4e1f50691d31'::UUID,
  'alumna@test.com',
  'Alumna de Prueba',
  'alumno',
  FALSE
);
```

### RLS policy errors

**Problema**: Al loguear, obtenés errores como "new row violates row-level security policy".

**Solución**: Las RLS policies pueden ser restrictivas. Verificá que las políticas en `public.users` permiten INSERT/UPDATE para usuarios. Si no, reemplazá con:
```sql
-- Política permisiva (solo para desarrollo)
CREATE POLICY "Enable all operations for authenticated users" ON public.users
  USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');
```

Luego, en producción, refiná las políticas según tus necesidades de seguridad.

## Próximos pasos

Una vez que la base de datos está lista:
- Corrés los tests (`pnpm test`, `pnpm test:e2e`)
- Podés hacer login con `alumna@test.com` / `Talleres2026!`
- El flujo de change-password forzado debe funcionar (primer login te redirige a `/auth/change-password`)

Para más detalles sobre la arquitectura de auth, mirá `docs/TESTING.md`.
