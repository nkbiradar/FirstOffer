import { NextResponse, after, type NextRequest } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { checkRateLimit } from "@/lib/rate-limit";
import { getUser } from "@/lib/supabase/auth";
import { hasEverPaid } from "@/lib/data/subscriptions";
import { notifyAdmins } from "@/lib/email/admin-notify";

// Target for the /share-your-story form. Only signed-in users who have
// actually paid FirstOffer at least once (hasEverPaid) can submit. Every
// submission lands as a DRAFT (is_published = false, source = 'user') and
// the admin(s) in ADMIN_EMAILS get an email straight away; nothing reaches
// the site until the admin clicks Publish in /admin/testimonials. The
// account email / LinkedIn are stored only so the admin can verify.

const MAX = { name: 80, company: 100, role: 100, college: 120, batch: 10, quote: 400, email: 160, url: 300 };

function clip(value: FormDataEntryValue | null, max: number) {
  return String(value ?? "").trim().slice(0, max);
}

function back(request: NextRequest, params: string) {
  return NextResponse.redirect(new URL(`/share-your-story?${params}`, request.url), 303);
}

export async function POST(request: NextRequest) {
  const formData = await request.formData();

  // Honeypot: a hidden field real users never fill in. Bots that do get a
  // fake "thanks" so they don't retry.
  if (clip(formData.get("website"), 200)) {
    return back(request, "sent=1");
  }

  const user = await getUser();
  if (!user) {
    return NextResponse.redirect(new URL("/login?next=%2Fshare-your-story", request.url), 303);
  }
  if (!(await hasEverPaid(user.id))) {
    return back(request, `error=${encodeURIComponent("This form is only for FirstOffer members who have unlocked access.")}`);
  }

  const { allowed } = await checkRateLimit(`stories:${user.id}`, { windowSeconds: 3600, maxHits: 5 });
  if (!allowed) {
    return back(request, `error=${encodeURIComponent("Too many submissions — please try again in an hour.")}`);
  }

  const studentName = clip(formData.get("student_name"), MAX.name);
  const companyName = clip(formData.get("company_name"), MAX.company);
  const role = clip(formData.get("role"), MAX.role);
  const college = clip(formData.get("college"), MAX.college);
  const batch = clip(formData.get("graduation_batch"), MAX.batch);
  const quote = clip(formData.get("quote"), MAX.quote);
  const email = (user.email ?? "").slice(0, MAX.email);
  const linkedin = clip(formData.get("linkedin_url"), MAX.url);
  const outcome = formData.get("outcome") === "selected" ? "selected" : "interview";
  const consent = formData.get("consent") === "yes";

  if (!studentName || !companyName) {
    return back(request, `error=${encodeURIComponent("Please fill in your name and the company.")}`);
  }
  if (linkedin && !/^https?:\/\/([a-z0-9-]+\.)?linkedin\.com\//i.test(linkedin)) {
    return back(request, `error=${encodeURIComponent("LinkedIn link should start with https://linkedin.com/ (or leave it empty).")}`);
  }
  if (!consent) {
    return back(request, `error=${encodeURIComponent("Please tick the permission box so we can share your story.")}`);
  }

  const admin = createAdminClient();
  const { error } = await admin.from("testimonials").insert({
    student_name: studentName,
    company_name: companyName,
    role: role || null,
    outcome,
    quote: quote || null,
    college: college || null,
    graduation_batch: batch || null,
    is_published: false,
    source: "user",
    submitter_email: email || null,
    linkedin_url: linkedin || null,
    consent_given_at: new Date().toISOString(),
  });

  if (error) {
    console.error("Share-your-story insert failed:", error.message);
    return back(request, `error=${encodeURIComponent("Something went wrong saving your story — please try again.")}`);
  }

  // Email the admin right away — after() runs once the user's redirect has
  // been sent, so a slow mail provider never delays the "thank you" page.
  after(() =>
    notifyAdmins(
      `🎉 New story: ${studentName} — ${outcome === "selected" ? "got selected" : "got an interview"} at ${companyName}`,
      [
        ["Outcome", outcome === "selected" ? "Selected / offer" : "Interview call"],
        ["Name", studentName],
        ["Company", companyName],
        ["Role", role],
        ["College", college],
        ["Batch", batch],
        ["Story", quote],
        ["Account email", email],
        ["LinkedIn", linkedin],
      ],
      "/admin/testimonials",
      "Review & publish",
    ),
  );

  return back(request, "sent=1");
}
