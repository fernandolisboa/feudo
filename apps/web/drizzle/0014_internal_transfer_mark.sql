CREATE TABLE "internal_transfer_mark" (
	"transaction_id" text PRIMARY KEY NOT NULL,
	"is_internal_transfer" boolean NOT NULL,
	"marked_by_user_id" text,
	"marked_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "internal_transfer_mark" ADD CONSTRAINT "internal_transfer_mark_transaction_id_bank_transaction_id_fk" FOREIGN KEY ("transaction_id") REFERENCES "public"."bank_transaction"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "internal_transfer_mark" ADD CONSTRAINT "internal_transfer_mark_marked_by_user_id_user_id_fk" FOREIGN KEY ("marked_by_user_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;