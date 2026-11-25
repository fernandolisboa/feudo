ALTER TABLE "categorization_rule" DROP CONSTRAINT "categorization_rule_household_pattern_direction_unique";--> statement-breakpoint
ALTER TABLE "categorization_rule" ADD COLUMN "amount_centavos" bigint;--> statement-breakpoint
ALTER TABLE "categorization_rule" ADD CONSTRAINT "categorization_rule_household_pattern_direction_amount_unique" UNIQUE NULLS NOT DISTINCT("household_id","pattern","direction","amount_centavos");--> statement-breakpoint
ALTER TABLE "categorization_rule" ADD CONSTRAINT "categorization_rule_amount_check" CHECK ("categorization_rule"."amount_centavos" > 0);