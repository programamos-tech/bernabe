# Supabase – Bernabé SaaS multi-tenant

Cada **iglesia** es una **organización** (tenant). Los usuarios se registran, crean su iglesia en el onboarding y solo ven los datos de su organización.

## 1. Crear proyecto en Supabase

1. Entra en [supabase.com](https://supabase.com) y crea un proyecto.
2. En **Settings → API** copia:
   - **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
   - **anon public** key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`

## 2. Variables de entorno

Copia el ejemplo y rellena los valores:

```bash
cp .env.local.example .env.local
```

Edita `.env.local` con tu URL y anon key.

**Invitar líderes (crear usuario en Auth desde la app)**  
Hace falta la **service role** solo en el servidor:

- Local: `supabase status -o env` → `SERVICE_ROLE_KEY`
- Añade en `.env.local`: `SUPABASE_SERVICE_ROLE_KEY=...`  
  (nunca en el cliente ni en `NEXT_PUBLIC_*`)

Tras aplicar la migración `20260333000000_lideres_auth_user.sql`, ejecuta `supabase db reset` o `supabase migration up` según tu flujo.

**Primer acceso / cambio de contraseña obligatorio**  
Aplica también `20260334000000_profiles_must_change_password.sql` (columna `profiles.must_change_password`). Así el flujo **no depende solo** de `SUPABASE_SERVICE_ROLE_KEY` para desbloquear la cuenta: el usuario puede marcar el flag en `profiles` con su sesión normal.

Si un usuario quedó bloqueado antes de esta migración, en el **SQL Editor** puedes ejecutar (sustituye el UUID):

```sql
UPDATE public.profiles SET must_change_password = false WHERE id = 'UUID_DEL_USUARIO';
```

## 3. Ejecutar la migración

**Opción A – Dashboard (recomendado)**  
1. En el proyecto: **SQL Editor**.  
2. Abre `supabase/migrations/20260318000000_multitenant_schema.sql`.  
3. Pega todo el contenido en el editor y ejecuta **Run**.

**Opción B – CLI**  
Si tienes [Supabase CLI](https://supabase.com/docs/guides/cli) instalado y enlazado al proyecto:

```bash
supabase db push
```

## 4. Auth en el dashboard

- **Authentication → Providers**: deja **Email** activado para registro con email/contraseña.
- Opcional: en **URL Configuration** añade tu sitio en **Redirect URLs** (ej. `http://localhost:3000/**`, `https://tudominio.com/**`).

## 5. Flujo de datos

- **Registro**: se crea el usuario en `auth.users` y, por trigger, una fila en `profiles` (sin `organization_id`).
- **Onboarding**: la app crea una fila en `organizations` (iglesia) y actualiza `profiles` con ese `organization_id`.
- **RLS**: todas las tablas de datos filtran por `organization_id = current_organization_id()`, así cada iglesia solo ve sus propios datos.

## Tablas principales

| Tabla              | Descripción                          |
|--------------------|--------------------------------------|
| `organizations`    | Iglesias (nombre, país, ciudad, etc.) |
| `profiles`         | Usuarios y su `organization_id`      |
| `personas`         | Personas/miembros por iglesia        |
| `grupos`           | Grupos por iglesia                   |
| `lideres`          | Líderes por iglesia                  |
| `eventos`          | Eventos por iglesia                  |
| `persona_historial`| Seguimientos / historial por persona |
