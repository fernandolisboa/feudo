CREATE TYPE "public"."tour_outcome" AS ENUM('completed', 'dismissed');--> statement-breakpoint
CREATE TABLE "user_tour" (
	"user_id" text NOT NULL,
	"tour_id" text NOT NULL,
	"tour_version" integer NOT NULL,
	"outcome" "tour_outcome" NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "user_tour_user_id_tour_id_pk" PRIMARY KEY("user_id","tour_id")
);
--> statement-breakpoint
ALTER TABLE "user" ADD COLUMN "tours_auto_start" boolean DEFAULT true NOT NULL;--> statement-breakpoint
ALTER TABLE "user_tour" ADD CONSTRAINT "user_tour_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;