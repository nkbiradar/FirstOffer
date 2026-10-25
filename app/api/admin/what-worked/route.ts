import { NextResponse, type NextRequest } from "next/server";
import { refreshPublicData } from "@/lib/data/cached";
import { getAdminUser } from "@/lib/supabase/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { parseWhatWorkedForm } from "@/lib/data/what-worked";

// Admin-only: add a new "What Worked For Me" story from /admin/what-worked.
export async function POST(request: NextRequest) {
  if (!(await getAdminUser())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const row = parseWhatWorkedForm(await request.formData());
  if (!row.display_name || !row.what_changed || !row.result) {
    return NextResponse.redirect(
      new URL(`/admin/what-worked?error=${encodeURIComponent("Name, what they changed and result are required.")}`, request.url),
      303,
    );
  }
  const { error } = await createAdminClient().from("what_worked_stories").insert(row);
  const target = error ? `/admin/what-worked?error=${encodeURIComponent(error.message)}` : "/admin/what-worked?added=1";
  refreshPublicData();
  return NextResponse.redirect(new URL(target, request.url), 303);
}
