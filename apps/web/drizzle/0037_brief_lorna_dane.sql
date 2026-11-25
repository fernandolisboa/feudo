ALTER TYPE "public"."financial_data_access_kind" ADD VALUE 'category_suggestions';--> statement-breakpoint
CREATE TABLE "category_ai_suggestion" (
	"household_id" text NOT NULL,
	"transaction_id" text NOT NULL,
	"product_subcategory_id" text,
	"prompt_version" text NOT NULL,
	"model" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "category_ai_suggestion_household_id_transaction_id_pk" PRIMARY KEY("household_id","transaction_id")
);
--> statement-breakpoint
CREATE TABLE "category_suggestion_run" (
	"id" text PRIMARY KEY NOT NULL,
	"household_id" text NOT NULL,
	"requested_by_user_id" text,
	"local_day" date NOT NULL,
	"status" "analysis_status" DEFAULT 'running' NOT NULL,
	"prompt_version" text NOT NULL,
	"requested_model" text NOT NULL,
	"model" text,
	"item_count" integer NOT NULL,
	"transaction_count" integer NOT NULL,
	"suggested_count" integer,
	"failure_reason" text,
	"input_tokens" integer,
	"output_tokens" integer,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"completed_at" timestamp with time zone,
	CONSTRAINT "category_suggestion_run_item_count_check" CHECK ("category_suggestion_run"."item_count" > 0),
	CONSTRAINT "category_suggestion_run_transaction_count_check" CHECK ("category_suggestion_run"."transaction_count" >= "category_suggestion_run"."item_count")
);
--> statement-breakpoint
ALTER TABLE "household_ai_settings" ADD COLUMN "category_suggestion_family" "ai_model_family" DEFAULT 'haiku' NOT NULL;--> statement-breakpoint
ALTER TABLE "category_ai_suggestion" ADD CONSTRAINT "category_ai_suggestion_household_id_organization_id_fk" FOREIGN KEY ("household_id") REFERENCES "public"."organization"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "category_ai_suggestion" ADD CONSTRAINT "category_ai_suggestion_transaction_id_bank_transaction_id_fk" FOREIGN KEY ("transaction_id") REFERENCES "public"."bank_transaction"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "category_suggestion_run" ADD CONSTRAINT "category_suggestion_run_household_id_organization_id_fk" FOREIGN KEY ("household_id") REFERENCES "public"."organization"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "category_suggestion_run" ADD CONSTRAINT "category_suggestion_run_requested_by_user_id_user_id_fk" FOREIGN KEY ("requested_by_user_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "category_ai_suggestion_transaction_idx" ON "category_ai_suggestion" USING btree ("transaction_id");--> statement-breakpoint
CREATE INDEX "category_ai_suggestion_created_idx" ON "category_ai_suggestion" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "category_suggestion_run_household_day_idx" ON "category_suggestion_run" USING btree ("household_id","local_day");--> statement-breakpoint
CREATE INDEX "category_suggestion_run_household_created_idx" ON "category_suggestion_run" USING btree ("household_id","created_at");--> statement-breakpoint
CREATE INDEX "category_suggestion_run_created_idx" ON "category_suggestion_run" USING btree ("created_at");