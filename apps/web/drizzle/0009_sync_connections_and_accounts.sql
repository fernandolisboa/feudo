CREATE TYPE "public"."bank_account_label" AS ENUM('individual', 'shared');--> statement-breakpoint
CREATE TYPE "public"."bank_account_type" AS ENUM('checking', 'savings', 'credit_card', 'investment');--> statement-breakpoint
CREATE TYPE "public"."data_provider" AS ENUM('pluggy');--> statement-breakpoint
CREATE TYPE "public"."rate_type" AS ENUM('percentage_of_cdi', 'fixed_annual', 'inflation_linked', 'other');--> statement-breakpoint
CREATE TABLE "bank_account" (
	"id" text PRIMARY KEY NOT NULL,
	"connection_id" text NOT NULL,
	"household_id" text,
	"provider_account_id" text NOT NULL,
	"type" "bank_account_type" NOT NULL,
	"product_type" text,
	"name" text NOT NULL,
	"balance_centavos" bigint NOT NULL,
	"currency" text NOT NULL,
	"label" "bank_account_label" DEFAULT 'individual' NOT NULL,
	"holder_document_hash" text,
	"rate_ppm" integer,
	"rate_type" "rate_type",
	"due_date" date,
	"acquisition_date" date,
	"synced_at" timestamp with time zone NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "bank_connection" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"provider" "data_provider" NOT NULL,
	"provider_item_id" text NOT NULL,
	"institution_name" text NOT NULL,
	"institution_provider_id" text NOT NULL,
	"consent_id" text NOT NULL,
	"last_synced_at" timestamp with time zone,
	"last_sync_error" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "bank_connection_consent" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"scope_version" text NOT NULL,
	"scope_text" text NOT NULL,
	"accepted_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "provider_auth_attempt" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"attempted_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "provider_credential" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"provider" "data_provider" NOT NULL,
	"ciphertext" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"last_validated_at" timestamp with time zone NOT NULL
);
--> statement-breakpoint
ALTER TABLE "bank_account" ADD CONSTRAINT "bank_account_connection_id_bank_connection_id_fk" FOREIGN KEY ("connection_id") REFERENCES "public"."bank_connection"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bank_account" ADD CONSTRAINT "bank_account_household_id_organization_id_fk" FOREIGN KEY ("household_id") REFERENCES "public"."organization"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bank_connection" ADD CONSTRAINT "bank_connection_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bank_connection" ADD CONSTRAINT "bank_connection_consent_id_bank_connection_consent_id_fk" FOREIGN KEY ("consent_id") REFERENCES "public"."bank_connection_consent"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bank_connection_consent" ADD CONSTRAINT "bank_connection_consent_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "provider_auth_attempt" ADD CONSTRAINT "provider_auth_attempt_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "provider_credential" ADD CONSTRAINT "provider_credential_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "bank_account_connection_provider_account_uidx" ON "bank_account" USING btree ("connection_id","provider_account_id");--> statement-breakpoint
CREATE INDEX "bank_account_householdId_idx" ON "bank_account" USING btree ("household_id");--> statement-breakpoint
CREATE UNIQUE INDEX "bank_connection_user_provider_item_uidx" ON "bank_connection" USING btree ("user_id","provider","provider_item_id");--> statement-breakpoint
CREATE UNIQUE INDEX "bank_connection_consentId_uidx" ON "bank_connection" USING btree ("consent_id");--> statement-breakpoint
CREATE INDEX "bank_connection_consent_userId_idx" ON "bank_connection_consent" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "provider_auth_attempt_user_attempted_idx" ON "provider_auth_attempt" USING btree ("user_id","attempted_at");--> statement-breakpoint
CREATE UNIQUE INDEX "provider_credential_user_provider_uidx" ON "provider_credential" USING btree ("user_id","provider");