CREATE TABLE "categorization_deferral" (
	"household_id" text NOT NULL,
	"transaction_id" text NOT NULL,
	"deferred_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "categorization_deferral_pk" PRIMARY KEY("household_id","transaction_id")
);
--> statement-breakpoint
ALTER TABLE "categorization_deferral" ADD CONSTRAINT "categorization_deferral_household_id_organization_id_fk" FOREIGN KEY ("household_id") REFERENCES "public"."organization"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "categorization_deferral" ADD CONSTRAINT "categorization_deferral_transaction_id_bank_transaction_id_fk" FOREIGN KEY ("transaction_id") REFERENCES "public"."bank_transaction"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "categorization_deferral_transaction_id_idx" ON "categorization_deferral" USING btree ("transaction_id");