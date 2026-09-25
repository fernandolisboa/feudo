ALTER TABLE "bank_connection" ADD COLUMN "default_household_id" text;--> statement-breakpoint
ALTER TABLE "bank_connection" ADD CONSTRAINT "bank_connection_default_household_id_organization_id_fk" FOREIGN KEY ("default_household_id") REFERENCES "public"."organization"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
-- #74 (ADR-0001, amended 2026-09-25): the moment a membership ends, by
-- leaving, by removal or by any raw call to Better Auth's endpoints (none of
-- which run a Feudo hook inside their own transaction), the accounts of that
-- person's connections stop being assigned to that household, and their
-- connections stop defaulting to it, in the same transaction as the delete.
-- A membership row that changes household or user counts as the old one
-- ending. The sync's own write path locks the member row (sync/repository.ts,
-- upsertAccounts) so it cannot assign a new account in the gap.
CREATE FUNCTION "member_release_departed_accounts"() RETURNS trigger AS $$
BEGIN
  IF TG_OP = 'UPDATE'
    AND OLD.organization_id = NEW.organization_id
    AND OLD.user_id = NEW.user_id THEN
    RETURN NULL;
  END IF;

  -- Rows locked in the same order the sync's upsert writes them, so a leave
  -- racing a sync of another household's connection waits instead of
  -- deadlocking.
  PERFORM 1 FROM "bank_account"
  WHERE "household_id" = OLD.organization_id
    AND "connection_id" IN (
      SELECT "id" FROM "bank_connection" WHERE "user_id" = OLD.user_id
    )
  ORDER BY "connection_id", "provider_account_id" COLLATE "C"
  FOR UPDATE;

  UPDATE "bank_account" SET "household_id" = NULL
  WHERE "household_id" = OLD.organization_id
    AND "connection_id" IN (
      SELECT "id" FROM "bank_connection" WHERE "user_id" = OLD.user_id
    );

  UPDATE "bank_connection" SET "default_household_id" = NULL
  WHERE "user_id" = OLD.user_id AND "default_household_id" = OLD.organization_id;

  RETURN NULL;
END;
$$ LANGUAGE plpgsql;
--> statement-breakpoint
CREATE TRIGGER "member_departure_trigger"
AFTER DELETE OR UPDATE OF "organization_id", "user_id" ON "member"
FOR EACH ROW EXECUTE FUNCTION "member_release_departed_accounts"();
--> statement-breakpoint
-- Data fix for #74, after the trigger exists: creating it locks member
-- against deletes until this migration commits, so every departure is
-- caught either here or by the trigger. An account still assigned to a
-- household its connection's owner already left (or was removed from)
-- becomes unassigned, as it would have under the trigger.
UPDATE "bank_account" SET "household_id" = NULL
WHERE "household_id" IS NOT NULL
  AND NOT EXISTS (
    SELECT 1
    FROM "bank_connection"
    JOIN "member" ON "member"."user_id" = "bank_connection"."user_id"
    WHERE "bank_connection"."id" = "bank_account"."connection_id"
      AND "member"."organization_id" = "bank_account"."household_id"
  );
--> statement-breakpoint
-- Backfill for #76: a connection whose accounts all sit in one household
-- adopts it as the household later accounts land in. A connection with no
-- account, or accounts split across households, has no answer to infer and
-- stays null until its owner moves one of its accounts.
UPDATE "bank_connection" SET "default_household_id" = "assigned"."household_id"
FROM (
  SELECT "connection_id", min("household_id") AS "household_id"
  FROM "bank_account"
  GROUP BY "connection_id"
  HAVING count(DISTINCT "household_id") = 1 AND count(*) = count("household_id")
) AS "assigned"
WHERE "bank_connection"."id" = "assigned"."connection_id";
