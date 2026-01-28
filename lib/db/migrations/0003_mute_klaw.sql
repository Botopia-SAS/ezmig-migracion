DO $$ BEGIN
  CREATE TYPE "public"."case_priority" AS ENUM('low', 'normal', 'high', 'urgent');
EXCEPTION WHEN duplicate_object THEN null;
END $$;--> statement-breakpoint
DO $$ BEGIN
  CREATE TYPE "public"."case_status" AS ENUM('intake', 'in_progress', 'submitted', 'approved', 'denied', 'on_hold', 'closed');
EXCEPTION WHEN duplicate_object THEN null;
END $$;--> statement-breakpoint
DO $$ BEGIN
  CREATE TYPE "public"."case_type" AS ENUM('family_based', 'employment', 'asylum', 'naturalization', 'adjustment', 'removal_defense', 'visa', 'other');
EXCEPTION WHEN duplicate_object THEN null;
END $$;--> statement-breakpoint
DO $$ BEGIN
  CREATE TYPE "public"."form_status" AS ENUM('not_started', 'in_progress', 'completed', 'submitted');
EXCEPTION WHEN duplicate_object THEN null;
END $$;--> statement-breakpoint
DO $$ BEGIN
  CREATE TYPE "public"."notification_type" AS ENUM('case_update', 'form_completed', 'deadline', 'uscis_status', 'document_request', 'payment', 'system');
EXCEPTION WHEN duplicate_object THEN null;
END $$;--> statement-breakpoint
DO $$ BEGIN
  CREATE TYPE "public"."validation_status" AS ENUM('pending', 'valid', 'invalid', 'needs_review');
