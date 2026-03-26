import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { needsPrimerAcceso } from "@/lib/auth/must-change-password";

export async function updateSession(request: NextRequest) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    return NextResponse.next({ request });
  }

  let response = NextResponse.next({ request });

  const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value, options }) => {
          request.cookies.set(name, value);
          response.cookies.set(name, value, options);
        });
      },
    },
  });

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const path = request.nextUrl.pathname;

  /* URL mal escrita común */
  if (path === "/primer-aceso" || path.startsWith("/primer-aceso/")) {
    const url = request.nextUrl.clone();
    url.pathname = "/primer-acceso" + path.slice("/primer-aceso".length);
    return NextResponse.redirect(url);
  }

  let profileFlag: boolean | null | undefined;
  if (user) {
    const { data: prof, error: profErr } = await supabase
      .from("profiles")
      .select("must_change_password")
      .eq("id", user.id)
      .maybeSingle();
    if (profErr) {
      console.error("[middleware] profiles.must_change_password:", profErr.message);
    }
    profileFlag = prof?.must_change_password ?? undefined;
  }

  const mustChange = user ? needsPrimerAcceso(profileFlag, user.app_metadata) : false;

  if (!user && path.startsWith("/primer-acceso")) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  if (user && mustChange) {
    if (!path.startsWith("/primer-acceso")) {
      const url = request.nextUrl.clone();
      url.pathname = "/primer-acceso";
      return NextResponse.redirect(url);
    }
    return response;
  }

  if (user && !mustChange && path.startsWith("/primer-acceso")) {
    const url = request.nextUrl.clone();
    url.pathname = "/home";
    return NextResponse.redirect(url);
  }

  return response;
}
