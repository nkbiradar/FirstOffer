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

  deadline: string | null;

  source: string;
  source_text: string;

  status: OpportunityStatus;

  imported_at: string;
  published_at: string | null;
  expires_at: string | null;
  created_at: string;
  updated_at: string;
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

  deadline?: string | null;

  source?: string;
  source_text: string;

  status?: OpportunityStatus;

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
