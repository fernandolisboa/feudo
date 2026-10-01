CREATE TABLE "manual_sync_trigger" (
	"id" text PRIMARY KEY NOT NULL,
	"household_id" text NOT NULL,
	"triggered_by_user_id" text,
	"local_day" date NOT NULL,
	"triggered_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "manual_sync_trigger" ADD CONSTRAINT "manual_sync_trigger_household_id_organization_id_fk" FOREIGN KEY ("household_id") REFERENCES "public"."organization"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "manual_sync_trigger" ADD CONSTRAINT "manual_sync_trigger_triggered_by_user_id_user_id_fk" FOREIGN KEY ("triggered_by_user_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "manual_sync_trigger_household_day_idx" ON "manual_sync_trigger" USING btree ("household_id","local_day");