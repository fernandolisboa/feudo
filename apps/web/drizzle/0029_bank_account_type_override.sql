CREATE TABLE "bank_account_type_override" (
	"household_id" text NOT NULL,
	"institution_id" text NOT NULL,
	"account_type" text NOT NULL,
	"offered" boolean NOT NULL,
	"note" text NOT NULL,
	"source_url" text,
	"base_reviewed_at" date NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "bank_account_type_override_pk" PRIMARY KEY("household_id","institution_id","account_type")
);
--> statement-breakpoint
ALTER TABLE "bank_account_type_override" ADD CONSTRAINT "bank_account_type_override_household_id_organization_id_fk" FOREIGN KEY ("household_id") REFERENCES "public"."organization"("id") ON DELETE cascade ON UPDATE no action;