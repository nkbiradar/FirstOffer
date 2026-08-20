/**
 * Server-side Supabase auth utilities.
 * All functions run in Server Components / Route Handlers only.
 */
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import type { AuthUser, AuthSession } from "@/types/supabase";

// ── getUser ──────────────────────────────────────────────────

/**
 * Returns the authenticated user from the server-side session,
 * or `null` if the visitor is unauthenticated.
 *
 * Uses `getUser()` (validates JWT with Supabase) rather than
 * `getSession()` (reads from cookie only) for security.
 */
export async function getUser(): Promise<AuthUser | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
}

// ── getSession ────────────────────────────────────────────────

/**
 * Returns the raw session object (reads from cookie).
 * Prefer `getUser()` for security-critical checks.
 */
export async function getSession(): Promise<AuthSession | null> {
  const supabase = await createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();
  return session;
}

// ── signOut ───────────────────────────────────────────────────

/**
 * Signs the user out server-side and redirects to the home page.
 * Must be called from a Server Action or Route Handler (not a
 * plain Server Component render).
 */
export async function signOut(): Promise<never> {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/");
}

// ── requireUser ───────────────────────────────────────────────

/**
 * Asserts that a user is authenticated.
 * Redirects to `/admin/login` if not — use in protected Server Components.
 */
export async function requireUser(): Promise<AuthUser> {
  const user = await getUser();
  if (!user) redirect("/admin/login");
  return user;
}

// ── getAdminUser ─────────────────────────────────────────────

function adminEmails() {
  return (process.env.ADMIN_EMAILS ?? "")
    .split(",")
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean);
}

/**
 * Returns the current user if they're authenticated AND in the
 * ADMIN_EMAILS allowlist, otherwise `null`. Use this in Route Handlers
 * (e.g. app/api/admin/**) which need a 401/403 response rather than the
 * redirect requireUser() does — middleware.ts only guards page routes
 * under /admin/*, not /api/admin/*, so API routes check this themselves.
 */
export async function getAdminUser(): Promise<AuthUser | null> {
  const user = await getUser();
  if (!user?.email) return null;
  if (!adminEmails().includes(user.email.toLowerCase())) return null;
  return user;
}
