import { NextResponse, type NextRequest } from "next/server";
import { getAdminUser } from "@/lib/supabase/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { parseWhatWorkedForm } from "@/lib/data/what-worked";

type RouteContext = { params: Promise<{ id: string }> };

// Admin-only form target for /admin/what-worked:
// action = update (edit form) | publish | unpublish | delete.
export async function POST(request: NextRequest, context: RouteContext) {
  if (!(await getAdminUser())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id } = await context.params;
  const formData = await request.formData();
  const action = String(formData.get("action") ?? "");
  const table = createAdminClient().from("what_worked_stories");

  let error: { message: string } | null = null;
  if (action === "delete") {
    ({ error } = await table.delete().eq("id", id));
  } else if (action === "update") {
    const row = parseWhatWorkedForm(formData);
    if (!row.display_name || !row.what_changed || !row.result) {
      error = { message: "Name, what they changed and result are required." };
    } else {
      ({ error } = await table.update(row).eq("id", id));
    }
  } else {
    ({ error } = await table.update({ is_published: action === "publish" }).eq("id", id));
  }

  const target = error ? `/admin/what-worked?error=${encodeURIComponent(error.message)}` : "/admin/what-worked?updated=1";
  return NextResponse.redirect(new URL(target, request.url), 303);
}
