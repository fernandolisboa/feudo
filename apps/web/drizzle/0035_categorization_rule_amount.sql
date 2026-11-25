ALTER TABLE "categorization_rule" ADD COLUMN "amount_centavos" bigint;--> statement-breakpoint
ALTER TABLE "categorization_rule" ADD COLUMN "amount_currency" text;--> statement-breakpoint
ALTER TABLE "categorization_rule" ADD CONSTRAINT "categorization_rule_household_pattern_direction_amount_unique" UNIQUE NULLS NOT DISTINCT("household_id","pattern","direction","amount_centavos","amount_currency");--> statement-breakpoint
ALTER TABLE "categorization_rule" ADD CONSTRAINT "categorization_rule_amount_check" CHECK ("categorization_rule"."amount_centavos" > 0);--> statement-breakpoint
ALTER TABLE "categorization_rule" ADD CONSTRAINT "categorization_rule_amount_currency_check" CHECK (num_nonnulls("categorization_rule"."amount_centavos", "categorization_rule"."amount_currency") in (0, 2));