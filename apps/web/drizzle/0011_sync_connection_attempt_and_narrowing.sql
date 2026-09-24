ALTER TABLE "bank_connection" ADD COLUMN "last_sync_attempted_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "bank_connection" ADD COLUMN "first_sync_since" date;