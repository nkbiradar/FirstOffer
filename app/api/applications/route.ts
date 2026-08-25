import { NextResponse, type NextRequest } from "next/server";
import { getUser } from "@/lib/supabase/auth";
import { createClient } from "@/lib/supabase/server";

// Marks an opportunity as applied for the signed-in user. Any signed-in
// user (not admin-gated) — this is the job-seeker-facing application
// tracking feature, separate from /api/admin/*. Uses the normal RLS-scoped
// client so a user can only ever insert a row with their own user_id (the
// `with check (auth.uid() = user_id)` policy backs this up even though the
// server also sets user_id itself from the trusted session).
export async function POST(request: NextRequest) {
  const user = await getUser();
  if (!user) {
    return NextResponse.json({ error: "Sign in required." }, { status: 401 });
  }

  let body: { opportunityId?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const opportunityId = typeof body.opportunityId === "string" ? body.opportunityId : "";
  if (!opportunityId) {
    return NextResponse.json({ error: "opportunityId is required." }, { status: 400 });
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("user_applications")
    .insert({ user_id: user.id, opportunity_id: opportunityId });

  // 23505 = unique_violation — already marked applied, treat as success.
  if (error && error.code !== "23505") {
    return NextResponse.json({ error: "Could not mark as applied." }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
