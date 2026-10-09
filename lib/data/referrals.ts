// Refer & Earn — see the "Refer & Earn" block in supabase/schema.sql.
//
// Rule: REFERRAL_SIGNUPS_REQUIRED friends sign up through your link AND at
// least REFERRAL_PAID_REQUIRED of them buy Full Access → 1 free month.
// Every further block earns another month.
//
// The free month is a normal `subscriptions` row (product full_access,
// status active, amount 0, no payment id), so every existing access check
// (hasFullAccess / isSubscriptionAccessActive) just works. Because it has
// no razorpay_payment_id, it never counts as "paid" anywhere (hasEverPaid,
// founding-member pricing, or as a paid referral for someone else).
import { randomBytes } from "crypto";
import { createAdminClient } from "@/lib/supabase/admin";

export const REFERRAL_SIGNUPS_REQUIRED = 20;
export const REFERRAL_PAID_REQUIRED = 10;
export const REFERRAL_REWARD_DAYS = 30;
export const REFERRAL_COOKIE = "fo_ref";

const CODE_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // no 0/O/1/I
export const REFERRAL_CODE_PATTERN = /^[A-HJ-NP-Z2-9]{7}$/;

function newCode(): string {
  const bytes = randomBytes(7);
  return Array.from(bytes, (b) => CODE_ALPHABET[b % CODE_ALPHABET.length]).join("");
}

export async function getOrCreateReferralCode(userId: string): Promise<string | null> {
  const admin = createAdminClient();
  const { data: existing } = await admin.from("referral_codes").select("code").eq("user_id", userId).maybeSingle();
  if (existing?.code) return existing.code as string;

  for (let attempt = 0; attempt < 5; attempt++) {
    const code = newCode();
    const { error } = await admin.from("referral_codes").insert({ user_id: userId, code });
    if (!error) return code;
    // Lost a race with another request creating this user's code.
    const { data: again } = await admin.from("referral_codes").select("code").eq("user_id", userId).maybeSingle();
    if (again?.code) return again.code as string;
    if (!/duplicate|unique/i.test(error.message)) {
      console.error("getOrCreateReferralCode failed:", error.message);
      return null;
    }
  }
  return null;
}

/**
 * Credits `code`'s owner with referring this user — only for a brand-new
 * account (created in the last 24h), never for yourself, and only once
 * per person ever (referred_id is unique).
 */
export async function recordReferral(
  newUser: { id: string; created_at?: string | null },
  code: string | null | undefined,
): Promise<void> {
  if (!code || !REFERRAL_CODE_PATTERN.test(code)) return;
  if (!newUser.created_at || Date.now() - new Date(newUser.created_at).getTime() > 24 * 60 * 60 * 1000) return;

  const admin = createAdminClient();
  const { data: owner } = await admin.from("referral_codes").select("user_id").eq("code", code).maybeSingle();
  if (!owner?.user_id || owner.user_id === newUser.id) return;

  const { error } = await admin.from("referrals").insert({ referrer_id: owner.user_id, referred_id: newUser.id });
  if (error && !/duplicate|unique/i.test(error.message)) console.error("recordReferral failed:", error.message);
}

export type ReferralStats = {
  code: string | null;
  signups: number;
  paid: number;
  rewardsEarned: number;
};

async function countPaid(referredIds: string[]): Promise<number> {
  if (referredIds.length === 0) return 0;
  const admin = createAdminClient();
  const [subs, unlocks] = await Promise.all([
    admin
      .from("subscriptions")
      .select("user_id")
      .in("user_id", referredIds)
      .eq("product", "full_access")
      .not("razorpay_payment_id", "is", null)
      .gt("amount_paise", 0),
    admin.from("opportunity_unlocks").select("user_id").in("user_id", referredIds).eq("status", "paid"),
  ]);
  const payers = new Set<string>();
  for (const row of subs.data ?? []) payers.add(row.user_id as string);
  for (const row of unlocks.data ?? []) payers.add(row.user_id as string);
  return payers.size;
}

/**
 * Grants any free months this user has earned but not yet received, then
 * returns their progress. Safe to call on every dashboard load: the
 * reward row is inserted first with a unique (referrer_id, reward_number),
 * so two simultaneous loads can't double-grant.
 */
export async function syncReferralRewards(userId: string): Promise<ReferralStats> {
  const admin = createAdminClient();
  const [code, { data: refs, error: refsError }, { data: rewards }] = await Promise.all([
    getOrCreateReferralCode(userId),
    admin.from("referrals").select("referred_id").eq("referrer_id", userId),
    admin.from("referral_rewards").select("reward_number").eq("referrer_id", userId),
  ]);
  if (refsError) {
    // Most likely the migration hasn't been run yet.
    console.error("syncReferralRewards failed:", refsError.message);
    return { code, signups: 0, paid: 0, rewardsEarned: 0 };
  }

  const referredIds = (refs ?? []).map((r) => r.referred_id as string);
  const signups = referredIds.length;
  const paid = await countPaid(referredIds);
  const earned = Math.min(
    Math.floor(signups / REFERRAL_SIGNUPS_REQUIRED),
    Math.floor(paid / REFERRAL_PAID_REQUIRED),
  );
  const granted = new Set((rewards ?? []).map((r) => r.reward_number as number));

  for (let n = 1; n <= earned; n++) {
    if (granted.has(n)) continue;
    const { data: reward, error } = await admin
      .from("referral_rewards")
      .insert({ referrer_id: userId, reward_number: n })
      .select("id")
      .single();
    if (error) continue; // already granted by a parallel request

    // Stack on top of any access they already have.
    const { data: current } = await admin
      .from("subscriptions")
      .select("current_period_end")
      .eq("user_id", userId)
      .eq("product", "full_access")
      .in("status", ["active", "cancelled"])
      .order("current_period_end", { ascending: false, nullsFirst: false })
      .limit(1);
    const currentEnd = current?.[0]?.current_period_end ? new Date(current[0].current_period_end as string) : null;
    const start = currentEnd && currentEnd.getTime() > Date.now() ? currentEnd : new Date();
    const end = new Date(start.getTime() + REFERRAL_REWARD_DAYS * 24 * 60 * 60 * 1000);

    const { data: sub, error: subError } = await admin
      .from("subscriptions")
      .insert({
        user_id: userId,
        product: "full_access",
        razorpay_subscription_id: `referral_${reward.id}`,
        razorpay_plan_id: "referral_reward",
        status: "active",
        amount_paise: 0,
        current_period_end: end.toISOString(),
      })
      .select("id")
      .single();
    if (subError) {
      console.error("Referral reward grant failed:", subError.message);
      await admin.from("referral_rewards").delete().eq("id", reward.id); // retry next load
      continue;
    }
    await admin.from("referral_rewards").update({ subscription_id: sub.id }).eq("id", reward.id);
  }

  return { code, signups, paid, rewardsEarned: earned };
}
