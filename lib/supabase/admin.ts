import { createClient as createSupabaseClient } from "@supabase/supabase-js";

/**
 * Service-role Supabase client. Bypasses Row Level Security entirely.
 *
 * Server-only — never import this from a Client Component or expose
 * SUPABASE_SECRET_KEY to the browser. There are no RLS policies granting
 * admins broader read/write access (the public policies only allow
 * anonymous SELECT of published, non-expired opportunities), so all admin
 * reads and writes go through this client instead. Admin routes/pages gate
 * access themselves via the Supabase Auth session + ADMIN_EMAILS allowlist
 * (see lib/supabase/auth.ts's getAdminUser and middleware.ts).
 *
 * Deliberately untyped (no `Database` generic), matching
 * lib/supabase/server.ts and lib/supabase/client.ts elsewhere in this
 * project — callers cast results to the types in types/supabase.ts instead.
 */
export function createAdminClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const secretKey = process.env.SUPABASE_SECRET_KEY;

  if (!supabaseUrl || !secretKey) {
    throw new Error(
      "Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SECRET_KEY.",
    );
  }

  return createSupabaseClient(supabaseUrl, secretKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}
