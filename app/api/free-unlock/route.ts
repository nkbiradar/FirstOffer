import { NextResponse, type NextRequest } from "next/server";
import { getUser } from "@/lib/supabase/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { checkRateLimit } from "@/lib/rate-limit";
import { getOpportunityWithExpiryStatus } from "@/lib/data/opportunities";
import { hasFullAccess } from "@/lib/data/opportunity-unlocks";

// Spends the account's one free unlock on a single public, live opportunity
// (components/FreeUnlockCard.tsx). The free_unlocks primary key on user_id
// is what guarantees one per account, even under double-clicks.
export async function POST(request: NextRequest) {
  const user = await getUser();
  if (!user) {
    return NextResponse.json({ error: "Please sign in first." }, { status: 401 });
  }

  const { allowed } = await checkRateLimit(`free-unlock:${user.id}`, { windowSeconds: 60, maxHits: 10 });
  if (!allowed) {
    return NextResponse.json({ error: "Too many requests. Please wait a moment." }, { status: 429 });
  }

  let opportunityId = "";
  try {
    opportunityId = String((await request.json()).opportunityId ?? "").trim();
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }
  if (!opportunityId) {
    return NextResponse.json({ error: "Missing opportunity." }, { status: 400 });
  }

  const { opportunity, isExpired } = await getOpportunityWithExpiryStatus(opportunityId);
  if (!opportunity || isExpired || opportunity.status !== "published") {
    return NextResponse.json({ error: "This opportunity is no longer open." }, { status: 404 });
  }
  if (opportunity.is_internal) {
    return NextResponse.json({ error: "The free unlock works on regular openings only." }, { status: 400 });
  }
  if (await hasFullAccess(user.id)) {
    return NextResponse.json({ ok: true, alreadyHasAccess: true });
  }

  const { error } = await createAdminClient()
    .from("free_unlocks")
    .insert({ user_id: user.id, opportunity_id: opportunityId });

  if (error) {
    if (error.code === "23505") {
      return NextResponse.json({ error: "You've already used your free unlock." }, { status: 409 });
    }
    console.error("free unlock insert failed:", error.message);
    return NextResponse.json({ error: "Something went wrong. Please try again." }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
