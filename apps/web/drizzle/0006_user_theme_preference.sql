CREATE TYPE "public"."theme" AS ENUM('caderno', 'painel', 'sala');--> statement-breakpoint
ALTER TABLE "user" ADD COLUMN "theme" "theme" DEFAULT 'caderno' NOT NULL;