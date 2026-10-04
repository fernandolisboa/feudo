import { describe, expect, it } from "vitest";
import { and, eq, inArray } from "drizzle-orm";

import type { EmailSender } from "@/modules/auth";
import { member, organization, session as sessionTable, user } from "@/modules/auth/schema";
import { householdSettings } from "@/modules/households/schema";
import { pushSubscription } from "@/modules/notifications/schema";
import { seedPushDevice } from "@/modules/notifications/test/fake-push-sender";
import {
  bankAccount,
  bankConnection,
  bankTransaction,
  providerCredential,
} from "@/modules/sync/schema";
import { seedSyncedConnection, seedTransaction } from "@/modules/sync/test/seed-synced-connection";
import {
  joinHousehold,
  seedHousehold,
  seedUser,
  type SeededUser,
} from "@/modules/sync/test/with-two-users";
import { withTestDb } from "@/platform/db/test/harness";

import type { Database } from "@/platform/db/client";
import {
  cancelAccountDeletion,
  previewAccountDeletion,
  purgeAccount,
  requestAccountDeletion,
  runAccountPurgeStep,
} from "./service";

const REQUESTED_AT = new Date("2026-10-03T12:00:00.000Z");
const GRACE_END = new Date("2026-10-10T12:00:00.000Z");
const JUST_BEFORE_GRACE_END = new Date("2026-10-10T11:59:59.999Z");

type SentEmail = { to: string; subject: string; text: string };

function recordingSender(): { sender: EmailSender; sent: SentEmail[] } {
  const sent: SentEmail[] = [];
  return {
    sent,
    sender: {
      send(input) {
        sent.push({ to: input.to, subject: input.subject, text: input.text });
        return Promise.resolve();
      },
    },
  };
}

function deps(sender: EmailSender, now = REQUESTED_AT) {
  return {
    emailSender: sender,
    now,
    cancelUrl: "https://feudo.test/exclusao-agendada",
  };
}

async function setRole(db: Database, userId: string, householdId: string, role: string) {
  await db
    .update(member)
    .set({ role })
    .where(and(eq(member.userId, userId), eq(member.organizationId, householdId)));
}

async function addMember(
  db: Database,
  name: string,
  householdId: string,
  role: "admin" | "member",
  joinedAt: Date,
): Promise<SeededUser> {
  const seeded = await seedUser(db, name, await seedHousehold(db, `Solo ${name}`));
  const memberId = await joinHousehold(db, seeded.id, householdId, role);
  await db.update(member).set({ createdAt: joinedAt }).where(eq(member.id, memberId));
  return seeded;
}

async function saveCredential(db: Database, userId: string): Promise<void> {
  await db
    .insert(providerCredential)
    .values({ userId, provider: "pluggy", ciphertext: "x", lastValidatedAt: new Date() });
}

async function openSession(db: Database, userId: string): Promise<void> {
  const id = crypto.randomUUID();
  await db.insert(sessionTable).values({
    id,
    token: id,
    userId,
    expiresAt: new Date(Date.now() + 86_400_000),
    updatedAt: new Date(),
  });
}

// Ana owns "Casa" and shares it with Bia (admin, joined later) and Caio
// (member, joined first); each has their own solo household too. Ana's
// connection has three months of transactions in Casa; Bia's has one.
async function seedCasa(db: Database) {
  const casa = await seedHousehold(db, "Casa");
  const ana = await seedUser(db, "Ana", casa);
  const anaSolo = await seedHousehold(db, "Solo Ana");
  await joinHousehold(db, ana.id, anaSolo, "owner");
  const caio = await addMember(db, "Caio", casa, "member", new Date("2026-01-01T00:00:00Z"));
  const bia = await addMember(db, "Bia", casa, "admin", new Date("2026-02-01T00:00:00Z"));
  const anaConnection = await seedSyncedConnection(db, ana, {
    household: { householdId: casa },
    itemId: "item-ana",
    transactions: [
      seedTransaction({ providerTransactionId: "a1", date: "2026-07-03" }),
      seedTransaction({ providerTransactionId: "a2", date: "2026-08-15" }),
      seedTransaction({ providerTransactionId: "a3", date: "2026-09-30" }),
    ],
  });
  const biaConnection = await seedSyncedConnection(db, bia, {
    household: { householdId: casa },
    itemId: "item-bia",
    transactions: [seedTransaction({ providerTransactionId: "b1", date: "2026-05-10" })],
  });
  await saveCredential(db, ana.id);
  await saveCredential(db, bia.id);
  await openSession(db, ana.id);
  await openSession(db, bia.id);
  return { casa, anaSolo, ana, bia, caio, anaConnection, biaConnection };
}

