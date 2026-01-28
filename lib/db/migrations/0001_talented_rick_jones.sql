-- Crear enums
CREATE TYPE "public"."tenant_role" AS ENUM('owner', 'staff', 'client');--> statement-breakpoint
CREATE TYPE "public"."transaction_type" AS ENUM('purchase', 'consumption', 'refund', 'auto_reload', 'bonus');--> statement-breakpoint
CREATE TYPE "public"."user_role" AS ENUM('admin', 'attorney', 'staff', 'end_user');--> statement-breakpoint

-- Crear nuevas tablas de tokens
CREATE TABLE "token_packages" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(50) NOT NULL,
	"tokens" integer NOT NULL,
	"price_in_cents" integer NOT NULL,
	"stripe_price_id" varchar(255) NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "token_transactions" (
	"id" serial PRIMARY KEY NOT NULL,
	"wallet_id" integer NOT NULL,
	"type" "transaction_type" NOT NULL,
	"amount" integer NOT NULL,
	"balance_after" integer NOT NULL,
	"idempotency_key" varchar(255),
	"description" text,
	"stripe_payment_intent_id" varchar(255),
	"related_entity_type" varchar(50),
	"related_entity_id" integer,
	"user_id" integer,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "token_transactions_idempotency_key_unique" UNIQUE("idempotency_key")
);
--> statement-breakpoint
CREATE TABLE "token_wallets" (
	"id" serial PRIMARY KEY NOT NULL,
	"team_id" integer NOT NULL,
	"balance" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "token_wallets_team_id_unique" UNIQUE("team_id")
);
--> statement-breakpoint

-- Preparar datos: convertir 'member' a valores válidos del enum
UPDATE "invitations" SET "role" = 'staff' WHERE "role" NOT IN ('owner', 'staff', 'client');--> statement-breakpoint
UPDATE "team_members" SET "role" = 'staff' WHERE "role" NOT IN ('owner', 'staff', 'client');--> statement-breakpoint
UPDATE "users" SET "role" = 'attorney' WHERE "role" NOT IN ('admin', 'attorney', 'staff', 'end_user');--> statement-breakpoint

-- Cambiar tipos de columnas a enums
ALTER TABLE "invitations" ALTER COLUMN "role" SET DEFAULT 'staff';--> statement-breakpoint
ALTER TABLE "invitations" ALTER COLUMN "role" TYPE "public"."tenant_role" USING "role"::text::"public"."tenant_role";--> statement-breakpoint
ALTER TABLE "team_members" ALTER COLUMN "role" SET DEFAULT 'staff';--> statement-breakpoint
ALTER TABLE "team_members" ALTER COLUMN "role" TYPE "public"."tenant_role" USING "role"::text::"public"."tenant_role";--> statement-breakpoint
ALTER TABLE "users" ALTER COLUMN "role" SET DEFAULT 'attorney';--> statement-breakpoint
ALTER TABLE "users" ALTER COLUMN "role" TYPE "public"."user_role" USING "role"::text::"public"."user_role";--> statement-breakpoint

-- Agregar nuevos campos a teams
ALTER TABLE "teams" ADD COLUMN "type" varchar(20) DEFAULT 'law_firm' NOT NULL;--> statement-breakpoint
ALTER TABLE "teams" ADD COLUMN "auto_reload_enabled" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "teams" ADD COLUMN "auto_reload_threshold" integer DEFAULT 5;--> statement-breakpoint
ALTER TABLE "teams" ADD COLUMN "auto_reload_package" varchar(20) DEFAULT '10';--> statement-breakpoint

-- Foreign keys para nuevas tablas
ALTER TABLE "token_transactions" ADD CONSTRAINT "token_transactions_wallet_id_token_wallets_id_fk" FOREIGN KEY ("wallet_id") REFERENCES "public"."token_wallets"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "token_transactions" ADD CONSTRAINT "token_transactions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "token_wallets" ADD CONSTRAINT "token_wallets_team_id_teams_id_fk" FOREIGN KEY ("team_id") REFERENCES "public"."teams"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint

-- Crear wallets para teams existentes
INSERT INTO "token_wallets" ("team_id", "balance")
SELECT "id", 0 FROM "teams"
WHERE "id" NOT IN (SELECT "team_id" FROM "token_wallets");
