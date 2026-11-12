import { NextResponse, type NextRequest } from "next/server";
import { revalidatePath } from "next/cache";
import { getAdminUser } from "@/lib/supabase/auth";
import { createAdminClient } from "@/lib/supabase/admin";

type RouteContext = { params: Promise<{ id: string }> };

// Form target for the per-company buttons on /admin/referral-openings:
// action=close | reopen | delete.
export async function POST(request: NextRequest, context: RouteContext) {
  const adminUser = await getAdminUser();
  if (!adminUser) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await context.params;
  const action = String((await request.formData()).get("action") ?? "");
  const admin = createAdminClient();

  let error: { message: string } | null = null;
  if (action === "close" || action === "reopen") {
    ({ error } = await admin.from("referral_openings").update({ is_active: action === "reopen" }).eq("id", id));
  } else if (action === "delete") {
    ({ error } = await admin.from("referral_openings").delete().eq("id", id));
  } else {
    error = { message: "Unknown action." };
  }

  const q = error ? `error=${encodeURIComponent(error.message)}` : "updated=1";
  revalidatePath("/admin/referral-openings");
  revalidatePath("/internal-openings");
  return NextResponse.redirect(new URL(`/admin/referral-openings?${q}`, request.url), 303);
}
