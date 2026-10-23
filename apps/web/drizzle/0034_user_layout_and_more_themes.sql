CREATE TYPE "public"."shell_layout" AS ENUM('sidebar', 'topnav', 'dock');--> statement-breakpoint
ALTER TYPE "public"."theme" ADD VALUE 'lamparina';--> statement-breakpoint
ALTER TYPE "public"."theme" ADD VALUE 'cofre';--> statement-breakpoint
ALTER TYPE "public"."theme" ADD VALUE 'varanda';--> statement-breakpoint
ALTER TYPE "public"."theme" ADD VALUE 'nitido';--> statement-breakpoint
ALTER TABLE "user" ADD COLUMN "layout" "shell_layout" DEFAULT 'sidebar' NOT NULL;--> statement-breakpoint
UPDATE "user" SET "layout" = 'topnav' WHERE "theme" = 'sala';
