import { NextResponse, type NextRequest } from "next/server";
import { getAdminUser } from "@/lib/supabase/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import type { TestimonialOutcome } from "@/types/supabase";

// Plain HTML form target (no client JS), matching every other admin form
// in this app. Every row created here is a real student's real outcome,
// typed in by the admin one at a time — there's no bulk-seed path, on
// purpose (see the schema.sql comment on the testimonials table).
export async function POST(request: NextRequest) {
  const adminUser = await getAdminUser();
  if (!adminUser) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const formData = await request.formData();
  const studentName = String(formData.get("student_name") ?? "").trim();
  const companyName = String(formData.get("company_name") ?? "").trim();
  const role = String(formData.get("role") ?? "").trim();
  const outcomeRaw = String(formData.get("outcome") ?? "");
  const quote = String(formData.get("quote") ?? "").trim();

  if (!studentName || !companyName) {
    return NextResponse.redirect(
      new URL(
        `/admin/testimonials?error=${encodeURIComponent("Student name and company are required.")}`,
        request.url,
      ),
      303,
    );
  }

  const outcome: TestimonialOutcome = outcomeRaw === "selected" ? "selected" : "interview";

  const admin = createAdminClient();
  const { error } = await admin.from("testimonials").insert({
    student_name: studentName,
    company_name: companyName,
    role: role || null,
    outcome,
    quote: quote || null,
    is_published: true,
  });

  if (error) {
    return NextResponse.redirect(
      new URL(`/admin/testimonials?error=${encodeURIComponent(error.message)}`, request.url),
      303,
    );
  }

  return NextResponse.redirect(new URL("/admin/testimonials?added=1", request.url), 303);
}
