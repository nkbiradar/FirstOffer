// Reads for the "application tracking" feature — a signed-in user marking
// opportunities as applied and viewing that list on /applications. Unlike
// lib/data/admin-opportunities.ts, this deliberately uses the normal
// (cookie/RLS-scoped) client, not the service-role admin client: a user
// should only ever be able to see/change their own rows, and letting RLS
// enforce that (rather than trusting application code) is the safer
// default here. See supabase/schema.sql for the user_applications table
// and its RLS policies.
//
// Every function fails soft (logs + returns a safe empty value) because
// the user_applications table is an opt-in migration the admin runs by
// hand — until it exists, these should degrade to "no applications" rather
// than crash any page that calls them.

import { createClient } from "@/lib/supabase/server";
import type { OpportunityWithCompany } from "@/lib/data/opportunities";
import type { ApplicationOutcome } from "@/types/supabase";

const APPLICATION_OPPORTUNITY_SELECT =
  "applied_at, outcome, outcome_updated_at, opportunity:opportunities(*, company:companies(id, name, slug, logo_url))";

export async function isOpportunityApplied(userId: string, opportunityId: string): Promise<boolean> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("user_applications")
    .select("id")
    .eq("user_id", userId)
    .eq("opportunity_id", opportunityId)
    .maybeSingle();

  if (error) {
    console.error("isOpportunityApplied failed:", error.message);
    return false;
  }
  return Boolean(data);
}

export type AppliedOpportunity = OpportunityWithCompany & {
  applied_at: string;
  outcome: ApplicationOutcome | null;
  outcome_updated_at: string | null;
};

type AppliedRow = {
  applied_at: string;
  outcome: ApplicationOutcome | null;
  outcome_updated_at: string | null;
  opportunity: OpportunityWithCompany | null;
};

/** Opportunities a user has marked as applied, newest-first — for /applications. */
export async function getUserApplications(userId: string): Promise<AppliedOpportunity[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("user_applications")
    .select(APPLICATION_OPPORTUNITY_SELECT)
    .eq("user_id", userId)
    .order("applied_at", { ascending: false });

  if (error) {
    console.error("getUserApplications failed:", error.message);
    return [];
  }

  return ((data ?? []) as unknown as AppliedRow[])
    .filter((row): row is AppliedRow & { opportunity: OpportunityWithCompany } => row.opportunity !== null)
    .map((row) => ({
      ...row.opportunity,
      applied_at: row.applied_at,
      outcome: row.outcome,
      outcome_updated_at: row.outcome_updated_at,
    }));
}

const VALID_OUTCOMES: readonly ApplicationOutcome[] = ["interview", "offer", "rejected", "no_response"];

export function isValidOutcome(value: unknown): value is ApplicationOutcome {
  return typeof value === "string" && (VALID_OUTCOMES as readonly string[]).includes(value);
}

/**
 * Records what happened after a user applied — "did you hear back?" — for
 * their own application row only (RLS's `auth.uid() = user_id` on UPDATE
 * backs this up the same way it does insert/delete). Passing `null` clears
 * a previously-set outcome, in case someone picks the wrong button.
 */
export async function updateApplicationOutcome(
  userId: string,
  opportunityId: string,
  outcome: ApplicationOutcome | null,
): Promise<boolean> {
  const supabase = await createClient();
  const { error } = await supabase
    .from("user_applications")
    .update({ outcome, outcome_updated_at: outcome ? new Date().toISOString() : null })
    .eq("user_id", userId)
    .eq("opportunity_id", opportunityId);

  if (error) {
    console.error("updateApplicationOutcome failed:", error.message);
    return false;
  }
  return true;
}