describe("account deletion (integration)", () => {
  it("previews, per household, the months that lose data, the successor and a household that goes too", async () => {
    await withTestDb(async (db) => {
      const { ana } = await seedCasa(db);

      const preview = await previewAccountDeletion(ana.session, db);

      expect(preview).toEqual([
        expect.objectContaining({
          householdName: "Casa",
          role: "owner",
          deletesHousehold: false,
          successorName: "Bia",
          accounts: 1,
          months: ["2026-07", "2026-08", "2026-09"],
          otherMembers: expect.arrayContaining([
            expect.objectContaining({ name: "Bia" }),
            expect.objectContaining({ name: "Caio" }),
          ]) as unknown,
        }),
        expect.objectContaining({
          householdName: "Solo Ana",
          role: "owner",
          deletesHousehold: true,
          successorName: null,
          accounts: 0,
          months: [],
          otherMembers: [],
        }),
      ]);
    });
  });

  it("falls back to the oldest member when the household has no admin", async () => {
    await withTestDb(async (db) => {
      const { ana, bia, casa } = await seedCasa(db);
      await setRole(db, bia.id, casa, "member");

      const [preview] = await previewAccountDeletion(ana.session, db);

      expect(preview?.successorName).toBe("Caio");
    });
  });

  it("marks the account, destroys only its credentials, revokes only its sessions and tells every other member", async () => {
    await withTestDb(async (db) => {
      const { ana, bia, caio } = await seedCasa(db);
      const { sender, sent } = recordingSender();

      const outcome = await requestAccountDeletion(ana.session, db, deps(sender));

      expect(outcome).toEqual({ status: "ok", purgeAt: GRACE_END });
      const [anaRow] = await db.select().from(user).where(eq(user.id, ana.id));
      expect(anaRow?.deletionRequestedAt).toEqual(REQUESTED_AT);
      const credentials = await db.select().from(providerCredential);
      expect(credentials.map((row) => row.userId)).toEqual([bia.id]);
      const sessions = await db.select().from(sessionTable);
      expect(sessions.map((row) => row.userId)).toEqual([bia.id]);

      expect(sent.map((email) => email.to).sort()).toEqual(
        [ana.session.email, bia.session.email, caio.session.email].sort(),
      );
      const toBia = sent.find((email) => email.to === bia.session.email);
      expect(toBia?.text).toContain("julho de 2026 a setembro de 2026");
      expect(toBia?.text).toContain("Bia passa a ser o responsável pela casa.");
      const toAna = sent.find((email) => email.to === ana.session.email);
      expect(toAna?.subject).toBe("Seu cadastro no Feudo será apagado em 10/10/2026");
    });
  });

  it("stops every notification of that person at once, and only theirs", async () => {
    await withTestDb(async (db) => {
      const { ana, bia } = await seedCasa(db);
      await seedPushDevice(db, ana.id);
      await seedPushDevice(db, ana.id);
      await seedPushDevice(db, bia.id);

      await requestAccountDeletion(ana.session, db, deps(recordingSender().sender));

      const devices = await db.select().from(pushSubscription);
      expect(devices.map((row) => row.userId)).toEqual([bia.id]);
    });
  });

  it("never moves the purge date when asked again", async () => {
    await withTestDb(async (db) => {
      const { ana } = await seedCasa(db);
      const { sender, sent } = recordingSender();
      await requestAccountDeletion(ana.session, db, deps(sender));

      const again = await requestAccountDeletion(
        ana.session,
        db,
        deps(sender, new Date("2026-10-05T00:00:00Z")),
      );

      expect(again).toEqual({ status: "already_pending" });
      const [anaRow] = await db.select().from(user).where(eq(user.id, ana.id));
      expect(anaRow?.deletionRequestedAt).toEqual(REQUESTED_AT);
      expect(sent).toHaveLength(3);
    });
  });

  it("cancels within the grace and keeps the credentials destroyed", async () => {
    await withTestDb(async (db) => {
      const { ana } = await seedCasa(db);
      const { sender } = recordingSender();
      await requestAccountDeletion(ana.session, db, deps(sender));
      const pending = {
        userId: ana.id,
        name: "Ana",
        email: ana.session.email,
        deletionRequestedAt: REQUESTED_AT,
      };

      expect(await cancelAccountDeletion(pending, db)).toEqual({ status: "ok" });
      expect(await cancelAccountDeletion(pending, db)).toEqual({ status: "not_pending" });

      const [anaRow] = await db.select().from(user).where(eq(user.id, ana.id));
      expect(anaRow?.deletionRequestedAt).toBeNull();
      expect(
        await db.select().from(providerCredential).where(eq(providerCredential.userId, ana.id)),
      ).toEqual([]);
      expect(await purgeAccount(db, ana.id, GRACE_END)).toBe("not_due");
    });
  });

  it("purges nothing before the grace ends", async () => {
    await withTestDb(async (db) => {
      const { ana } = await seedCasa(db);
      await requestAccountDeletion(ana.session, db, deps(recordingSender().sender));

      expect(await purgeAccount(db, ana.id, JUST_BEFORE_GRACE_END)).toBe("not_due");
      expect(await db.select().from(user).where(eq(user.id, ana.id))).toHaveLength(1);
    });
  });

  it("hard-deletes the user, their connections, accounts and transactions, passes ownership on and erases the household they were alone in", async () => {
    await withTestDb(async (db) => {
      const { ana, bia, caio, casa, anaSolo, anaConnection, biaConnection } = await seedCasa(db);
      await requestAccountDeletion(ana.session, db, deps(recordingSender().sender));

      expect(await purgeAccount(db, ana.id, GRACE_END)).toBe("purged");

      expect(await db.select().from(user).where(eq(user.id, ana.id))).toEqual([]);
      expect(
        await db
          .select()
          .from(bankConnection)
          .where(eq(bankConnection.id, anaConnection.connectionId)),
      ).toEqual([]);
      const anaAccountIds = [...anaConnection.accountIdsByProvider.values()];
      expect(
        await db.select().from(bankAccount).where(inArray(bankAccount.id, anaAccountIds)),
      ).toEqual([]);
      expect(
        await db
          .select()
          .from(bankTransaction)
          .where(inArray(bankTransaction.accountId, anaAccountIds)),
      ).toEqual([]);

      const casaMembers = await db.select().from(member).where(eq(member.organizationId, casa));
      expect(
        casaMembers
          .map((row) => ({ userId: row.userId, role: row.role }))
          .sort((a, b) => a.userId.localeCompare(b.userId)),
      ).toEqual(
        [
          { userId: bia.id, role: "owner" },
          { userId: caio.id, role: "member" },
        ].sort((a, b) => a.userId.localeCompare(b.userId)),
      );
      expect(await db.select().from(organization).where(eq(organization.id, anaSolo))).toEqual([]);

      const biaAccounts = await db
        .select({ householdId: bankAccount.householdId })
        .from(bankAccount)
        .where(eq(bankAccount.connectionId, biaConnection.connectionId));
      expect(biaAccounts).toEqual([{ householdId: casa }]);
      expect(await db.select().from(user).where(eq(user.id, bia.id))).toHaveLength(1);
    });
  });

  it("hands ownership to someone whose own deletion is pending only when nobody else is left", async () => {
    await withTestDb(async (db) => {
      const { ana, bia, caio, casa } = await seedCasa(db);
      const { sender } = recordingSender();
      await requestAccountDeletion(bia.session, db, deps(sender));
      await requestAccountDeletion(ana.session, db, deps(sender));

      await purgeAccount(db, ana.id, GRACE_END);

      const [owner] = await db
        .select({ userId: member.userId })
        .from(member)
        .where(and(eq(member.organizationId, casa), eq(member.role, "owner")));
      expect(owner?.userId).toBe(caio.id);
    });
  });

  it("purges every account past its grace in one step and leaves later ones for another day", async () => {
    await withTestDb(async (db) => {
      const { ana, bia } = await seedCasa(db);
      const { sender } = recordingSender();
      await requestAccountDeletion(ana.session, db, deps(sender));
      await requestAccountDeletion(bia.session, db, deps(sender, new Date("2026-10-05T00:00:00Z")));

      const step = await runAccountPurgeStep(db, GRACE_END, new Date(Date.now() + 60_000));

      expect(step).toEqual({ ok: true, purged: 1, failed: 0, unreached: 0 });
      expect(await db.select().from(user).where(eq(user.id, ana.id))).toEqual([]);
      expect(await db.select().from(user).where(eq(user.id, bia.id))).toHaveLength(1);
    });
  });

  it("leaves every due account for the next run once its deadline has passed", async () => {
    await withTestDb(async (db) => {
      const { ana } = await seedCasa(db);
      await requestAccountDeletion(ana.session, db, deps(recordingSender().sender));

      const step = await runAccountPurgeStep(db, GRACE_END, new Date(Date.now() - 1));

      expect(step).toEqual({ ok: true, purged: 0, failed: 0, unreached: 1 });
      expect(await db.select().from(user).where(eq(user.id, ana.id))).toHaveLength(1);
    });
  });

  it("emails the other members once per grace window, even when the user cancels and asks again", async () => {
    await withTestDb(async (db) => {
      const { ana, bia, caio } = await seedCasa(db);
      const { sender, sent } = recordingSender();
      const pending = {
        userId: ana.id,
        name: "Ana",
        email: ana.session.email,
        deletionRequestedAt: REQUESTED_AT,
      };
      await requestAccountDeletion(ana.session, db, deps(sender));
      await cancelAccountDeletion(pending, db);
      await requestAccountDeletion(ana.session, db, deps(sender, new Date("2026-10-04T00:00:00Z")));
      await cancelAccountDeletion(pending, db);

      const toMembers = (emails: SentEmail[]) =>
        emails.filter((email) => email.to === bia.session.email || email.to === caio.session.email);
      expect(toMembers(sent)).toHaveLength(2);
      expect(sent.filter((email) => email.to === ana.session.email)).toHaveLength(2);

      await requestAccountDeletion(ana.session, db, deps(sender, GRACE_END));
      expect(toMembers(sent)).toHaveLength(4);
    });
  });

  it("dates every email in the household's own time zone", async () => {
    await withTestDb(async (db) => {
      const { ana, bia, casa } = await seedCasa(db);
      await db
        .insert(householdSettings)
        .values({ householdId: casa, timeZone: "Asia/Tokyo", reserveMultiple: 6 });
      const { sender, sent } = recordingSender();

      await requestAccountDeletion(ana.session, db, deps(sender, new Date("2026-10-03T20:00:00Z")));

      const toAna = sent.find((email) => email.to === ana.session.email);
      expect(toAna?.subject).toBe("Seu cadastro no Feudo será apagado em 11/10/2026");
      const toBia = sent.find((email) => email.to === bia.session.email);
      expect(toBia?.text).toContain("Em 11/10/2026");
    });
  });

  it("erases a household the user owns that is already pending deletion, instead of handing it on, and says so first", async () => {
    await withTestDb(async (db) => {
      const { ana, bia, casa } = await seedCasa(db);
      await db
        .update(organization)
        .set({ deletionRequestedAt: REQUESTED_AT })
        .where(eq(organization.id, casa));
      const { sender, sent } = recordingSender();

      const preview = await previewAccountDeletion(ana.session, db);
      expect(preview.find((entry) => entry.householdId === casa)).toEqual(
        expect.objectContaining({
          alreadyPendingDeletion: true,
          deletesHousehold: true,
          successorName: null,
          otherMembers: [],
        }),
      );
      expect(
        (await previewAccountDeletion(bia.session, db)).some((entry) => entry.householdId === casa),
      ).toBe(false);

      await requestAccountDeletion(ana.session, db, deps(sender));
      expect(sent.map((email) => email.to)).toEqual([ana.session.email]);

      expect(await purgeAccount(db, ana.id, GRACE_END)).toBe("purged");
      expect(await db.select().from(organization).where(eq(organization.id, casa))).toEqual([]);
      expect(await db.select().from(user).where(eq(user.id, bia.id))).toHaveLength(1);
    });
  });

  it("isolation: one user's request never touches another user's account, credentials or sessions", async () => {
    await withTestDb(async (db) => {
      const { ana, bia } = await seedCasa(db);
      await requestAccountDeletion(ana.session, db, deps(recordingSender().sender));

      const [biaRow] = await db.select().from(user).where(eq(user.id, bia.id));
      expect(biaRow?.deletionRequestedAt).toBeNull();
      expect(
        await db.select().from(providerCredential).where(eq(providerCredential.userId, bia.id)),
      ).toHaveLength(1);
      expect(
        await db.select().from(sessionTable).where(eq(sessionTable.userId, bia.id)),
      ).toHaveLength(1);

      const biaPreview = await previewAccountDeletion(bia.session, db);
      const casaForBia = biaPreview.find((entry) => entry.householdName === "Casa");
      expect(casaForBia?.months).toEqual(["2026-05"]);
    });
  });
});