EXCEPTION WHEN duplicate_object THEN null;
END $$;--> statement-breakpoint
CREATE TABLE "ai_logs" (
	"id" serial PRIMARY KEY NOT NULL,
	"team_id" integer NOT NULL,
	"user_id" integer,
	"case_id" integer,
	"case_form_id" integer,
	"prompt" text NOT NULL,
	"context" jsonb,
	"response" text,
	"model" varchar(100),
	"tokens_used" integer,
	"action_type" varchar(50),
	"response_time_ms" integer,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "case_forms" (
	"id" serial PRIMARY KEY NOT NULL,
	"case_id" integer NOT NULL,
	"form_type_id" integer NOT NULL,
	"status" "form_status" DEFAULT 'not_started' NOT NULL,
	"progress_percentage" integer DEFAULT 0 NOT NULL,
	"form_data" jsonb DEFAULT '{}'::jsonb,
	"started_at" timestamp,
	"completed_at" timestamp,
	"submitted_at" timestamp,
	"token_consumed" boolean DEFAULT false NOT NULL,
	"token_transaction_id" integer,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "cases" (
	"id" serial PRIMARY KEY NOT NULL,
	"team_id" integer NOT NULL,
	"client_id" integer NOT NULL,
	"case_number" varchar(50),
	"uscis_receipt_number" varchar(20),
	"case_type" "case_type" NOT NULL,
	"status" "case_status" DEFAULT 'intake' NOT NULL,
	"priority" "case_priority" DEFAULT 'normal' NOT NULL,
	"intake_date" date DEFAULT now(),
	"filing_deadline" date,
	"submitted_date" date,
	"decision_date" date,
	"assigned_to" integer,
	"internal_notes" text,
	"created_by" integer,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"deleted_at" timestamp,
	CONSTRAINT "cases_case_number_unique" UNIQUE("case_number")
);
--> statement-breakpoint
CREATE TABLE "clients" (
	"id" serial PRIMARY KEY NOT NULL,
	"team_id" integer NOT NULL,
	"user_id" integer,
	"first_name" varchar(100) NOT NULL,
	"last_name" varchar(100) NOT NULL,
	"email" varchar(255) NOT NULL,
	"phone" varchar(20),
	"date_of_birth" date,
	"country_of_birth" varchar(100),
	"nationality" varchar(100),
	"alien_number" varchar(20),
	"uscis_online_account" varchar(100),
	"current_status" varchar(50),
	"address_line1" varchar(255),
	"address_line2" varchar(255),
	"city" varchar(100),
	"state" varchar(50),
	"zip_code" varchar(20),
	"country" varchar(100) DEFAULT 'USA',
	"notes" text,
	"created_by" integer,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"deleted_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "evidence_rules" (
	"id" serial PRIMARY KEY NOT NULL,
	"form_type_id" integer,
	"case_type" "case_type",
	"category" varchar(100) NOT NULL,
	"subcategory" varchar(100),
	"is_required" boolean DEFAULT false NOT NULL,
	"description" text,
	"instructions" text,
	"auto_validation_rules" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "evidences" (
	"id" serial PRIMARY KEY NOT NULL,
	"case_id" integer NOT NULL,
	"case_form_id" integer,
	"file_name" varchar(255) NOT NULL,
	"file_type" varchar(50),
	"file_size" integer,
	"file_url" varchar(500) NOT NULL,
	"category" varchar(100),
	"subcategory" varchar(100),
	"document_date" date,
	"validation_status" "validation_status" DEFAULT 'pending' NOT NULL,
	"validation_notes" text,
	"validated_by" integer,
	"validated_at" timestamp,
	"uploaded_by" integer,
	"uploaded_at" timestamp DEFAULT now() NOT NULL,
	"deleted_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "form_field_autosaves" (
	"id" serial PRIMARY KEY NOT NULL,
	"case_form_id" integer NOT NULL,
	"field_path" varchar(255) NOT NULL,
	"field_value" text,
	"saved_by" integer,
	"saved_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "form_submissions" (
	"id" serial PRIMARY KEY NOT NULL,
	"case_form_id" integer NOT NULL,
	"form_data_snapshot" jsonb NOT NULL,
	"submission_type" varchar(30),
	"status" varchar(30) DEFAULT 'pending' NOT NULL,
	"efiling_confirmation" varchar(100),
	"efiling_error" text,
	"pdf_version_id" integer,
	"submitted_by" integer,
	"submitted_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "form_types" (
	"id" serial PRIMARY KEY NOT NULL,
	"code" varchar(20) NOT NULL,
	"name" varchar(255) NOT NULL,
	"description" text,
	"form_schema" jsonb NOT NULL,
	"validation_rules" jsonb,
	"token_cost" integer DEFAULT 1 NOT NULL,
	"estimated_time_minutes" integer,
	"category" varchar(50),
	"uscis_edition" varchar(50),
	"version" integer DEFAULT 1 NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "form_types_code_unique" UNIQUE("code")
);
--> statement-breakpoint
CREATE TABLE "notifications" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"team_id" integer,
	"type" "notification_type" NOT NULL,
	"title" varchar(255) NOT NULL,
	"message" text,
	"case_id" integer,
	"case_form_id" integer,
	"is_read" boolean DEFAULT false NOT NULL,
	"read_at" timestamp,
	"action_url" varchar(255),
	"metadata" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "pdf_versions" (
	"id" serial PRIMARY KEY NOT NULL,
	"case_form_id" integer NOT NULL,
	"file_url" varchar(500) NOT NULL,
	"file_size" integer,
	"version" integer DEFAULT 1 NOT NULL,
	"is_final" boolean DEFAULT false NOT NULL,
	"generated_by" integer,
	"generated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "referral_link_usage" (
	"id" serial PRIMARY KEY NOT NULL,
	"referral_link_id" integer NOT NULL,
	"user_id" integer,
	"ip_address" varchar(50),
	"user_agent" text,
	"action" varchar(50),
	"metadata" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "referral_links" (
	"id" serial PRIMARY KEY NOT NULL,
	"team_id" integer NOT NULL,
	"case_id" integer,
	"client_id" integer,
	"code" varchar(50) NOT NULL,
	"expires_at" timestamp,
	"max_uses" integer DEFAULT 1 NOT NULL,
	"current_uses" integer DEFAULT 0 NOT NULL,
	"allowed_forms" jsonb,
	"allowed_sections" jsonb,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_by" integer,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "referral_links_code_unique" UNIQUE("code")
);
--> statement-breakpoint
CREATE TABLE "uscis_case_status" (
	"id" serial PRIMARY KEY NOT NULL,
	"case_id" integer NOT NULL,
	"receipt_number" varchar(20) NOT NULL,
	"current_status" varchar(255),
	"status_description" text,
	"last_checked_at" timestamp,
	"status_history" jsonb DEFAULT '[]'::jsonb,
	"notify_on_change" boolean DEFAULT true NOT NULL,
	"last_notified_status" varchar(255),
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "token_packages" ADD COLUMN "stripe_product_id" varchar(255);--> statement-breakpoint
ALTER TABLE "ai_logs" ADD CONSTRAINT "ai_logs_team_id_teams_id_fk" FOREIGN KEY ("team_id") REFERENCES "public"."teams"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ai_logs" ADD CONSTRAINT "ai_logs_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ai_logs" ADD CONSTRAINT "ai_logs_case_id_cases_id_fk" FOREIGN KEY ("case_id") REFERENCES "public"."cases"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ai_logs" ADD CONSTRAINT "ai_logs_case_form_id_case_forms_id_fk" FOREIGN KEY ("case_form_id") REFERENCES "public"."case_forms"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "case_forms" ADD CONSTRAINT "case_forms_case_id_cases_id_fk" FOREIGN KEY ("case_id") REFERENCES "public"."cases"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "case_forms" ADD CONSTRAINT "case_forms_form_type_id_form_types_id_fk" FOREIGN KEY ("form_type_id") REFERENCES "public"."form_types"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "case_forms" ADD CONSTRAINT "case_forms_token_transaction_id_token_transactions_id_fk" FOREIGN KEY ("token_transaction_id") REFERENCES "public"."token_transactions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cases" ADD CONSTRAINT "cases_team_id_teams_id_fk" FOREIGN KEY ("team_id") REFERENCES "public"."teams"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cases" ADD CONSTRAINT "cases_client_id_clients_id_fk" FOREIGN KEY ("client_id") REFERENCES "public"."clients"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cases" ADD CONSTRAINT "cases_assigned_to_users_id_fk" FOREIGN KEY ("assigned_to") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cases" ADD CONSTRAINT "cases_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "clients" ADD CONSTRAINT "clients_team_id_teams_id_fk" FOREIGN KEY ("team_id") REFERENCES "public"."teams"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "clients" ADD CONSTRAINT "clients_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "clients" ADD CONSTRAINT "clients_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "evidence_rules" ADD CONSTRAINT "evidence_rules_form_type_id_form_types_id_fk" FOREIGN KEY ("form_type_id") REFERENCES "public"."form_types"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "evidences" ADD CONSTRAINT "evidences_case_id_cases_id_fk" FOREIGN KEY ("case_id") REFERENCES "public"."cases"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "evidences" ADD CONSTRAINT "evidences_case_form_id_case_forms_id_fk" FOREIGN KEY ("case_form_id") REFERENCES "public"."case_forms"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "evidences" ADD CONSTRAINT "evidences_validated_by_users_id_fk" FOREIGN KEY ("validated_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "evidences" ADD CONSTRAINT "evidences_uploaded_by_users_id_fk" FOREIGN KEY ("uploaded_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "form_field_autosaves" ADD CONSTRAINT "form_field_autosaves_case_form_id_case_forms_id_fk" FOREIGN KEY ("case_form_id") REFERENCES "public"."case_forms"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "form_field_autosaves" ADD CONSTRAINT "form_field_autosaves_saved_by_users_id_fk" FOREIGN KEY ("saved_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "form_submissions" ADD CONSTRAINT "form_submissions_case_form_id_case_forms_id_fk" FOREIGN KEY ("case_form_id") REFERENCES "public"."case_forms"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "form_submissions" ADD CONSTRAINT "form_submissions_submitted_by_users_id_fk" FOREIGN KEY ("submitted_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_team_id_teams_id_fk" FOREIGN KEY ("team_id") REFERENCES "public"."teams"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_case_id_cases_id_fk" FOREIGN KEY ("case_id") REFERENCES "public"."cases"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_case_form_id_case_forms_id_fk" FOREIGN KEY ("case_form_id") REFERENCES "public"."case_forms"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pdf_versions" ADD CONSTRAINT "pdf_versions_case_form_id_case_forms_id_fk" FOREIGN KEY ("case_form_id") REFERENCES "public"."case_forms"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pdf_versions" ADD CONSTRAINT "pdf_versions_generated_by_users_id_fk" FOREIGN KEY ("generated_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "referral_link_usage" ADD CONSTRAINT "referral_link_usage_referral_link_id_referral_links_id_fk" FOREIGN KEY ("referral_link_id") REFERENCES "public"."referral_links"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "referral_link_usage" ADD CONSTRAINT "referral_link_usage_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "referral_links" ADD CONSTRAINT "referral_links_team_id_teams_id_fk" FOREIGN KEY ("team_id") REFERENCES "public"."teams"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "referral_links" ADD CONSTRAINT "referral_links_case_id_cases_id_fk" FOREIGN KEY ("case_id") REFERENCES "public"."cases"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "referral_links" ADD CONSTRAINT "referral_links_client_id_clients_id_fk" FOREIGN KEY ("client_id") REFERENCES "public"."clients"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "referral_links" ADD CONSTRAINT "referral_links_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "uscis_case_status" ADD CONSTRAINT "uscis_case_status_case_id_cases_id_fk" FOREIGN KEY ("case_id") REFERENCES "public"."cases"("id") ON DELETE no action ON UPDATE no action;