import { NextResponse, type NextRequest } from "next/server";
import { getUser } from "@/lib/supabase/auth";
import { createClient } from "@/lib/supabase/server";
import { GOAL_OPTIONS } from "@/lib/data/streak";

// Saves the signed-in student's weekly application goal (Dashboard streak
// card) on their own auth profile — no extra table needed.
export async function POST(request: NextRequest) {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "Sign in required." }, { status: 401 });

  let goal: unknown;
  try {
    goal = (await request.json())?.goal;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }
  if (!(GOAL_OPTIONS as readonly number[]).includes(Number(goal))) {
    return NextResponse.json({ error: "Invalid goal." }, { status: 400 });
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.updateUser({ data: { weekly_goal: Number(goal) } });
  if (error) return NextResponse.json({ error: "Could not save goal." }, { status: 500 });
  return NextResponse.json({ ok: true });
}
