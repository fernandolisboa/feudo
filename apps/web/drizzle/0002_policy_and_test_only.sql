ALTER TABLE "terms_acceptances" DROP CONSTRAINT "terms_acceptances_user_id_user_id_fk";
--> statement-breakpoint
DROP TABLE "terms_acceptances";
--> statement-breakpoint
CREATE TABLE "fake_sent_emails" (
	"id" text PRIMARY KEY NOT NULL,
	"to" text NOT NULL,
	"subject" text NOT NULL,
	"text" text NOT NULL,
	"html" text NOT NULL,
	"sent_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "user" ADD COLUMN "terms_version" text NOT NULL;
--> statement-breakpoint
ALTER TABLE "user" ADD COLUMN "terms_accepted_at" timestamp with time zone NOT NULL;
