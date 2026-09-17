import { createHmac, timingSafeEqual } from "node:crypto";
import { createAdminClient } from "@/lib/supabase/admin";
import { getSiteUrl } from "@/lib/site-url";

/**
 * Signs a user id into a one-click unsubscribe link that works with no
 * session — the whole point, since an email can be opened on any device.
 * HMAC rather than a stored random token: nothing to generate, store, or
 * clean up, and it can't be forged without EMAIL_UNSUB_SECRET. Returns ""
 * (never matches) when the secret isn't configured yet.
 */
function sign(userId: string): string {
  const secret = process.env.EMAIL_UNSUB_SECRET;
  if (!secret) return "";
  return createHmac("sha256", secret).update(userId).digest("hex");
}

export function buildUnsubscribeUrl(userId: string): string {
  const token = sign(userId);
  return `${getSiteUrl()}/api/email/unsubscribe?uid=${encodeURIComponent(userId)}&token=${token}`;
}

export function verifyUnsubscribeToken(userId: string, token: string): boolean {
  const expected = sign(userId);
  if (!expected || !token) return false;
  const a = Buffer.from(expected);
  const b = Buffer.from(token);
  return a.length === b.length && timingSafeEqual(a, b);
}

/**
 * Whether this user has opted out of "new opportunity" email alerts —
 * checked from the dashboard toggle (app/api/email/preference/route.ts).
 * Fails open (false) on a DB error, same convention as the rest of the
 * data layer — never silently unsubscribe someone because of a glitch.
 */
export async function isEmailOptedOut(userId: string): Promise<boolean> {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("email_optouts")
    .select("user_id")
    .eq("user_id", userId)
    .maybeSingle();

  if (error) {
    console.error("isEmailOptedOut failed:", error.message);
    return false;
  }
  return Boolean(data);
}

export async function setEmailOptOut(userId: string, optOut: boolean): Promise<void> {
  const admin = createAdminClient();
  if (optOut) {
    const { error } = await admin.from("email_optouts").upsert({ user_id: userId });
    if (error) console.error("setEmailOptOut (on) failed:", error.message);
  } else {
    const { error } = await admin.from("email_optouts").delete().eq("user_id", userId);
    if (error) console.error("setEmailOptOut (off) failed:", error.message);
  }
}

/**
 * Every opted-out user id, for lib/email/resend-client.ts to filter the
 * full user list against before sending a batch. Takes an already-created
 * admin client so the caller (which also calls auth.admin.listUsers())
 * doesn't need a second one.
 */
export async function getOptedOutUserIds(
  admin: ReturnType<typeof createAdminClient>,
): Promise<Set<string>> {
  const { data, error } = await admin.from("email_optouts").select("user_id");
  if (error) {
    console.error("getOptedOutUserIds failed:", error.message);
    return new Set();
  }
  return new Set((data ?? []).map((row) => row.user_id as string));
}
