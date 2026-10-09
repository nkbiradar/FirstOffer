// Refer & Earn reward ladder beyond the free month (see lib/data/referrals.ts
// for the free month itself, and the "certificates + Growth Internship"
// block in supabase/schema.sql). All service-role; tables have RLS on and
// no public policies.
import { randomBytes } from "crypto";
import { createAdminClient } from "@/lib/supabase/admin";

export const AMBASSADOR_PAID_REQUIRED = 15;
export const INTERNSHIP_PAID_REQUIRED = 25;
export const INTERNSHIP_STIPEND_INR = 15000;

export type CertificateKind = "ambassador" | "internship";
export type Certificate = {
  id: string;
  user_id: string;
  kind: CertificateKind;
  full_name: string;
  paid_referrals: number;
  issued_at: string;
};

export type InternshipStatus = "applied" | "interview" | "selected" | "rejected" | "completed";
export type InternshipApplication = {
  id: string;
  user_id: string;
  full_name: string;
  email: string;
  phone: string;
  college: string;
  linkedin_url: string | null;
  why: string | null;
  paid_referrals: number;
  status: InternshipStatus;
  featured: boolean;
  created_at: string;
};

const ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
export const CERTIFICATE_ID_PATTERN = /^FO-[A-HJ-NP-Z2-9]{8}$/;
function newCertificateId() {
  return "FO-" + Array.from(randomBytes(8), (b) => ALPHABET[b % ALPHABET.length]).join("");
}

export function displayName(user: { email?: string | null; user_metadata?: Record<string, unknown> | null }): string {
  const meta = user.user_metadata ?? {};
  const name = (meta.full_name || meta.name) as string | undefined;
  return (name && name.trim()) || (user.email ? user.email.split("@")[0] : "FirstOffer Member");
}

/** Issues (once) a certificate of this kind; returns the existing one if already issued. */
export async function issueCertificate(
  userId: string,
  kind: CertificateKind,
  fullName: string,
  paidReferrals: number,
): Promise<Certificate | null> {
  const admin = createAdminClient();
  const existing = await getUserCertificate(userId, kind);
  if (existing) return existing;
  for (let i = 0; i < 5; i++) {
    const { data, error } = await admin
      .from("certificates")
      .insert({ id: newCertificateId(), user_id: userId, kind, full_name: fullName, paid_referrals: paidReferrals })
      .select("*")
      .single();
    if (!error) return data as Certificate;
    const again = await getUserCertificate(userId, kind);
    if (again) return again;
    if (!/duplicate|unique/i.test(error.message)) {
      console.error("issueCertificate failed:", error.message);
      return null;
    }
  }
  return null;
}

export async function getUserCertificate(userId: string, kind: CertificateKind): Promise<Certificate | null> {
  const { data, error } = await createAdminClient()
    .from("certificates")
    .select("*")
    .eq("user_id", userId)
    .eq("kind", kind)
    .maybeSingle();
  if (error) return null;
  return (data as Certificate) ?? null;
}

export async function getCertificateById(id: string): Promise<Certificate | null> {
  if (!CERTIFICATE_ID_PATTERN.test(id)) return null;
  const { data, error } = await createAdminClient().from("certificates").select("*").eq("id", id).maybeSingle();
  if (error) return null;
  return (data as Certificate) ?? null;
}

export async function getInternshipApplication(userId: string): Promise<InternshipApplication | null> {
  const { data, error } = await createAdminClient()
    .from("internship_applications")
    .select("*")
    .eq("user_id", userId)
    .maybeSingle();
  if (error) return null;
  return (data as InternshipApplication) ?? null;
}

export async function getAllInternshipApplications(): Promise<InternshipApplication[]> {
  const { data, error } = await createAdminClient()
    .from("internship_applications")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) {
    console.error("getAllInternshipApplications failed:", error.message);
    return [];
  }
  return (data ?? []) as InternshipApplication[];
}

export async function getFeaturedInterns(): Promise<{ full_name: string; college: string }[]> {
  const { data, error } = await createAdminClient()
    .from("internship_applications")
    .select("full_name, college")
    .eq("status", "completed")
    .eq("featured", true)
    .order("updated_at", { ascending: false })
    .limit(12);
  if (error) return [];
  return (data ?? []) as { full_name: string; college: string }[];
}

/** Admin: change status; "completed" issues the internship certificate. */
export async function updateInternshipApplication(
  id: string,
  status: InternshipStatus,
  featured: boolean,
): Promise<void> {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("internship_applications")
    .update({ status, featured: status === "completed" && featured, updated_at: new Date().toISOString() })
    .eq("id", id)
    .select("*")
    .single();
  if (error) throw new Error(error.message);
  const app = data as InternshipApplication;
  if (status === "completed") {
    await issueCertificate(app.user_id, "internship", app.full_name, app.paid_referrals);
  }
}
