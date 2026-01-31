ALTER TYPE "public"."notification_type" ADD VALUE 'client_registered';--> statement-breakpoint
ALTER TABLE "activity_logs" ADD COLUMN "entity_type" varchar(50);--> statement-breakpoint
ALTER TABLE "activity_logs" ADD COLUMN "entity_id" integer;--> statement-breakpoint
ALTER TABLE "activity_logs" ADD COLUMN "entity_name" varchar(255);--> statement-breakpoint
ALTER TABLE "activity_logs" ADD COLUMN "metadata" jsonb;--> statement-breakpoint
ALTER TABLE "activity_logs" ADD COLUMN "changes" jsonb;--> statement-breakpoint
ALTER TABLE "activity_logs" ADD COLUMN "user_agent" text;--> statement-breakpoint
ALTER TABLE "teams" ADD COLUMN "logo_url" varchar(500);