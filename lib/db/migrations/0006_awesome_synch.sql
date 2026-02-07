CREATE TYPE "public"."agency_status" AS ENUM('incomplete', 'pending', 'active', 'suspended', 'inactive');--> statement-breakpoint
CREATE TYPE "public"."agency_type" AS ENUM('law_firm', 'immigration_services');--> statement-breakpoint
ALTER TABLE "teams" ADD COLUMN "agency_type" "agency_type";--> statement-breakpoint
ALTER TABLE "teams" ADD COLUMN "agency_status" "agency_status" DEFAULT 'incomplete';--> statement-breakpoint
ALTER TABLE "teams" ADD COLUMN "completion_percentage" integer DEFAULT 0;--> statement-breakpoint
ALTER TABLE "teams" ADD COLUMN "legal_business_name" varchar(255);--> statement-breakpoint
ALTER TABLE "teams" ADD COLUMN "business_name_dba" varchar(255);--> statement-breakpoint
ALTER TABLE "teams" ADD COLUMN "business_email" varchar(255);--> statement-breakpoint
ALTER TABLE "teams" ADD COLUMN "business_phone" varchar(20);--> statement-breakpoint
ALTER TABLE "teams" ADD COLUMN "website" varchar(500);--> statement-breakpoint
ALTER TABLE "teams" ADD COLUMN "address" varchar(255);--> statement-breakpoint
ALTER TABLE "teams" ADD COLUMN "city" varchar(100);--> statement-breakpoint
ALTER TABLE "teams" ADD COLUMN "state" varchar(50);--> statement-breakpoint
ALTER TABLE "teams" ADD COLUMN "zip_code" varchar(20);--> statement-breakpoint
ALTER TABLE "teams" ADD COLUMN "country" varchar(100) DEFAULT 'USA';--> statement-breakpoint
ALTER TABLE "teams" ADD COLUMN "google_place_id" varchar(255);--> statement-breakpoint
ALTER TABLE "teams" ADD COLUMN "coordinates_lat" varchar(50);--> statement-breakpoint
ALTER TABLE "teams" ADD COLUMN "coordinates_lng" varchar(50);--> statement-breakpoint
ALTER TABLE "teams" ADD COLUMN "firm_registration_number" varchar(100);--> statement-breakpoint
ALTER TABLE "teams" ADD COLUMN "firm_registration_state" varchar(50);--> statement-breakpoint
ALTER TABLE "teams" ADD COLUMN "business_license_number" varchar(100);--> statement-breakpoint
ALTER TABLE "teams" ADD COLUMN "disclaimer_accepted" boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE "teams" ADD COLUMN "disclaimer_accepted_at" timestamp;--> statement-breakpoint
ALTER TABLE "teams" ADD COLUMN "owner_full_name" varchar(255);--> statement-breakpoint
ALTER TABLE "teams" ADD COLUMN "owner_position" varchar(100);--> statement-breakpoint
ALTER TABLE "teams" ADD COLUMN "owner_email" varchar(255);--> statement-breakpoint
ALTER TABLE "teams" ADD COLUMN "owner_phone" varchar(20);