CREATE TYPE "public"."reserve_liquidity" AS ENUM('daily', 'not_daily');--> statement-breakpoint
CREATE TABLE "reserve_mark" (
	"household_id" text NOT NULL,
	"account_id" text NOT NULL,
	"is_reserve" boolean NOT NULL,
	"liquidity" "reserve_liquidity",
	"institution_id" text,
	"updated_by_user_id" text,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "reserve_mark_household_id_account_id_pk" PRIMARY KEY("household_id","account_id")
);
--> statement-breakpoint
ALTER TABLE "reserve_mark" ADD CONSTRAINT "reserve_mark_household_id_organization_id_fk" FOREIGN KEY ("household_id") REFERENCES "public"."organization"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reserve_mark" ADD CONSTRAINT "reserve_mark_account_id_bank_account_id_fk" FOREIGN KEY ("account_id") REFERENCES "public"."bank_account"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reserve_mark" ADD CONSTRAINT "reserve_mark_updated_by_user_id_user_id_fk" FOREIGN KEY ("updated_by_user_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;