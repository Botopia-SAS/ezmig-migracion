ALTER TABLE "referral_links" ALTER COLUMN "max_uses" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "referral_links" ALTER COLUMN "max_uses" DROP NOT NULL;