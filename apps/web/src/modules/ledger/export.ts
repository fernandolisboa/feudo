import { eq } from "drizzle-orm";

import type { CurrentSession } from "@/modules/auth";

import { getDb } from "@/platform/db/client";
import {
  categorizationRule,
  householdSubcategory,
  internalTransferMark,
  transactionCategorization,
} from "./schema";

// The LGPD export's own reader (#25): only the annotations the session's
// user authored, never another member's choice on the same transaction — a
// transaction another member categorized or marked never shows up here at
// all, and one the user annotated on someone else's transaction surfaces
// only as the opaque transactionId (annotations travel with the account,
// ADR-0001, so they carry no household of their own to scope by).
export async function getLedgerExportAnnotations(session: CurrentSession) {
  const db = getDb();

  const [categorizations, internalTransferMarks, categorizationRules] = await Promise.all([
    db
      .select({
        transactionId: transactionCategorization.transactionId,
        productSubcategoryId: transactionCategorization.productSubcategoryId,
        householdSubcategoryId: transactionCategorization.householdSubcategoryId,
        householdSubcategoryName: householdSubcategory.name,
        categorizedAt: transactionCategorization.categorizedAt,
      })
      .from(transactionCategorization)
      .leftJoin(
        householdSubcategory,
        eq(householdSubcategory.id, transactionCategorization.householdSubcategoryId),
      )
      .where(eq(transactionCategorization.categorizedByUserId, session.userId)),

    db
      .select({
        transactionId: internalTransferMark.transactionId,
        isInternalTransfer: internalTransferMark.isInternalTransfer,
        markedAt: internalTransferMark.markedAt,
      })
      .from(internalTransferMark)
      .where(eq(internalTransferMark.markedByUserId, session.userId)),

    db
      .select({
        id: categorizationRule.id,
        householdId: categorizationRule.householdId,
        pattern: categorizationRule.pattern,
        direction: categorizationRule.direction,
        productSubcategoryId: categorizationRule.productSubcategoryId,
        householdSubcategoryId: categorizationRule.householdSubcategoryId,
        createdAt: categorizationRule.createdAt,
      })
      .from(categorizationRule)
      .where(eq(categorizationRule.createdByUserId, session.userId)),
  ]);

  return { categorizations, internalTransferMarks, categorizationRules };
}

export type LedgerExportAnnotations = Awaited<ReturnType<typeof getLedgerExportAnnotations>>;
