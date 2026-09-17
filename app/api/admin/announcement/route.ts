import { NextResponse, type NextRequest } from "next/server";
import { getAdminUser } from "@/lib/supabase/auth";
import { createAdminClient } from "@/lib/supabase/admin";

// Plain HTML form target (no client JS), matching every other admin form in
// this app (see components/admin/OpportunityForm.tsx's Save Draft/Publish
// pair for the same name="intent" pattern). Always upserts the single
// id: "singleton" row in public.site_announcement — there's only ever one
// live banner, so posting a new one just overwrites the last.
export async function POST(request: NextRequest) {
  const adminUser = await getAdminUser();
  if (!adminUser) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const formData = await request.formData();
  const intent = String(formData.get("intent") ?? "");
  const message = String(formData.get("message") ?? "").trim();

  if (intent === "post" && !message) {
    return NextResponse.redirect(
      new URL(`/admin?announcement_error=${encodeURIComponent("Write a message before posting.")}`, request.url),
      303,
    );
  }
  if (intent !== "post" && intent !== "remove") {
    return NextResponse.redirect(
      new URL(`/admin?announcement_error=${encodeURIComponent("Unknown action.")}`, request.url),
      303,
    );
  }

  const admin = createAdminClient();
  // The message is always saved as typed, even on "remove" — that way
  // turning the banner back on later re-posts the same wording instead of
  // starting from a blank textarea.
  const { error } = await admin.from("site_announcement").upsert(
    {
      id: "singleton",
      message,
      is_active: intent === "post",
      updated_at: new Date().toISOString(),
    },
    { onConflict: "id" },
  );

  if (error) {
    return NextResponse.redirect(
      new URL(`/admin?announcement_error=${encodeURIComponent(error.message)}`, request.url),
      303,
    );
  }

  return NextResponse.redirect(
    new URL(`/admin?announcement_status=${intent === "post" ? "posted" : "removed"}`, request.url),
    303,
  );
}
