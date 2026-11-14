import { NextResponse, type NextRequest } from "next/server";
import { revalidatePath } from "next/cache";
import { getAdminUser } from "@/lib/supabase/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { REFERRAL_EXTRA_FIELDS, cleanUrl, type ReferralFields } from "@/lib/data/referral-openings";

// Plain HTML form target for the "Add referral company" form on
// /admin/referral-openings.
export async function POST(request: NextRequest) {
  const adminUser = await getAdminUser();
  if (!adminUser) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const fd = await request.formData();
  const text = (k: string, max: number) => String(fd.get(k) ?? "").trim().slice(0, max);
  const back = (q: string) => NextResponse.redirect(new URL(`/admin/referral-openings?${q}`, request.url), 303);

  const company = text("company", 120);
  if (!company) return back(`error=${encodeURIComponent("Company name is required.")}`);
  const applyBy = text("apply_by", 10);
  if (applyBy && !/^\d{4}-\d{2}-\d{2}$/.test(applyBy)) return back(`error=${encodeURIComponent("Invalid apply-by date.")}`);

  const jdUrl = cleanUrl(fd.get("jd_url"));
  const applyUrl = cleanUrl(fd.get("apply_url"));
  if (jdUrl === null) return back(`error=${encodeURIComponent("JD link isn't a valid URL.")}`);
  if (applyUrl === null) return back(`error=${encodeURIComponent("Apply link isn't a valid URL.")}`);

  const fields: ReferralFields = {};
  for (const f of REFERRAL_EXTRA_FIELDS) {
    const mode = String(fd.get(`field_${f.key}`) ?? "off");
    if (mode === "required" || mode === "optional") fields[f.key] = mode;
  }

  const admin = createAdminClient();
  const { error } = await admin.from("referral_openings").insert({
    company,
    role: text("role", 160) || null,
    location: text("location", 120) || null,
    details: text("details", 3000) || null,
    apply_by: applyBy || null,
    batch: text("batch", 120) || null,
    ctc: text("ctc", 80) || null,
    job_id: text("job_id", 80) || null,
    jd_url: jdUrl || null,
    apply_url: applyUrl || null,
    applicant_note: text("applicant_note", 300) || null,
    fields,
  });
  if (error) return back(`error=${encodeURIComponent(error.message)}`);

  revalidatePath("/admin/referral-openings");
  revalidatePath("/internal-openings");
  return back("added=1");
}
