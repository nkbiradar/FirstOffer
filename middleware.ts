import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

function adminEmails() {
  return (process.env.ADMIN_EMAILS ?? "")
    .split(",")
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean);
}

// Only /admin routes require authentication. The public site is open to
// everyone, and /admin/login itself must stay reachable so an admin can
// actually sign in.
export async function middleware(request: NextRequest) {
  let response = NextResponse.next({ request });
  const pathname = request.nextUrl.pathname;

  if (pathname === "/admin/login") {
    return response;
  }

  if (!pathname.startsWith("/admin")) {
    return response;
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

  if (!supabaseUrl || !supabaseKey) {
    return response;
  }

  const supabase = createServerClient(supabaseUrl, supabaseKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) =>
          request.cookies.set(name, value),
        );
        response = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) =>
          response.cookies.set(name, value, options),
        );
      },
    },
  });

  // Always call getUser() to refresh the session token if needed.
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const redirectToLogin = () => {
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = "/admin/login";
    redirectUrl.search = "";
    redirectUrl.searchParams.set("next", pathname);
    return NextResponse.redirect(redirectUrl);
  };

  if (!user) {
    return redirectToLogin();
  }

  const isAdmin = Boolean(
    user.email && adminEmails().includes(user.email.toLowerCase()),
  );
  if (!isAdmin) {
    return redirectToLogin();
  }

  return response;
}

export const config = {
  matcher: ["/admin/:path*"],
};
