import { NextResponse, type NextRequest } from "next/server";
import { revalidatePath } from "next/cache";
import { getAdminUser } from "@/lib/supabase/auth";
import { createOpportunity } from "@/lib/data/admin-opportunities";
import { parseOpportunityBulkItem, type BulkOpportunityItem } from "@/lib/data/opportunity-form-data";
import { notifyBulkOpportunities } from "@/lib/notify/new-opportunity-alerts";

type BulkResult =
  | { index: number; success: true; id: string }
  | { index: number; success: false; error: string };

// Driven by fetch() from BulkImportClient (a JSON body, not a plain form —
// this is the one part of the daily workflow that genuinely needs client
// JS, since editing/removing individual parsed items before publishing
// can't reasonably be done with page reloads). Each item goes through the
// exact same createOpportunity() the single-opportunity form uses, so
// validation and company find-or-create behave identically either way.
// One item failing (e.g. missing company/role) doesn't abort the rest —
// the response reports per-item success/failure so the admin can see
// exactly which ones need fixing and re-submit just those.
export async function POST(request: NextRequest) {
  const adminUser = await getAdminUser();
  if (!adminUser) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: { items?: BulkOpportunityItem[] };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const items = Array.isArray(body.items) ? body.items : [];
  if (items.length === 0) {
    return NextResponse.json({ error: "No opportunities to publish." }, { status: 400 });
  }
  if (items.length > 100) {
    return NextResponse.json({ error: "Too many opportunities in one batch (max 100)." }, { status: 400 });
  }

  const results: BulkResult[] = [];
  let publishedPublicCount = 0;
  let publishedInternalCount = 0;

  // Sequential, not parallel: company find-or-create races (two brand-new
  // opportunities for the same new company, submitted in the same batch)
  // would otherwise be able to create duplicate company rows.
  for (let index = 0; index < items.length; index += 1) {
    try {
      const input = parseOpportunityBulkItem(items[index]);
      const opportunity = await createOpportunity(input);
      results.push({ index, success: true, id: opportunity.id });
      if (opportunity.status === "published") {
        if (opportunity.is_internal) publishedInternalCount += 1;
        else publishedPublicCount += 1;
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to create opportunity.";
      results.push({ index, success: false, error: message });
    }
  }

  // One batched "go fast and apply" push + email for the whole daily
  // import, not one per opportunity — a 20-item import shouldn't fire 20
  // notifications. Public and Internal HR items are announced separately
  // (see lib/notify/new-opportunity-alerts.ts) so an Internal HR opening
  // never leaks into the public "new opportunity" alert or links
  // subscribers to a page it isn't listed on. Never awaited into the
  // response's critical path: delivery is fire-and-forget from the
  // admin's point of view.
  notifyBulkOpportunities({ public: publishedPublicCount, internal: publishedInternalCount });

  // BulkImportClient only calls router.refresh() on its own page — that
  // does not clear the client-side Router Cache for OTHER already-visited
  // admin routes (Dashboard, Manage Opportunities), so without this,
  // navigating there via a <Link> click (not a hard reload) served stale
  // pre-import numbers. revalidatePath purges those cached entries too.
  revalidatePath("/admin");
  revalidatePath("/admin/opportunities");
  revalidatePath("/admin/companies");

  return NextResponse.json({ results });
}
