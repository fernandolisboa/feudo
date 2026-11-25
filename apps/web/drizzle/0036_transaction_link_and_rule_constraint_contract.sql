CREATE TYPE "public"."transaction_link_kind" AS ENUM('offset', 'funding');--> statement-breakpoint
CREATE TABLE "transaction_link" (
	"id" text PRIMARY KEY NOT NULL,
	"debit_transaction_id" text NOT NULL,
	"credit_transaction_id" text NOT NULL,
	"kind" "transaction_link_kind" NOT NULL,
	"linked_by_user_id" text,
	"linked_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "transaction_link_debit_transaction_id_unique" UNIQUE("debit_transaction_id"),
	CONSTRAINT "transaction_link_credit_transaction_id_unique" UNIQUE("credit_transaction_id")
);
--> statement-breakpoint
CREATE TABLE "transaction_link_dismissal" (
	"household_id" text NOT NULL,
	"debit_transaction_id" text NOT NULL,
	"credit_transaction_id" text NOT NULL,
	"dismissed_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "transaction_link_dismissal_pk" PRIMARY KEY("household_id","debit_transaction_id","credit_transaction_id")
);
--> statement-breakpoint
ALTER TABLE "categorization_rule" DROP CONSTRAINT "categorization_rule_household_pattern_direction_unique";--> statement-breakpoint
ALTER TABLE "transaction_link" ADD CONSTRAINT "transaction_link_debit_transaction_id_bank_transaction_id_fk" FOREIGN KEY ("debit_transaction_id") REFERENCES "public"."bank_transaction"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "transaction_link" ADD CONSTRAINT "transaction_link_credit_transaction_id_bank_transaction_id_fk" FOREIGN KEY ("credit_transaction_id") REFERENCES "public"."bank_transaction"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "transaction_link" ADD CONSTRAINT "transaction_link_linked_by_user_id_user_id_fk" FOREIGN KEY ("linked_by_user_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "transaction_link_dismissal" ADD CONSTRAINT "transaction_link_dismissal_household_id_organization_id_fk" FOREIGN KEY ("household_id") REFERENCES "public"."organization"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "transaction_link_dismissal" ADD CONSTRAINT "transaction_link_dismissal_debit_transaction_id_bank_transaction_id_fk" FOREIGN KEY ("debit_transaction_id") REFERENCES "public"."bank_transaction"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "transaction_link_dismissal" ADD CONSTRAINT "transaction_link_dismissal_credit_transaction_id_bank_transaction_id_fk" FOREIGN KEY ("credit_transaction_id") REFERENCES "public"."bank_transaction"("id") ON DELETE cascade ON UPDATE no action;