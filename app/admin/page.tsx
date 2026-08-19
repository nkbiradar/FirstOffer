import { createClient } from "@/lib/supabase/server";

export default async function AdminDashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <main className="admin-page">
      <h1>Admin dashboard</h1>
      <p>Signed in as {user?.email ?? "unknown"}.</p>
    </main>
  );
}
