ALTER TABLE "user" ADD COLUMN "auth_email_window_started_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "user" ADD COLUMN "auth_email_count" integer DEFAULT 0 NOT NULL;