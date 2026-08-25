import { NextResponse, type NextRequest } from "next/server";
import { getAdminUser } from "@/lib/supabase/auth";
import { extractOpportunitiesWithAi } from "@/lib/ai/extract-opportunities";

// Admin-gated, same pattern as the other /api/admin/* routes — middleware.ts
// only guards page routes under /admin/*, so this checks the session itself.
export async function POST(request: NextRequest) {
  const adminUser = await getAdminUser();
  if (!adminUser) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: { text?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const text = typeof body.text === "string" ? body.text.trim() : "";
  if (!text) {
    return NextResponse.json({ error: "Paste some text first." }, { status: 400 });
  }
  if (text.length > 20000) {
    return NextResponse.json({ error: "That's too much text for one AI extraction (max ~20,000 characters) — split it into smaller pastes." }, { status: 400 });
  }

  const result = await extractOpportunitiesWithAi(text);
  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 502 });
  }

  return NextResponse.json({ items: result.items });
}
