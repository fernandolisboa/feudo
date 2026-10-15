CREATE TABLE "bank_criterion_override" (
	"household_id" text NOT NULL,
	"institution_id" text NOT NULL,
	"criterion" text NOT NULL,
	"score" integer NOT NULL,
	"note" text NOT NULL,
	"source_url" text,
	"base_reviewed_at" date NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "bank_criterion_override_pk" PRIMARY KEY("household_id","institution_id","criterion"),
	CONSTRAINT "bank_criterion_override_score_check" CHECK ("bank_criterion_override"."score" between 0 and 100)
);
--> statement-breakpoint
ALTER TABLE "bank_criterion_override" ADD CONSTRAINT "bank_criterion_override_household_id_organization_id_fk" FOREIGN KEY ("household_id") REFERENCES "public"."organization"("id") ON DELETE cascade ON UPDATE no action;