import { NextResponse, after, type NextRequest } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { checkRateLimit } from "@/lib/rate-limit";
import { getUser } from "@/lib/supabase/auth";
import { notifyAdmins } from "@/lib/email/admin-notify";
import { APPLICATION_RANGES, WHAT_WORKED_TAGS } from "@/lib/data/what-worked";

// Target for /what-worked/share. Any signed-in user can submit; every
// submission is saved as a DRAFT and the admin is emailed. Nothing is shown
// publicly until it's published at /admin/what-worked.

const MAX = { name: 80, college: 120, batch: 10, role: 100, before: 400, changed: 800, result: 200 };

function clip(value: FormDataEntryValue | null, max: number) {
  return String(value ?? "").trim().slice(0, max);
}

function back(request: NextRequest, params: string) {
  return NextResponse.redirect(new URL(`/what-worked/share?${params}`, request.url), 303);
}

export async function POST(request: NextRequest) {
  const formData = await request.formData();
  if (clip(formData.get("website"), 200)) return back(request, "sent=1"); // honeypot

  const user = await getUser();
  if (!user) {
    return NextResponse.redirect(new URL("/login?next=%2Fwhat-worked%2Fshare", request.url), 303);
  }

  const { allowed } = await checkRateLimit(`what-worked:${user.id}`, { windowSeconds: 3600, maxHits: 3 });
  if (!allowed) return back(request, `error=${encodeURIComponent("Too many submissions — please try again in an hour.")}`);

  const displayName = clip(formData.get("display_name"), MAX.name);
  const whatChanged = clip(formData.get("what_changed"), MAX.changed);
  const result = clip(formData.get("result"), MAX.result);
  const consent = formData.get("consent") === "yes";
  const appsRaw = clip(formData.get("applications_before"), 20);
  const applicationsBefore = (APPLICATION_RANGES as readonly string[]).includes(appsRaw) ? appsRaw : null;
  const validTags = new Set<string>(WHAT_WORKED_TAGS.map((t) => t.slug));
  const tags = formData
    .getAll("tags")
    .map(String)
    .filter((t) => validTags.has(t));

  if (!displayName || !whatChanged || !result) {
    return back(request, `error=${encodeURIComponent("Please fill in your name, what you changed and what happened.")}`);
  }
  if (!consent) {
    return back(request, `error=${encodeURIComponent("Please tick the box confirming this is your real experience.")}`);
  }

  const row = {
    user_id: user.id,
    display_name: displayName,
    is_anonymous: formData.get("is_anonymous") === "yes",
    college: clip(formData.get("college"), MAX.college) || null,
    graduation_batch: clip(formData.get("graduation_batch"), MAX.batch) || null,
    target_role: clip(formData.get("target_role"), MAX.role) || null,
    applications_before: applicationsBefore,
    what_wasnt_working: clip(formData.get("what_wasnt_working"), MAX.before) || null,
    what_changed: whatChanged,
    result,
    tags: [...new Set(tags)],
    is_published: false,
    submitter_email: (user.email ?? "").slice(0, 160) || null,
    consent_given_at: new Date().toISOString(),
  };

  const { error } = await createAdminClient().from("what_worked_stories").insert(row);
  if (error) {
    console.error("what-worked insert failed:", error.message);
    return back(request, `error=${encodeURIComponent("Something went wrong saving your story — please try again.")}`);
  }

  after(() =>
    notifyAdmins(
      `💡 New "What Worked" story from ${row.is_anonymous ? "an anonymous student" : displayName}`,
      [
        ["Name", displayName + (row.is_anonymous ? " (wants to be anonymous)" : "")],
        ["College / batch", [row.college, row.graduation_batch].filter(Boolean).join(" · ")],
        ["Role", row.target_role ?? ""],
        ["Applications before", row.applications_before ?? ""],
        ["What wasn't working", row.what_wasnt_working ?? ""],
        ["What changed", whatChanged],
        ["Result", result],
        ["Account email", row.submitter_email ?? ""],
      ],
      "/admin/what-worked",
      "Review & publish",
    ),
  );

  return back(request, "sent=1");
}
