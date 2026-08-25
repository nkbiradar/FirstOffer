import { NextResponse, type NextRequest } from "next/server";
import { getUser } from "@/lib/supabase/auth";
import { createClient } from "@/lib/supabase/server";
import { isValidOutcome, updateApplicationOutcome } from "@/lib/data/user-applications";

type RouteContext = { params: Promise<{ opportunityId: string }> };

// Records the "did you hear back?" self-reported outcome — same
// signed-in-user-only, RLS-scoped shape as POST/DELETE below, not admin
// content. Body is `{ outcome: "interview" | "offer" | "rejected" |
// "no_response" | null }`; null clears a previously-set outcome.
export async function PATCH(request: NextRequest, context: RouteContext) {
  const user = await getUser();
  if (!user) {
    return NextResponse.json({ error: "Sign in required." }, { status: 401 });
  }

  let body: { outcome?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  if (body.outcome !== null && !isValidOutcome(body.outcome)) {
    return NextResponse.json({ error: "Invalid outcome." }, { status: 400 });
  }

  const { opportunityId } = await context.params;
  const ok = await updateApplicationOutcome(user.id, opportunityId, body.outcome);
  if (!ok) {
    return NextResponse.json({ error: "Could not update." }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}

// Un-marks an opportunity as applied. Scoped to the signed-in user via both
// the explicit .eq("user_id", ...) and RLS — see app/api/applications/route.ts.
export async function DELETE(_request: NextRequest, context: RouteContext) {
  const user = await getUser();
  if (!user) {
    return NextResponse.json({ error: "Sign in required." }, { status: 401 });
  }

  const { opportunityId } = await context.params;
  const supabase = await createClient();
  const { error } = await supabase
    .from("user_applications")
    .delete()
    .eq("user_id", user.id)
    .eq("opportunity_id", opportunityId);

  if (error) {
    return NextResponse.json({ error: "Could not remove." }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
