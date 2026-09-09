CREATE TABLE "household_settings" (
	"household_id" text PRIMARY KEY NOT NULL,
	"time_zone" text NOT NULL,
	"reserve_multiple" integer NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "household_settings" ADD CONSTRAINT "household_settings_household_id_organization_id_fk" FOREIGN KEY ("household_id") REFERENCES "public"."organization"("id") ON DELETE cascade ON UPDATE no action;