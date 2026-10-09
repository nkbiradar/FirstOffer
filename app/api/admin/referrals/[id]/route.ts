import { NextResponse, type NextRequest } from "next/server";
import { revalidatePath } from "next/cache";
import { getAdminUser } from "@/lib/supabase/auth";
import { updateInternshipApplication, type InternshipStatus } from "@/lib/data/referral-rewards";

const STATUSES: InternshipStatus[] = ["applied", "interview", "selected", "rejected", "completed"];

export async function POST(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  if (!(await getAdminUser())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await context.params;
  const form = await request.formData();
  const status = String(form.get("status") ?? "") as InternshipStatus;
  if (!STATUSES.includes(status)) {
    return NextResponse.redirect(new URL("/admin/referrals?error=Invalid%20status", request.url), 303);
  }
  try {
    await updateInternshipApplication(id, status, form.get("featured") === "on");
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Update failed";
    return NextResponse.redirect(new URL(`/admin/referrals?error=${encodeURIComponent(msg)}`, request.url), 303);
  }
  revalidatePath("/admin/referrals");
  revalidatePath("/");
  return NextResponse.redirect(new URL("/admin/referrals", request.url), 303);
}
