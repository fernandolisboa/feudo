ALTER TABLE "invitation" ADD COLUMN "delivery_failed_at" timestamp with time zone;
--> statement-breakpoint
ALTER TABLE "invitation" ADD COLUMN "last_sent_at" timestamp with time zone;