import { NextResponse, type NextRequest } from "next/server";
import { getAdminUser } from "@/lib/supabase/auth";
import { createAdminClient } from "@/lib/supabase/admin";

type RouteContext = { params: Promise<{ id: string }> };

// Plain-form target for /admin/what-worked: action = publish | unpublish | delete.
export async function POST(request: NextRequest, context: RouteContext) {
  if (!(await getAdminUser())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id } = await context.params;
  const action = String((await request.formData()).get("action") ?? "");
  const table = createAdminClient().from("what_worked_stories");

  const { error } =
    action === "delete"
      ? await table.delete().eq("id", id)
      : await table.update({ is_published: action === "publish" }).eq("id", id);

  const target = error ? `/admin/what-worked?error=${encodeURIComponent(error.message)}` : "/admin/what-worked?updated=1";
  return NextResponse.redirect(new URL(target, request.url), 303);
}
