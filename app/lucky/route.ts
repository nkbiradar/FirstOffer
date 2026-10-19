import { NextResponse, type NextRequest } from "next/server";
import { getAllPublishedOpportunityIds } from "@/lib/data/opportunities";

// "🎲 Try your luck" (homepage hero): sends the visitor to a random live,
// public opportunity. Internal HR openings are excluded by
// getAllPublishedOpportunityIds(). Falls back to the full list if none.
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const ids = await getAllPublishedOpportunityIds();
  const target = ids.length > 0 ? `/opportunities/${ids[Math.floor(Math.random() * ids.length)].id}` : "/opportunities";
  const res = NextResponse.redirect(new URL(target, request.url), 307);
  res.headers.set("Cache-Control", "no-store");
  return res;
}
