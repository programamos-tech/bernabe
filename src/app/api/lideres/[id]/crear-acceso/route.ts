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
      .select("id, organization_id, nombre, email, telefono, auth_user_id")
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
        { error: "Solo el administrador o el correo del pastor de la iglesia pueden crear acceso." },
        { status: 403 }
      );
    }

    if (lider.auth_user_id) {
      return NextResponse.json(
        {
          error: "Este líder ya tiene cuenta. Usa “Nueva contraseña temporal” si necesitas otra clave.",
        },
        { status: 400 }
      );
    }

    const email = (lider.email ?? "").trim().toLowerCase();
    if (!email || !email.includes("@")) {
      return NextResponse.json({ error: "El líder necesita un correo válido en su ficha." }, { status: 400 });
    }

    const password = generateTemporaryPassword();
    const admin = createServiceRoleClient();

    const { data: created, error: createErr } = await admin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { full_name: lider.nombre ?? "" },
      app_metadata: {
        must_change_password: true,
        lider_id: lider.id,
      },
    });

    if (createErr || !created.user) {
      const msg = createErr?.message ?? "No se pudo crear el usuario";
      if (/already registered|already exists|duplicate/i.test(msg)) {
        return NextResponse.json(
          {
            error:
              "Ese correo ya tiene cuenta. Cambia el correo en la ficha del líder o usa recuperación de contraseña en inicio de sesión.",
          },
          { status: 409 }
        );
      }
      return NextResponse.json({ error: msg }, { status: 400 });
    }

    const uid = created.user.id;

    const { error: updLiderErr } = await admin
      .from("lideres")
      .update({ auth_user_id: uid, updated_at: new Date().toISOString() })
      .eq("id", id);

    if (updLiderErr) {
      await admin.auth.admin.deleteUser(uid);
      return NextResponse.json({ error: updLiderErr.message }, { status: 500 });
    }

    const { error: profErr } = await admin
      .from("profiles")
      .update({
        organization_id: lider.organization_id,
        full_name: lider.nombre ?? email,
        phone: lider.telefono ?? null,
        must_change_password: true,
      })
      .eq("id", uid);

    if (profErr) {
      console.error("profiles update after leader invite:", profErr);
    }

    return NextResponse.json({
      email,
      temporaryPassword: password,
      userId: uid,
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Error del servidor";
    if (msg.includes("SUPABASE_SERVICE_ROLE_KEY")) {
      return NextResponse.json(
        {
          error:
            "Falta SUPABASE_SERVICE_ROLE_KEY en el servidor. Añádela a .env.local (supabase status -o env → SERVICE_ROLE_KEY). No la expongas al cliente.",
        },
        { status: 500 }
      );
    }
    console.error(e);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
