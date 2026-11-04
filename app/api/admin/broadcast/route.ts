import { NextResponse, type NextRequest } from "next/server";
import { getAdminUser } from "@/lib/supabase/auth";
import { queueBroadcast, sendBroadcastTest, type Audience } from "@/lib/email/broadcast";

export const maxDuration = 120;

// Admin → "Email users": a test goes to the admin right away; a real send
// is queued and goes out through the Hostinger mailbox in batches (see
// lib/email/broadcast.ts) to everyone, only paid members, or only students
// who haven't paid. Unsubscribed users are always skipped.
export async function POST(request: NextRequest) {
  const admin = await getAdminUser();
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const form = await request.formData();
  const get = (k: string) => String(form.get(k) ?? "").trim();
  const input = {
    subject: get("subject").slice(0, 150),
    heading: get("heading").slice(0, 150),
    message: get("message").slice(0, 6000),
    ctaLabel: get("ctaLabel").slice(0, 60),
    ctaUrl: get("ctaUrl") || "/",
  };
  const mode = get("mode");
  const audienceRaw = get("audience");
  const audience: Audience = audienceRaw === "paid" || audienceRaw === "unpaid" ? audienceRaw : "all";

  const back = (params: Record<string, string>) =>
    NextResponse.redirect(new URL(`/admin/broadcast?${new URLSearchParams(params)}`, request.url), 303);

  if (!input.subject || !input.message) return back({ error: "Subject and message are required." });
  if (!/^(https?:\/\/\S+|\/\S*)$/i.test(input.ctaUrl)) return back({ error: "Button link must start with https:// or /" });

  if (mode !== "send") {
    if (!admin.email) return back({ error: "Your admin account has no email address." });
    const err = await sendBroadcastTest(input, { email: admin.email, userId: admin.id, meta: admin.user_metadata });
    return err ? back({ error: `Test failed: ${err}` }) : back({ test: "1" });
  }

  if (form.get("confirm") !== "on") return back({ error: "Tick the confirmation box before sending." });
  const result = await queueBroadcast(input, audience);
  if (result.error) return back({ error: result.error, queued: String(result.queued) });
  return back({ queued: String(result.queued), audience });
}
