import { NextResponse, type NextRequest } from "next/server";
import { getAdminUser } from "@/lib/supabase/auth";
import { createAdminClient } from "@/lib/supabase/admin";

type RouteContext = { params: Promise<{ id: string }> };

// Plain HTML form target for the publish/unpublish toggle on
// /admin/testimonials — matches app/api/admin/companies/[id]/route.ts.
export async function POST(request: NextRequest, context: RouteContext) {
  const adminUser = await getAdminUser();
  if (!adminUser) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await context.params;
  const formData = await request.formData();
  const isPublished = formData.get("is_published") === "true";

  const admin = createAdminClient();
  const { error } = await admin.from("testimonials").update({ is_published: isPublished }).eq("id", id);

  if (error) {
    return NextResponse.redirect(
      new URL(`/admin/testimonials?error=${encodeURIComponent(error.message)}`, request.url),
      303,
    );
  }

  return NextResponse.redirect(new URL("/admin/testimonials?updated=1", request.url), 303);
}

// DELETE, for DeleteTestimonialButton.tsx — HTML forms can't send DELETE
// directly, and a delete needs a confirmation prompt anyway (same reasoning
// as components/admin/DeleteOpportunityButton.tsx).
export async function DELETE(request: NextRequest, context: RouteContext) {
  const adminUser = await getAdminUser();
  if (!adminUser) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await context.params;
  const admin = createAdminClient();
  const { error } = await admin.from("testimonials").delete().eq("id", id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
