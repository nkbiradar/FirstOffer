// Supabase Database Types — keep in sync with supabase/schema.sql

import type { Session, User } from "@supabase/supabase-js";

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type OpportunityType = "internship" | "full_time";
export type WorkMode = "remote" | "hybrid" | "onsite";
export type OpportunityStatus = "draft" | "published" | "expired";
export type ApplicationOutcome = "interview" | "offer" | "rejected" | "no_response";
export type TestimonialOutcome = "interview" | "selected";

// The single admin-postable homepage banner row — see the design note on
// public.site_announcement in supabase/schema.sql. Always id: "singleton".
export interface SiteAnnouncement {
  id: string;
  message: string;
  is_active: boolean;
  updated_at: string;
}

export interface Testimonial {
  id: string;
  student_name: string;
  company_name: string;
  role: string | null;
  outcome: TestimonialOutcome;
  quote: string | null;
  is_published: boolean;
  created_at: string;
  // College/batch/rating/avatar — added for the homepage "Success Stories"
  // card grid (components/SuccessStories.tsx). Nullable: rows created
  // before this migration have none of these set.
  college: string | null;
  graduation_batch: string | null;
  rating: number | null;
  avatar_url: string | null;
}

export interface TestimonialInsert {
  id?: string;
  student_name: string;
  company_name: string;
  role?: string | null;
  outcome: TestimonialOutcome;
  quote?: string | null;
  is_published?: boolean;
  created_at?: string;
  college?: string | null;
  graduation_batch?: string | null;
  rating?: number | null;
  avatar_url?: string | null;
}

export interface Company {
  id: string;
  name: string;
  slug: string;
  logo_url: string | null;
  website: string | null;
  description: string | null;
  created_at: string;
}

export interface CompanyInsert {
  id?: string;
  name: string;
  slug: string;
  logo_url?: string | null;
  website?: string | null;
  description?: string | null;
  created_at?: string;
}

export type CompanyUpdate = Partial<CompanyInsert>;

export interface Opportunity {
  id: string;
  company_id: string | null;

  role: string;
  opportunity_type: OpportunityType | null;

  batch: string[];
  degree: string[];
  branches: string[];

  stipend: string | null;
  salary: string | null;

  location: string | null;
  work_mode: WorkMode | null;

  skills: string[];
  responsibilities: string[];
  requirements: string[];
  eligibility: string | null;
  additional_details: string | null;

  application_url: string | null;
  google_form_url: string | null;
  hr_email: string | null;
  hr_contact: string | null;
  how_to_apply: string | null;

  // The expected answer to a "gatekeeping" question some (not all)
  // application forms ask (e.g. "Name of Premium Membership group?"),
  // proving the applicant is a real paying subscriber. Only shown to
  // unlocked/subscribed viewers — see supabase/schema.sql's note on this
  // column and app/opportunities/[id]/page.tsx.
  premium_group_hint: string | null;

  deadline: string | null;

  source: string;
  source_text: string;

  status: OpportunityStatus;

  // Part of the ₹39/month "Internal HR Openings" product, not the regular
  // free-to-browse listings — see supabase/schema.sql's note on this
  // column and lib/data/opportunities.ts's applyPublishedFilter/
  // getInternalOpportunities.
  is_internal: boolean;

  imported_at: string;
  published_at: string | null;
  expires_at: string | null;
  created_at: string;
  updated_at: string;

  // Null until the daily digest cron has emailed this opportunity out —
  // see lib/email/opportunity-digest.ts and the migration note at the end
  // of supabase/schema.sql.
  email_digest_sent_at: string | null;
}

export interface OpportunityInsert {
  id?: string;
  company_id?: string | null;

  role: string;
  opportunity_type?: OpportunityType | null;

  batch?: string[];
  degree?: string[];
  branches?: string[];

  stipend?: string | null;
  salary?: string | null;

  location?: string | null;
  work_mode?: WorkMode | null;

  skills?: string[];
  responsibilities?: string[];
  requirements?: string[];
  eligibility?: string | null;
  additional_details?: string | null;

  application_url?: string | null;
  google_form_url?: string | null;
  hr_email?: string | null;
  hr_contact?: string | null;
  how_to_apply?: string | null;
  premium_group_hint?: string | null;

  deadline?: string | null;

  source?: string;
  source_text: string;

  status?: OpportunityStatus;

  is_internal?: boolean;

  imported_at?: string;
  published_at?: string | null;
  expires_at?: string | null;
  created_at?: string;
  updated_at?: string;
}

export type OpportunityUpdate = Partial<OpportunityInsert>;

// Google-authenticated job seekers marking an opportunity as "applied" —
// see supabase/schema.sql's user_applications table. Not referenced by the
// untyped Database interface below (lib/data/user-applications.ts queries
// it directly, same untyped-client convention as the rest of the data
// layer), kept here just so the row shape is documented alongside the rest.
export interface UserApplication {
  id: string;
  user_id: string;
  opportunity_id: string;
  applied_at: string;
  outcome: ApplicationOutcome | null;
  outcome_updated_at: string | null;
}

export interface Database {
  public: {
    Tables: {
      companies: {
        Row: Company;
        Insert: CompanyInsert;
        Update: CompanyUpdate;
        Relationships: [];
      };
      opportunities: {
        Row: Opportunity;
        Insert: OpportunityInsert;
        Update: OpportunityUpdate;
        Relationships: [
          {
            foreignKeyName: "opportunities_company_id_fkey";
            columns: ["company_id"];
            referencedRelation: "companies";
            referencedColumns: ["id"];
          },
        ];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
  };
}

export type AuthUser = User;
export type AuthSession = Session;
