import { NextResponse, type NextRequest } from "next/server";
import { revalidatePath } from "next/cache";
import { getAdminUser } from "@/lib/supabase/auth";
import { clearFreePick, setFreePick } from "@/lib/data/admin-opportunities";

type RouteContext = { params: Promise<{ id: string }> };

// Quick action from the admin list: a plain <form method="post"> with
// action=set|clear, so no client JS is needed.
export async function POST(request: NextRequest, context: RouteContext) {
  const adminUser = await getAdminUser();
  if (!adminUser) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await context.params;
  const formData = await request.formData();
  const action = String(formData.get("action") ?? "set");

  try {
    if (action === "clear") await clearFreePick(id);
    else await setFreePick(id);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed.";
    return NextResponse.redirect(
      new URL(`/admin/opportunities?error=${encodeURIComponent(message)}`, request.url),
      303,
    );
  }

  revalidatePath("/");
  revalidatePath("/admin/opportunities");
  revalidatePath(`/opportunities/${id}`);
  return NextResponse.redirect(new URL("/admin/opportunities", request.url), 303);
}
