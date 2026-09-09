import { type NextRequest, NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/middleware";

// Rutas API deliberadamente públicas (se autentican por token propio o son innocuas):
// - /api/auth/* — login/registro/sesión (con rate limiting propio)
// - /api/portal/[token] — vista pública del cliente por token (NO /api/portal a secas: gestión protegida)
// - /api/quotes/[id]/approve — aprobación pública de cotización por token (NO el resto de /api/quotes/*)
// - GET /api/assistant/chat — health check (POST requiere sesión)
const PUBLIC_API_PATTERNS = [
  /^\/api\/auth(\/|$)/,
  /^\/api\/portal\/[^/]+$/,
  /^\/api\/quotes\/[^/]+\/approve$/,
];
const PUBLIC_PAGES = ["/login", "/auth", "/reset-password"];
const PUBLIC_PAGE_PARAMS = ["quote", "portal"]; // vistas públicas vía query param

export async function middleware(request: NextRequest) {
  const { supabase, response } = createClient(request);

  // IMPORTANTE: refrescar la sesión SIEMPRE (cookies del response viajan al cliente)
  let isAuthenticated = false;
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    isAuthenticated = !!user;
  } catch {
    isAuthenticated = false;
  }

  const { pathname } = request.nextUrl;

  // --- APIs ---
  if (pathname.startsWith("/api/")) {
    const isPublicApi =
      PUBLIC_API_PATTERNS.some((re) => re.test(pathname)) ||
      (pathname === "/api/assistant/chat" && request.method === "GET");
    if (!isPublicApi && !isAuthenticated) {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 });
    }
    return response;
  }

  // --- Páginas ---
  const isPublicPage =
    PUBLIC_PAGES.some((p) => pathname.startsWith(p)) ||
    PUBLIC_PAGE_PARAMS.some((p) => request.nextUrl.searchParams.has(p));
  if (!isPublicPage && !isAuthenticated) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.search = "";
    return NextResponse.redirect(url);
  }

  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
