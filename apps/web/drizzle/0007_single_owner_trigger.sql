-- Pre-check, run before the trigger below exists: if any household already
-- violates "exactly one owner" (a state only reachable by a bug or a manual
-- database edit predating this migration), fail the migration loudly instead
-- of installing a trigger that would then block every future write to that
-- household's members. Recovery: see "Single-owner enforcement" in
-- docs/runbooks/households.md (promote the oldest admin by hand, then
-- re-run this migration).
DO $$
DECLARE
  bad_household_id text;
  bad_owner_count integer;
BEGIN
  SELECT organization_id, count(*) FILTER (WHERE role = 'owner')
  INTO bad_household_id, bad_owner_count
  FROM "member"
  GROUP BY organization_id
  HAVING count(*) FILTER (WHERE role = 'owner') <> 1
  LIMIT 1;

  IF bad_household_id IS NOT NULL THEN
    RAISE EXCEPTION 'household % has % owners, expected exactly 1 - fix before installing member_single_owner_trigger (see docs/runbooks/households.md, Single-owner enforcement)',
      bad_household_id, bad_owner_count
      USING ERRCODE = 'check_violation';
  END IF;
END;
$$;
--> statement-breakpoint
-- Third line of defense (docs/adr/0001-auth-and-tenancy.md), behind
-- organizationHooks.beforeUpdateMemberRole (auth/options.ts) and the
-- member_single_owner_uidx partial unique index (0005_single_owner_index.sql):
-- those two block a *second* owner row, never a *zero*-owner state. Better
-- Auth's own /organization/leave and /organization/remove-member endpoints
-- read the target member's role with a plain SELECT and only lock the row
-- when they delete it; households.transferOwnership's own `for update` lock
-- on every member row of the household does not protect against a
-- concurrent leave/remove that started its read before the transfer and
-- only issues its DELETE after the transfer has already committed, removing
-- the row that is now the household's sole owner. A deferred constraint
-- trigger closes that window for every write path to `member`, including a
-- raw call to either endpoint, not just the ones Feudo's own code takes.
CREATE FUNCTION "member_assert_single_owner"(target_organization_id text) RETURNS void AS $$
DECLARE
  total_members integer;
  total_owners integer;
BEGIN
  SELECT count(*) INTO total_members
  FROM "member"
  WHERE organization_id = target_organization_id;

  -- No members left (the household itself was deleted in the same
  -- transaction, cascading this delete) is not a violation: there is
  -- nothing left to have an owner.
  IF total_members = 0 THEN
    RETURN;
  END IF;

  SELECT count(*) INTO total_owners
  FROM "member"
  WHERE organization_id = target_organization_id AND role = 'owner';

  IF total_owners <> 1 THEN
    RAISE EXCEPTION 'household % must have exactly one owner, found %',
      target_organization_id, total_owners
      USING ERRCODE = 'check_violation';
  END IF;
END;
$$ LANGUAGE plpgsql;
--> statement-breakpoint
-- A row's organization_id never changes through any Feudo code path today,
-- but an UPDATE trigger is not guaranteed that, so both the row's old and
-- new household are checked when they differ, not only NEW's.
CREATE FUNCTION "member_enforce_single_owner"() RETURNS trigger AS $$
BEGIN
  IF TG_OP = 'DELETE' THEN
    PERFORM "member_assert_single_owner"(OLD.organization_id);
  ELSIF TG_OP = 'UPDATE' THEN
    PERFORM "member_assert_single_owner"(NEW.organization_id);
    IF OLD.organization_id <> NEW.organization_id THEN
      PERFORM "member_assert_single_owner"(OLD.organization_id);
    END IF;
  ELSE
    PERFORM "member_assert_single_owner"(NEW.organization_id);
  END IF;

  RETURN NULL;
END;
$$ LANGUAGE plpgsql;
--> statement-breakpoint
-- DEFERRABLE INITIALLY DEFERRED: checked once at COMMIT, after every insert,
-- update and delete in the transaction has applied, so a transaction that
-- demotes the old owner and promotes a new one (or deletes one member row
-- while another statement adds a replacement) is judged on its final state,
-- not on an intermediate zero- or two-owner moment inside it.
CREATE CONSTRAINT TRIGGER "member_single_owner_trigger"
AFTER INSERT OR UPDATE OR DELETE ON "member"
DEFERRABLE INITIALLY DEFERRED
FOR EACH ROW EXECUTE FUNCTION "member_enforce_single_owner"();
