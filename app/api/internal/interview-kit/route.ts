import { readFile } from "node:fs/promises";
import path from "node:path";
import { NextResponse, type NextRequest } from "next/server";
import { getUser } from "@/lib/supabase/auth";
import { hasInternalAccess } from "@/lib/data/subscriptions";

// Internal HR members-only download: the FirstOffer Coding Interview Kit.
// The PDF lives in /private (NOT /public), so the only way to get it is
// through this route, which checks sign-in + active Internal HR access.
// next.config.ts's outputFileTracingIncludes ships the file with this route.
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const FILE_NAME = "FirstOffer_Coding_Interview_Kit.pdf";

export async function GET(request: NextRequest) {
  const user = await getUser();
  if (!user) {
    return NextResponse.redirect(new URL("/login?next=/internal-openings", request.url));
  }
  if (!(await hasInternalAccess(user.id))) {
    return NextResponse.redirect(new URL("/internal-openings#unlock-internal-hr", request.url));
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
