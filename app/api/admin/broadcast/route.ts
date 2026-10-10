import { NextResponse, type NextRequest } from "next/server";
import { getAdminUser } from "@/lib/supabase/auth";
import { sendEmailToAllUsers } from "@/lib/email/resend-client";

export const maxDuration = 60;

function escapeHtml(text: string): string {
  return text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

/** Plain text → safe HTML: escaped, URLs linked, line breaks kept. */
function toHtml(text: string): string {
  return escapeHtml(text)
    .replace(/(https?:\/\/[^\s<]+)/g, '<a href="$1" style="color:#4338ca;">$1</a>')
    .replace(/\r?\n/g, "<br>");
}

// Admin → "Email all users": sends one personal email to every signed-up
// user (skipping anyone who unsubscribed) via Resend, or a test to the
// admin's own address first.
export async function POST(request: NextRequest) {
  const admin = await getAdminUser();
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const form = await request.formData();
  const get = (k: string) => String(form.get(k) ?? "").trim();
  const subject = get("subject").slice(0, 150);
  const heading = get("heading").slice(0, 150) || subject;
  const message = get("message").slice(0, 5000);
  const ctaLabel = get("ctaLabel").slice(0, 60) || "Open FirstOffer";
  const ctaUrl = get("ctaUrl") || "/";
  const mode = get("mode");

  const back = (params: Record<string, string>) =>
    NextResponse.redirect(new URL(`/admin/broadcast?${new URLSearchParams(params)}`, request.url), 303);

  if (!subject || !message) return back({ error: "Subject and message are required." });
  if (!/^(https?:\/\/\S+|\/\S*)$/i.test(ctaUrl)) return back({ error: "Button link must start with https:// or /" });
  if (mode === "all" && form.get("confirm") !== "on") {
    return back({ error: "Tick the confirmation box to send to all users." });
  }

  const result = await sendEmailToAllUsers(
    { subject, heading, body: toHtml(message), ctaLabel, url: ctaUrl },
    {
      onlyEmails: mode === "all" ? undefined : [admin.email ?? ""],
      replyTo: process.env.SMTP_USER || undefined,
    },
  );

  if (!result.configured) return back({ error: "Email isn't configured (RESEND_API_KEY / RESEND_FROM_EMAIL)." });
  return back({ sent: String(result.sent), mode: mode === "all" ? "all" : "test" });
}
