CREATE TYPE "public"."financial_data_access_kind" AS ENUM('overview', 'transactions', 'categories', 'reserve', 'export');--> statement-breakpoint
CREATE TABLE "financial_data_access" (
	"id" text PRIMARY KEY NOT NULL,
	"household_id" text NOT NULL,
	"user_id" text,
	"kind" "financial_data_access_kind" NOT NULL,
	"accessed_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "financial_data_access" ADD CONSTRAINT "financial_data_access_household_id_organization_id_fk" FOREIGN KEY ("household_id") REFERENCES "public"."organization"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "financial_data_access" ADD CONSTRAINT "financial_data_access_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "financial_data_access_household_user_accessed_idx" ON "financial_data_access" USING btree ("household_id","user_id","accessed_at");--> statement-breakpoint
CREATE INDEX "financial_data_access_accessed_idx" ON "financial_data_access" USING btree ("accessed_at");