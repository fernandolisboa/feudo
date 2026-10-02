CREATE TYPE "public"."analysis_kind" AS ENUM('monthly', 'on_demand');--> statement-breakpoint
CREATE TYPE "public"."analysis_status" AS ENUM('running', 'succeeded', 'failed');--> statement-breakpoint
CREATE TABLE "household_analysis" (
	"id" text PRIMARY KEY NOT NULL,
	"household_id" text NOT NULL,
	"kind" "analysis_kind" NOT NULL,
	"period" text NOT NULL,
	"local_day" date NOT NULL,
	"status" "analysis_status" DEFAULT 'running' NOT NULL,
	"prompt_version" text NOT NULL,
	"requested_model" text NOT NULL,
	"model" text,
	"input" jsonb NOT NULL,
	"output" jsonb,
	"failure_reason" text,
	"input_tokens" integer,
	"output_tokens" integer,
	"requested_by_user_id" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"completed_at" timestamp with time zone
);
--> statement-breakpoint
ALTER TABLE "household_analysis" ADD CONSTRAINT "household_analysis_household_id_organization_id_fk" FOREIGN KEY ("household_id") REFERENCES "public"."organization"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "household_analysis" ADD CONSTRAINT "household_analysis_requested_by_user_id_user_id_fk" FOREIGN KEY ("requested_by_user_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "household_analysis_household_created_idx" ON "household_analysis" USING btree ("household_id","created_at");--> statement-breakpoint
CREATE INDEX "household_analysis_household_day_idx" ON "household_analysis" USING btree ("household_id","local_day");--> statement-breakpoint
CREATE UNIQUE INDEX "household_analysis_monthly_period_uidx" ON "household_analysis" USING btree ("household_id","period") WHERE "household_analysis"."kind" = 'monthly' and "household_analysis"."status" <> 'failed';