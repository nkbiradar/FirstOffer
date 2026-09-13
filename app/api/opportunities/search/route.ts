import { NextResponse, type NextRequest } from "next/server";
import { getPublishedOpportunities } from "@/lib/data/opportunities";

// Lightweight public search used by the Resume Keyword Matcher's job
// picker (components/ResumeMatchTool.tsx) — a typeahead over live
// published opportunities. Read-only, no auth required, same published/
// non-expired filter every other public listing uses.
export async function GET(request: NextRequest) {
  const q = request.nextUrl.searchParams.get("q")?.trim() ?? "";
  if (q.length < 2) {
    return NextResponse.json({ opportunities: [] });
  }

  const { opportunities } = await getPublishedOpportunities({ query: q, pageSize: 8 });

  return NextResponse.json({
    opportunities: opportunities.map((opportunity) => ({
      id: opportunity.id,
      role: opportunity.role,
      company: opportunity.company?.name ?? null,
      location: opportunity.location,
      opportunityType: opportunity.opportunity_type,
    })),
  });
}
