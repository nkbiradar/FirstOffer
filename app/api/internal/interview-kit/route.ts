import { readFile } from "node:fs/promises";
import path from "node:path";
import { NextResponse, type NextRequest } from "next/server";
import { getUser } from "@/lib/supabase/auth";
import { hasInternalAccess } from "@/lib/data/subscriptions";

// Internal HR members-only downloads: the FirstOffer interview kits
// (?kit=coding | sql | python | excel | ml | genai; default coding).
// The PDF lives in /private (NOT /public), so the only way to get it is
// through this route, which checks sign-in + active Internal HR access.
// next.config.ts's outputFileTracingIncludes ships the file with this route.
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Fixed allowlist — the query param never becomes part of a file path.
const KITS: Record<string, string> = {
  coding: "FirstOffer_Coding_Interview_Kit.pdf",
  sql: "FirstOffer_SQL_Interview_Kit.pdf",
  python: "FirstOffer_Python_Pandas_Interview_Kit.pdf",
  excel: "FirstOffer_Excel_Stats_PowerBI_Interview_Kit.pdf",
  ml: "FirstOffer_Machine_Learning_Interview_Kit.pdf",
  genai: "FirstOffer_GenAI_LLM_Interview_Kit.pdf",
};

export async function GET(request: NextRequest) {
  const user = await getUser();
  if (!user) {
    return NextResponse.redirect(new URL("/login?next=/internal-openings", request.url));
  }
  if (!(await hasInternalAccess(user.id))) {
    return NextResponse.redirect(new URL("/internal-openings#unlock-internal-hr", request.url));
  }

  const kit = request.nextUrl.searchParams.get("kit") ?? "coding";
  const FILE_NAME = Object.prototype.hasOwnProperty.call(KITS, kit) ? KITS[kit] : undefined;
  if (!FILE_NAME) {
    return NextResponse.json({ error: "Unknown kit" }, { status: 404 });
  }

  const pdf = await readFile(path.join(process.cwd(), "private", FILE_NAME));
  return new NextResponse(new Uint8Array(pdf), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${FILE_NAME}"`,
      "Cache-Control": "private, no-store",
    },
  });
}
