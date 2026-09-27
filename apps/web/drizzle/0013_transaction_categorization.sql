CREATE TYPE "public"."subcategory_kind" AS ENUM('income', 'fixed', 'variable', 'transfer');--> statement-breakpoint
CREATE TABLE "categorization_rule" (
	"id" text PRIMARY KEY NOT NULL,
	"household_id" text NOT NULL,
	"pattern" text NOT NULL,
	"direction" "bank_transaction_type",
	"product_subcategory_id" text,
	"household_subcategory_id" text,
	"created_by_user_id" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "categorization_rule_household_pattern_direction_unique" UNIQUE NULLS NOT DISTINCT("household_id","pattern","direction"),
	CONSTRAINT "categorization_rule_target_check" CHECK (num_nonnulls("categorization_rule"."product_subcategory_id", "categorization_rule"."household_subcategory_id") = 1)
);
--> statement-breakpoint
CREATE TABLE "household_subcategory" (
	"id" text PRIMARY KEY NOT NULL,
	"household_id" text NOT NULL,
	"category_id" text NOT NULL,
	"name" text NOT NULL,
	"kind" "subcategory_kind" NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "household_subcategory_household_id_id_unique" UNIQUE("household_id","id")
);
--> statement-breakpoint
CREATE TABLE "subcategory_kind_override" (
	"household_id" text NOT NULL,
	"product_subcategory_id" text NOT NULL,
	"kind" "subcategory_kind" NOT NULL,
	CONSTRAINT "subcategory_kind_override_pk" PRIMARY KEY("household_id","product_subcategory_id")
);
--> statement-breakpoint
CREATE TABLE "transaction_categorization" (
	"transaction_id" text PRIMARY KEY NOT NULL,
	"product_subcategory_id" text,
	"household_subcategory_id" text,
	"subcategory_household_id" text,
	"categorized_by_user_id" text,
	"categorized_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "transaction_categorization_target_check" CHECK (("transaction_categorization"."product_subcategory_id" is not null and "transaction_categorization"."household_subcategory_id" is null and "transaction_categorization"."subcategory_household_id" is null)
        or ("transaction_categorization"."product_subcategory_id" is null and "transaction_categorization"."household_subcategory_id" is not null and "transaction_categorization"."subcategory_household_id" is not null))
);
--> statement-breakpoint
ALTER TABLE "categorization_rule" ADD CONSTRAINT "categorization_rule_household_id_organization_id_fk" FOREIGN KEY ("household_id") REFERENCES "public"."organization"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "categorization_rule" ADD CONSTRAINT "categorization_rule_created_by_user_id_user_id_fk" FOREIGN KEY ("created_by_user_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "categorization_rule" ADD CONSTRAINT "categorization_rule_household_subcategory_fk" FOREIGN KEY ("household_id","household_subcategory_id") REFERENCES "public"."household_subcategory"("household_id","id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "household_subcategory" ADD CONSTRAINT "household_subcategory_household_id_organization_id_fk" FOREIGN KEY ("household_id") REFERENCES "public"."organization"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "subcategory_kind_override" ADD CONSTRAINT "subcategory_kind_override_household_id_organization_id_fk" FOREIGN KEY ("household_id") REFERENCES "public"."organization"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "transaction_categorization" ADD CONSTRAINT "transaction_categorization_transaction_id_bank_transaction_id_fk" FOREIGN KEY ("transaction_id") REFERENCES "public"."bank_transaction"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "transaction_categorization" ADD CONSTRAINT "transaction_categorization_categorized_by_user_id_user_id_fk" FOREIGN KEY ("categorized_by_user_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "transaction_categorization" ADD CONSTRAINT "transaction_categorization_household_subcategory_fk" FOREIGN KEY ("subcategory_household_id","household_subcategory_id") REFERENCES "public"."household_subcategory"("household_id","id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "household_subcategory_household_category_name_uidx" ON "household_subcategory" USING btree ("household_id","category_id",lower("name"));