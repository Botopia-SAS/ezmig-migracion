CREATE TYPE "public"."relationship_type" AS ENUM('spouse', 'parent', 'child', 'sibling', 'grandparent', 'grandchild', 'stepparent', 'stepchild', 'employer', 'employee', 'self', 'other');--> statement-breakpoint
CREATE TABLE "case_relationships" (
	"id" serial PRIMARY KEY NOT NULL,
	"case_id" integer NOT NULL,
	"petitioner_id" integer NOT NULL,
	"beneficiary_id" integer,
	"relationship_type" "relationship_type" NOT NULL,
	"relationship_details" text,
	"is_primary_relationship" boolean DEFAULT true NOT NULL,
	"marriage_date" date,
	"divorce_date" date,
	"created_by" integer,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "case_relationships" ADD CONSTRAINT "case_relationships_case_id_cases_id_fk" FOREIGN KEY ("case_id") REFERENCES "public"."cases"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "case_relationships" ADD CONSTRAINT "case_relationships_petitioner_id_clients_id_fk" FOREIGN KEY ("petitioner_id") REFERENCES "public"."clients"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "case_relationships" ADD CONSTRAINT "case_relationships_beneficiary_id_clients_id_fk" FOREIGN KEY ("beneficiary_id") REFERENCES "public"."clients"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "case_relationships" ADD CONSTRAINT "case_relationships_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;