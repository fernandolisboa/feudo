CREATE TABLE "reserve_target_notice" (
	"id" text PRIMARY KEY NOT NULL,
	"household_id" text NOT NULL,
	"closed_month" text NOT NULL,
	"previous_target_centavos" bigint NOT NULL,
	"new_target_centavos" bigint NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"dismissed_at" timestamp with time zone,
	CONSTRAINT "reserve_target_notice_household_month_unique" UNIQUE("household_id","closed_month")
);
--> statement-breakpoint
CREATE TABLE "reserve_target_record" (
	"id" text PRIMARY KEY NOT NULL,
	"household_id" text NOT NULL,
	"closed_month" text NOT NULL,
	"average_fixed_cost_centavos" bigint NOT NULL,
	"months_used" integer NOT NULL,
	"is_estimate" boolean NOT NULL,
	"reserve_multiple" integer NOT NULL,
	"target_centavos" bigint NOT NULL,
	"currency" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "reserve_target_record_household_month_unique" UNIQUE("household_id","closed_month")
);
--> statement-breakpoint
ALTER TABLE "reserve_target_notice" ADD CONSTRAINT "reserve_target_notice_household_id_organization_id_fk" FOREIGN KEY ("household_id") REFERENCES "public"."organization"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reserve_target_record" ADD CONSTRAINT "reserve_target_record_household_id_organization_id_fk" FOREIGN KEY ("household_id") REFERENCES "public"."organization"("id") ON DELETE cascade ON UPDATE no action;