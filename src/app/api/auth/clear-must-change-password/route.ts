import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import { createServiceRoleClient } from "@/lib/supabase/admin";
import { isProfileMustChangeCleared } from "@/lib/auth/must-change-password";

/**
 * Tras cambiar la contraseña en primer acceso:
 * 1) Marca profiles.must_change_password = false (RLS, no requiere service_role).
 * 2) Opcional: sincroniza Auth app_metadata si SUPABASE_SERVICE_ROLE_KEY está definida.
 */
export async function POST() {
  try {
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

    const { data: updatedProfile, error: profileErr } = await supabase
      .from("profiles")
      .update({ must_change_password: false })
      .eq("id", user.id)
      .select("id, must_change_password")
      .maybeSingle();

    if (profileErr) {
      return NextResponse.json(
        {
          error:
            profileErr.message +
            " (¿aplicaste la migración profiles.must_change_password en Supabase?)",
        },
        { status: 400 }
      );
    }
    if (!updatedProfile) {
      return NextResponse.json(
        { error: "No se encontró tu perfil. Contacta a tu iglesia o vuelve a iniciar sesión." },
        { status: 400 }
      );
    }
    if (!isProfileMustChangeCleared(updatedProfile.must_change_password)) {
      return NextResponse.json(
        { error: "No se pudo guardar el desbloqueo en el perfil. Revisa RLS y la columna must_change_password." },
        { status: 500 }
      );
    }

    try {
      const admin = createServiceRoleClient();
      const { data: adminUser, error: loadErr } = await admin.auth.admin.getUserById(user.id);
      if (!loadErr && adminUser?.user) {
        const meta = { ...(adminUser.user.app_metadata as Record<string, unknown>) };
        await admin.auth.admin.updateUserById(user.id, {
          app_metadata: { ...meta, must_change_password: false },
        });
      }
    } catch {
      /* Sin service_role el acceso ya queda resuelto vía profiles */
    }

    return NextResponse.json({ ok: true });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Error";
    console.error(e);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
