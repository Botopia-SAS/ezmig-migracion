ALTER TABLE "evidences" ADD COLUMN "field_path" varchar(255);--> statement-breakpoint
CREATE INDEX "idx_evidences_case_form_field_path" ON "evidences" USING btree ("case_form_id","field_path");