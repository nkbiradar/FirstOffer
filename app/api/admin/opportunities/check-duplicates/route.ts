import { NextResponse, type NextRequest } from "next/server";
import { getAdminUser } from "@/lib/supabase/auth";
import { createAdminClient } from "@/lib/supabase/admin";

type CheckItem = { company?: string; role?: string };
type DbRow = { id: string; role: string; status: string; company: { name: string } | null };

function key(company: string, role: string) {
  return `${company.trim().toLowerCase()}|${role.trim().toLowerCase()}`;
}

// Checks a batch of {company, role} pairs (typically from the bulk-import
// preview) against every opportunity already in the database — not just
// the other items in the same batch, which is all BulkImportClient's
// existing client-side duplicate flag can see. Admin-gated, same pattern as
// the other /api/admin/* routes.
export async function POST(request: NextRequest) {
  const adminUser = await getAdminUser();
  if (!adminUser) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: { items?: CheckItem[] };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const items = Array.isArray(body.items) ? body.items : [];
  if (items.length === 0) {
    return NextResponse.json({ matches: [] });
  }

  const admin = createAdminClient();
  const { data, error } = await admin
    .from("opportunities")
    .select("id, role, status, company:companies(name)")
    .limit(2000);

  if (error) {
    return NextResponse.json({ error: "Could not check for duplicates." }, { status: 500 });
  }

  const existingByKey = new Map<string, { id: string; status: string }>();
  for (const row of (data ?? []) as unknown as DbRow[]) {
    existingByKey.set(key(row.company?.name ?? "", row.role), { id: row.id, status: row.status });
  }

  const matches = items
    .map((item, index) => {
      const existing = existingByKey.get(key(item.company ?? "", item.role ?? ""));
      return existing ? { index, existingId: existing.id, existingStatus: existing.status } : null;
    })
    .filter((match): match is { index: number; existingId: string; existingStatus: string } => match !== null);

  return NextResponse.json({ matches });
}
