import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import type { Testimonial } from "@/types/supabase";

/**
 * Published testimonials for the homepage "Students Who Found Their Next
 * Opportunity" section (components/SuccessStories.tsx). RLS only allows
 * anonymous SELECT where is_published = true, so this is already scoped
 * correctly even with the plain (non-admin) client. Fails soft (empty
 * array) rather than crashing the homepage if the migration hasn't been
 * applied yet — same pattern as lib/data/opportunity-unlocks.ts.
 */
export async function getPublishedTestimonials(): Promise<Testimonial[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("testimonials")
    .select("*")
    .eq("is_published", true)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("getPublishedTestimonials failed:", error.message);
    return [];
  }

  return (data ?? []) as Testimonial[];
}

/** Every testimonial (published or not), for /admin/testimonials. */
export async function getAllTestimonialsForAdmin(): Promise<Testimonial[]> {
  const admin = createAdminClient();

  const { data, error } = await admin
    .from("testimonials")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("getAllTestimonialsForAdmin failed:", error.message);
    return [];
  }

  return (data ?? []) as Testimonial[];
}
