CREATE TABLE "bank_criteria_weights" (
	"household_id" text PRIMARY KEY NOT NULL,
	"weights" jsonb NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "bank_criteria_weights" ADD CONSTRAINT "bank_criteria_weights_household_id_organization_id_fk" FOREIGN KEY ("household_id") REFERENCES "public"."organization"("id") ON DELETE cascade ON UPDATE no action;