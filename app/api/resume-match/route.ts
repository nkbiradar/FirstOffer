import { NextResponse, type NextRequest } from "next/server";
import { getOpportunityById } from "@/lib/data/opportunities";
import { extractResumeText } from "@/lib/resume-match/extract-text";
import { buildJdKeywords, matchResumeToJd } from "@/lib/resume-match/match-engine";
import { checkRateLimit } from "@/lib/rate-limit";

// No sign-in required (matches the site's "browsing never requires an
// account" stance), so rate limiting here is IP-keyed rather than
// user-keyed — see app/api/payments/create-order/route.ts for the
// signed-in equivalent of this pattern.
function clientIp(request: NextRequest): string {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0]!.trim();
  return request.headers.get("x-real-ip") ?? "unknown";
}

// Resume Keyword Matcher: takes an uploaded resume + an opportunity id,
// extracts resume text in memory, compares it against that job's own
// posted skills/requirements, and returns matching/missing/related
// keywords plus a match %. Nothing here is persisted — the resume file and
// its extracted text exist only for the duration of this request and are
// never written to disk, Supabase Storage, or any table.
export async function POST(request: NextRequest) {
  const { allowed } = await checkRateLimit(`resume-match:${clientIp(request)}`, {
    windowSeconds: 60,
    maxHits: 8,
  });
  if (!allowed) {
    return NextResponse.json(
      { error: "Too many requests. Please wait a moment and try again." },
      { status: 429 },
    );
  }

  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return NextResponse.json({ error: "Invalid form submission." }, { status: 400 });
  }

  const opportunityId = String(formData.get("opportunityId") ?? "").trim();
  const file = formData.get("resume");

  if (!opportunityId) {
    return NextResponse.json({ error: "Pick a job to compare against first." }, { status: 400 });
  }
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "Upload a resume file." }, { status: 400 });
  }

  const opportunity = await getOpportunityById(opportunityId);
  if (!opportunity || opportunity.status !== "published") {
    return NextResponse.json({ error: "That opportunity isn't available anymore." }, { status: 404 });
  }

  const extracted = await extractResumeText(file);
  if (!extracted.ok) {
    return NextResponse.json({ error: extracted.error }, { status: 400 });
  }

  const jdKeywords = buildJdKeywords({
    skills: opportunity.skills ?? [],
    requirements: opportunity.requirements ?? [],
    responsibilities: opportunity.responsibilities ?? [],
    role: opportunity.role ?? "",
    eligibility: opportunity.eligibility,
    additionalDetails: opportunity.additional_details,
  });

  if (jdKeywords.length === 0) {
    return NextResponse.json(
      { error: "This opportunity doesn't list enough skills/requirements yet to compare against." },
      { status: 400 },
    );
  }

  const result = matchResumeToJd(extracted.text, jdKeywords);

  return NextResponse.json({
    role: opportunity.role,
    company: opportunity.company?.name ?? null,
    ...result,
  });
}
