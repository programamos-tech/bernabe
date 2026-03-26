import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import { createServiceRoleClient } from "@/lib/supabase/admin";
import { generateTemporaryPassword } from "@/lib/auth/generate-temp-password";
import { userCanManageLeaderPlatformAccess } from "@/lib/auth/leader-platform-access";

export async function POST(_request: Request, context: { params: { id: string } }) {
  try {
    const { id } = context.params;

    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll: () => cookieStore.getAll(),
          setAll: (cookiesToSet) => {
            cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options));
          },
        },
      }
    );

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const { data: profile, error: profLoadErr } = await supabase
      .from("profiles")
      .select("organization_id, role")
      .eq("id", user.id)
      .single();

    if (profLoadErr || !profile?.organization_id) {
      return NextResponse.json({ error: "Perfil no disponible" }, { status: 403 });
    }

    const { data: lider, error: liderErr } = await supabase
      .from("lideres")
      .select("id, organization_id, nombre, email, auth_user_id")
      .eq("id", id)
      .single();

    if (liderErr || !lider) {
      return NextResponse.json({ error: "Líder no encontrado" }, { status: 404 });
    }

    if (lider.organization_id !== profile.organization_id) {
      return NextResponse.json({ error: "No permitido" }, { status: 403 });
    }

    const allowed = await userCanManageLeaderPlatformAccess(supabase, user, lider.organization_id);
    if (!allowed) {
      return NextResponse.json(
        { error: "Solo el administrador o el correo del pastor pueden restablecer el acceso." },
        { status: 403 }
      );
    }

    if (!lider.auth_user_id) {
      return NextResponse.json({ error: "Este líder aún no tiene cuenta. Usa “Generar acceso” primero." }, { status: 400 });
    }

    const password = generateTemporaryPassword();
    const admin = createServiceRoleClient();

    const { data: existing, error: getErr } = await admin.auth.admin.getUserById(lider.auth_user_id);
    if (getErr || !existing.user) {
      return NextResponse.json({ error: "Usuario de Auth no encontrado. Vuelve a generar acceso desde cero." }, { status: 400 });
    }

    const nextMeta = {
      ...(existing.user.app_metadata ?? {}),
      must_change_password: true,
      lider_id: lider.id,
    };

    const { error: updErr } = await admin.auth.admin.updateUserById(lider.auth_user_id, {
      password,
      app_metadata: nextMeta,
    });

    if (updErr) {
      return NextResponse.json({ error: updErr.message }, { status: 400 });
    }

    await admin.from("profiles").update({ must_change_password: true }).eq("id", lider.auth_user_id);

    const email = (lider.email ?? existing.user.email ?? "").trim();

    return NextResponse.json({
      email,
      temporaryPassword: password,
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Error del servidor";
    if (msg.includes("SUPABASE_SERVICE_ROLE_KEY")) {
      return NextResponse.json(
        {
          error:
            "Falta SUPABASE_SERVICE_ROLE_KEY en el servidor (supabase status -o env → SERVICE_ROLE_KEY).",
        },
        { status: 500 }
      );
    }
    console.error(e);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
