import { NextResponse } from "next/server";

// Public story submission is turned off — stories are added by the admin
// only, via /api/admin/what-worked.
export function POST() {
  return NextResponse.json({ error: "Not available." }, { status: 404 });
}
