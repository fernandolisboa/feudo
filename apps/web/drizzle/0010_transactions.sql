CREATE TYPE "public"."bank_transaction_type" AS ENUM('credit', 'debit');--> statement-breakpoint
CREATE TYPE "public"."counterpart_type" AS ENUM('cpf', 'cnpj');--> statement-breakpoint
CREATE TABLE "bank_transaction" (
	"id" text PRIMARY KEY NOT NULL,
	"account_id" text NOT NULL,
	"provider_transaction_id" text NOT NULL,
	"date" date NOT NULL,
	"amount_centavos" bigint NOT NULL,
	"currency" text NOT NULL,
	"description" text NOT NULL,
	"provider_category" text,
	"type" "bank_transaction_type" NOT NULL,
	"counterpart_type" "counterpart_type",
	"counterpart_document_hash" text,
	"synced_at" timestamp with time zone NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "bank_transaction" ADD CONSTRAINT "bank_transaction_account_id_bank_account_id_fk" FOREIGN KEY ("account_id") REFERENCES "public"."bank_account"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "bank_transaction_account_provider_transaction_uidx" ON "bank_transaction" USING btree ("account_id","provider_transaction_id");--> statement-breakpoint
CREATE INDEX "bank_transaction_account_date_idx" ON "bank_transaction" USING btree ("account_id","date");