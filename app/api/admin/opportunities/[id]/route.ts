import { NextResponse, type NextRequest } from "next/server";
import { revalidatePath } from "next/cache";
import { getAdminUser } from "@/lib/supabase/auth";
import {
  deleteOpportunity,
  getOpportunityByIdForAdmin,
  updateOpportunity,
} from "@/lib/data/admin-opportunities";
import { parseOpportunityFormData, str, VALID_STATUSES } from "@/lib/data/opportunity-form-data";
import { sendPushToAllSubscribers } from "@/lib/push/web-push-client";
import type { OpportunityStatus } from "@/types/supabase";

type RouteContext = { params: Promise<{ id: string }> };

// PATCH is the "correct" REST verb here; POST exists so the plain HTML edit
// form (no client JS) can submit to the same logic — browsers can't send
// PATCH from a <form>.
async function handleUpdate(request: NextRequest, context: RouteContext) {
  const adminUser = await getAdminUser();
  if (!adminUser) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await context.params;
  const formData = await request.formData();
  const statusValue = str(formData, "status");
  const status: OpportunityStatus = (VALID_STATUSES as readonly string[]).includes(statusValue)
    ? (statusValue as OpportunityStatus)
    : "draft";
  const input = parseOpportunityFormData(formData, status);

  try {
    const { opportunity, publishingNow } = await updateOpportunity(id, input);
    if (publishingNow) {
      void sendPushToAllSubscribers({
        title: "1 new opportunity just added!",
        body: `${opportunity.role} — go fast and apply before it's gone.`,
        url: `/opportunities/${opportunity.id}`,
      });
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to update opportunity.";
    return NextResponse.redirect(
      new URL(`/admin/opportunities/${id}/edit?error=${encodeURIComponent(message)}`, request.url),
      303,
    );
  }

  revalidatePath("/admin");
  revalidatePath("/admin/opportunities");
  revalidatePath("/admin/companies");
  return NextResponse.redirect(new URL("/admin/opportunities", request.url), 303);
}

export async function POST(request: NextRequest, context: RouteContext) {
  return handleUpdate(request, context);
}

export async function PATCH(request: NextRequest, context: RouteContext) {
  return handleUpdate(request, context);
}

export async function DELETE(_request: NextRequest, context: RouteContext) {
  const adminUser = await getAdminUser();
  if (!adminUser) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await context.params;
  const existing = await getOpportunityByIdForAdmin(id);
  if (!existing) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  try {
    await deleteOpportunity(id);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to delete opportunity.";
    return NextResponse.json({ error: message }, { status: 500 });
  }

  revalidatePath("/admin");
  revalidatePath("/admin/opportunities");
  return NextResponse.json({ ok: true });
}
