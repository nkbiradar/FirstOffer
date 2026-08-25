import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";

// Plain <form method="post"> target (no client JS) — same pattern as the
// rest of the app's mutations. Works for both admin and regular users;
// there's only one session/cookie, Google or password.
export async function POST(request: NextRequest) {
  const supabase = await createClient();
  await supabase.auth.signOut();
  return NextResponse.redirect(new URL("/", request.url), 303);
}
