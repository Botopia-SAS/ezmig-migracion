CREATE TYPE "public"."business_entity_type" AS ENUM('sole_proprietor', 'llc_single_member', 'llc_multi_member', 'c_corp', 's_corp');--> statement-breakpoint
CREATE TYPE "public"."freelancer_type" AS ENUM('immigration_attorney', 'form_preparer');--> statement-breakpoint
CREATE TYPE "public"."language" AS ENUM('english', 'spanish', 'mandarin', 'cantonese', 'tagalog', 'vietnamese', 'korean', 'french', 'haitian_creole', 'portuguese', 'arabic', 'russian', 'other');--> statement-breakpoint
CREATE TYPE "public"."specialty" AS ENUM('asylum', 'tps', 'daca', 'adjustment_status_i485', 'family_petitions_i130', 'employment_petitions_i140', 'work_permit_i765', 'naturalization', 'deportation_defense', 'vawa', 'u_visa', 't_visa', 'other');--> statement-breakpoint
CREATE TYPE "public"."team_member_role" AS ENUM('attorney', 'paralegal', 'legal_assistant', 'admin_assistant', 'receptionist', 'other');--> statement-breakpoint
CREATE TYPE "public"."user_profile_type" AS ENUM('agency', 'team_member', 'freelancer');--> statement-breakpoint
CREATE TABLE "freelancers_profiles" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"professional_type" "freelancer_type" NOT NULL,
	"full_name" varchar(255),
	"email" varchar(255),
	"phone" varchar(20),
	"primary_state" varchar(2),
	"primary_city" varchar(100),
	"bar_number" varchar(100),
	"primary_bar_state" varchar(2),
	"additional_bar_states" varchar(2)[],
	"specialties" varchar(50)[],
	"custom_specialties" text[],
	"business_license_number" varchar(100),
	"disclaimer_accepted" boolean DEFAULT false,
	"disclaimer_accepted_at" timestamp,
	"has_business" boolean DEFAULT false,
	"business_name" varchar(255),
	"business_entity_type" "business_entity_type",
	"business_website" text,
	"profile_photo_url" text,
	"bio" text,
	"years_experience" integer,
	"languages" varchar(50)[],
	"custom_languages" text[],
	"office_address" text,
	"office_city" varchar(100),
	"office_state" varchar(2),
	"office_zip_code" varchar(20),
	"google_place_id" text,
	"coordinates_lat" text,
	"coordinates_lng" text,
	"linkedin_url" text,
	"personal_website" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "freelancers_profiles_user_id_unique" UNIQUE("user_id"),
	CONSTRAINT "freelancers_profiles_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "team_members_profiles" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"agency_id" integer NOT NULL,
	"full_name" varchar(255),
	"email" varchar(255),
	"phone" varchar(20),
	"role" "team_member_role" NOT NULL,
	"custom_role_description" text,
	"specialties" varchar(50)[],
	"custom_specialties" text[],
	"bar_number" varchar(100),
	"bar_state" varchar(2),
	"profile_photo_url" text,
	"bio" text,
	"languages" varchar(50)[],
	"custom_languages" text[],
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "team_members_profiles_user_id_unique" UNIQUE("user_id"),
	CONSTRAINT "team_members_profiles_email_unique" UNIQUE("email")
);
--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "profile_type" "user_profile_type";--> statement-breakpoint
ALTER TABLE "freelancers_profiles" ADD CONSTRAINT "freelancers_profiles_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "team_members_profiles" ADD CONSTRAINT "team_members_profiles_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "team_members_profiles" ADD CONSTRAINT "team_members_profiles_agency_id_teams_id_fk" FOREIGN KEY ("agency_id") REFERENCES "public"."teams"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_freelancers_profiles_type" ON "freelancers_profiles" USING btree ("professional_type");--> statement-breakpoint
CREATE INDEX "idx_freelancers_profiles_state" ON "freelancers_profiles" USING btree ("primary_state");--> statement-breakpoint
CREATE INDEX "idx_freelancers_profiles_specialties" ON "freelancers_profiles" USING btree ("specialties");--> statement-breakpoint
CREATE INDEX "idx_team_members_profiles_agency" ON "team_members_profiles" USING btree ("agency_id");--> statement-breakpoint
CREATE INDEX "idx_team_members_profiles_role" ON "team_members_profiles" USING btree ("role");--> statement-breakpoint
CREATE UNIQUE INDEX "idx_team_members_profiles_user_agency" ON "team_members_profiles" USING btree ("user_id","agency_id");