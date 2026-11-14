import { readFile } from "node:fs/promises";
import path from "node:path";
import { NextResponse, type NextRequest } from "next/server";
import { getUser } from "@/lib/supabase/auth";
import { hasCareerKitAccess } from "@/lib/data/subscriptions";
import { getCareerKitFile } from "@/lib/career-kit";

// Career Kit 2027 downloads (?file=<key>, see lib/career-kit.ts). Files live
// in /private/career-kit, so this route — which checks sign-in + a paid
// career_kit purchase — is the only way to get them. next.config.ts's
// outputFileTracingIncludes ships the files with this route.
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const TYPES: Record<string, string> = {
  pdf: "application/pdf",
  docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  tex: "application/x-tex",
};

export async function GET(request: NextRequest) {
  const user = await getUser();
  if (!user) return NextResponse.redirect(new URL("/login?next=/career-kit", request.url));
  if (!(await hasCareerKitAccess(user.id))) return NextResponse.redirect(new URL("/career-kit#buy", request.url));

  const item = getCareerKitFile(request.nextUrl.searchParams.get("file"));
  if (!item) return NextResponse.json({ error: "Unknown file" }, { status: 404 });

  const bytes = await readFile(path.join(process.cwd(), "private", "career-kit", item.file));
  const ext = item.file.split(".").pop() ?? "pdf";
  return new NextResponse(new Uint8Array(bytes), {
    headers: {
      "Content-Type": TYPES[ext] ?? "application/octet-stream",
      "Content-Disposition": `attachment; filename="${item.file}"`,
      "Cache-Control": "private, no-store",
    },
  });
}
