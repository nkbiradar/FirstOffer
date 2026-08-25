import { NextResponse, type NextRequest } from "next/server";
import { getAdminUser } from "@/lib/supabase/auth";
import { createAdminClient } from "@/lib/supabase/admin";

type RouteContext = { params: Promise<{ id: string }> };

// Plain HTML form target (no client JS) for /admin/companies, matching the
// rest of the admin area's forms. POST exists because a <form> can't send
// PATCH directly; PATCH is also exposed for programmatic use.
async function handleUpdate(request: NextRequest, context: RouteContext) {
  const adminUser = await getAdminUser();
  if (!adminUser) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await context.params;
  const formData = await request.formData();
  const logoUrl = String(formData.get("logo_url") ?? "").trim();

  const admin = createAdminClient();
  const { error } = await admin
    .from("companies")
    .update({ logo_url: logoUrl || null })
    .eq("id", id);

  if (error) {
    return NextResponse.redirect(
      new URL(`/admin/companies?error=${encodeURIComponent(error.message)}`, request.url),
      303,
    );
  }

  return NextResponse.redirect(new URL("/admin/companies?updated=1", request.url), 303);
}

export async function POST(request: NextRequest, context: RouteContext) {
  return handleUpdate(request, context);
}

export async function PATCH(request: NextRequest, context: RouteContext) {
  return handleUpdate(request, context);
}
