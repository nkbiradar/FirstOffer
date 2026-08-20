import { NextResponse, type NextRequest } from "next/server";
import { getAdminUser } from "@/lib/supabase/auth";
import { createOpportunity } from "@/lib/data/admin-opportunities";
import { parseOpportunityFormData } from "@/lib/data/opportunity-form-data";
import type { OpportunityStatus } from "@/types/supabase";

// Not covered by middleware.ts (its matcher is only /admin/:path*), so every
// admin API route re-checks the session + ADMIN_EMAILS allowlist itself.
export async function POST(request: NextRequest) {
  const adminUser = await getAdminUser();
  if (!adminUser) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const formData = await request.formData();
  // The "Add Opportunity" form has two submit buttons instead of a status
  // field — name="intent" value="draft"|"publish" — a browser includes
  // whichever one was clicked in the submitted FormData.
  const status: OpportunityStatus = formData.get("intent") === "publish" ? "published" : "draft";
  const input = parseOpportunityFormData(formData, status);

  try {
    const opportunity = await createOpportunity(input);
    return NextResponse.redirect(
      new URL(`/admin/opportunities?created=${opportunity.id}`, request.url),
      303,
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to create opportunity.";
    // This is a plain HTML form post (no client JS driving it), so errors
    // redirect back to the form with the message in the query string rather
    // than returning JSON.
    return NextResponse.redirect(
      new URL(`/admin/opportunities/new?error=${encodeURIComponent(message)}`, request.url),
      303,
    );
  }
}
