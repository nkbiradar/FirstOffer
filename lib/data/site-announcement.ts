import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import type { SiteAnnouncement } from "@/types/supabase";

const ANNOUNCEMENT_ID = "singleton";

/**
 * The live banner message for the homepage — null when there isn't one
 * currently posted. RLS already scopes public.site_announcement's SELECT
 * policy to is_active = true rows (see supabase/schema.sql), so the plain
 * client is enough here. Fails soft (null) rather than crashing the
 * homepage if the migration hasn't been applied yet — same convention as
 * every other public read in this codebase.
 */
export async function getActiveAnnouncement(): Promise<string | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("site_announcement")
    .select("message")
    .eq("id", ANNOUNCEMENT_ID)
    .eq("is_active", true)
    .maybeSingle();

  if (error) {
    console.error("getActiveAnnouncement failed:", error.message);
    return null;
  }
  return (data?.message as string | undefined) || null;
}

/**
 * The full row, including when inactive — for the admin dashboard's
 * editor, which needs to show (and pre-fill) the last posted message even
 * while it's turned off. Needs the service-role client since the public
 * RLS policy only ever exposes active rows.
 */
export async function getAnnouncementForAdmin(): Promise<SiteAnnouncement | null> {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("site_announcement")
    .select("*")
    .eq("id", ANNOUNCEMENT_ID)
    .maybeSingle();

  if (error) {
    console.error("getAnnouncementForAdmin failed:", error.message);
    return null;
  }
  return data as SiteAnnouncement | null;
}
