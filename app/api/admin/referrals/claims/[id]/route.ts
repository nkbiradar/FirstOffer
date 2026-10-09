import { NextResponse, type NextRequest } from "next/server";
import { revalidatePath } from "next/cache";
import { getAdminUser } from "@/lib/supabase/auth";
import { setClaimStatus } from "@/lib/data/referral-rewards";

export async function POST(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  if (!(await getAdminUser())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await context.params;
  const form = await request.formData();
  const status = form.get("status") === "done" ? "done" : "pending";
  try {
    await setClaimStatus(id, status);
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Update failed";
    return NextResponse.redirect(new URL(`/admin/referrals?error=${encodeURIComponent(msg)}`, request.url), 303);
  }
  revalidatePath("/admin/referrals");
  return NextResponse.redirect(new URL("/admin/referrals", request.url), 303);
}
