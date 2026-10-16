CREATE TYPE "public"."ai_model_family" AS ENUM('haiku', 'sonnet', 'opus');--> statement-breakpoint
CREATE TABLE "ai_key_verification_attempt" (
	"id" text PRIMARY KEY NOT NULL,
	"household_id" text NOT NULL,
	"user_id" text NOT NULL,
	"attempted_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "household_ai_settings" (
	"household_id" text PRIMARY KEY NOT NULL,
	"api_key_ciphertext" text,
	"api_key_last4" text,
	"monthly_family" "ai_model_family" DEFAULT 'opus' NOT NULL,
	"on_demand_family" "ai_model_family" DEFAULT 'sonnet' NOT NULL,
	"updated_by_user_id" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "ai_key_verification_attempt" ADD CONSTRAINT "ai_key_verification_attempt_household_id_organization_id_fk" FOREIGN KEY ("household_id") REFERENCES "public"."organization"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ai_key_verification_attempt" ADD CONSTRAINT "ai_key_verification_attempt_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "household_ai_settings" ADD CONSTRAINT "household_ai_settings_household_id_organization_id_fk" FOREIGN KEY ("household_id") REFERENCES "public"."organization"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "household_ai_settings" ADD CONSTRAINT "household_ai_settings_updated_by_user_id_user_id_fk" FOREIGN KEY ("updated_by_user_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "ai_key_verification_attempt_household_idx" ON "ai_key_verification_attempt" USING btree ("household_id","attempted_at");--> statement-breakpoint
CREATE INDEX "ai_key_verification_attempt_user_idx" ON "ai_key_verification_attempt" USING btree ("user_id","attempted_at");