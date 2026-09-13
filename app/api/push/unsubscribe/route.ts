import { NextResponse, type NextRequest } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

// Removes a browser's Push subscription — called when the visitor turns
// notifications back off. Endpoint-keyed, same as subscribe/route.ts.
export async function POST(request: NextRequest) {
  let body: { endpoint?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  if (!body.endpoint) {
    return NextResponse.json({ error: "Missing endpoint." }, { status: 400 });
  }

  const admin = createAdminClient();
  const { error } = await admin.from("push_subscriptions").delete().eq("endpoint", body.endpoint);

  if (error) {
    console.error("Could not remove push subscription:", error.message);
    return NextResponse.json({ error: "Could not remove subscription." }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
