ALTER TABLE "cases" DROP CONSTRAINT "cases_assigned_to_users_id_fk";
--> statement-breakpoint
ALTER TABLE "clients" DROP CONSTRAINT "clients_created_by_users_id_fk";
--> statement-breakpoint
ALTER TABLE "notifications" DROP CONSTRAINT "notifications_user_id_users_id_fk";
--> statement-breakpoint
ALTER TABLE "notifications" DROP CONSTRAINT "notifications_case_id_cases_id_fk";
--> statement-breakpoint
ALTER TABLE "notifications" DROP CONSTRAINT "notifications_case_form_id_case_forms_id_fk";
--> statement-breakpoint
ALTER TABLE "referral_links" DROP CONSTRAINT "referral_links_client_id_clients_id_fk";
--> statement-breakpoint
ALTER TABLE "referral_links" DROP CONSTRAINT "referral_links_case_id_cases_id_fk";
--> statement-breakpoint
ALTER TABLE "referral_links" ADD COLUMN "form_type_ids" jsonb DEFAULT '[]'::jsonb NOT NULL;--> statement-breakpoint
ALTER TABLE "cases" ADD CONSTRAINT "cases_assigned_to_users_id_fk" FOREIGN KEY ("assigned_to") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "clients" ADD CONSTRAINT "clients_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_case_id_cases_id_fk" FOREIGN KEY ("case_id") REFERENCES "public"."cases"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_case_form_id_case_forms_id_fk" FOREIGN KEY ("case_form_id") REFERENCES "public"."case_forms"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "referral_links" ADD CONSTRAINT "referral_links_case_id_cases_id_fk" FOREIGN KEY ("case_id") REFERENCES "public"."cases"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_activity_logs_team_timestamp" ON "activity_logs" USING btree ("team_id","timestamp");--> statement-breakpoint
CREATE INDEX "idx_case_forms_case_status" ON "case_forms" USING btree ("case_id","status");--> statement-breakpoint
CREATE UNIQUE INDEX "idx_form_field_autosaves_case_form_field" ON "form_field_autosaves" USING btree ("case_form_id","field_path");--> statement-breakpoint
CREATE INDEX "idx_notifications_user_read" ON "notifications" USING btree ("user_id","is_read","created_at");--> statement-breakpoint
CREATE INDEX "idx_referral_link_usage_link" ON "referral_link_usage" USING btree ("referral_link_id");--> statement-breakpoint
CREATE INDEX "idx_referral_links_team_active" ON "referral_links" USING btree ("team_id","is_active","expires_at");--> statement-breakpoint
ALTER TABLE "referral_links" DROP COLUMN "client_id";--> statement-breakpoint
ALTER TABLE "referral_links" DROP COLUMN "allowed_forms";