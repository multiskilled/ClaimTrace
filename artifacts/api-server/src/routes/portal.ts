import { Router, type IRouter } from "express";
import { v4 as uuidv4 } from "uuid";
import { db } from "@workspace/db";
import { portalRecordsTable, claimsTable, auditEventsTable } from "@workspace/db/schema";
import { eq, desc } from "drizzle-orm";
import { SyncToPortalParams, SyncToPortalBody } from "@workspace/api-zod";

const router: IRouter = Router();

router.post("/claims/:claimId/portal-sync", async (req, res) => {
  try {
    const { claimId } = SyncToPortalParams.parse(req.params);
    const body = SyncToPortalBody.parse(req.body);

    const [claim] = await db.select().from(claimsTable).where(eq(claimsTable.id, claimId));
    if (!claim) {
      res.status(404).json({ error: "Not found", message: "Claim not found" });
      return;
    }

    const existing = await db.select().from(portalRecordsTable).where(eq(portalRecordsTable.claimId, claimId));
    const now = new Date();

    let record;
    if (existing.length > 0) {
      [record] = await db.update(portalRecordsTable).set({
        portalStatus: "synced",
        decision: body.decision,
        portalNotes: body.notes || null,
        syncedAt: now,
        claimTitle: claim.title,
        merchantName: claim.merchantName,
      }).where(eq(portalRecordsTable.claimId, claimId)).returning();
    } else {
      [record] = await db.insert(portalRecordsTable).values({
        id: uuidv4(),
        claimId,
        portalStatus: "synced",
        decision: body.decision,
        portalNotes: body.notes || null,
        syncedAt: now,
        claimTitle: claim.title,
        merchantName: claim.merchantName,
      }).returning();
    }

    await db.update(claimsTable).set({ status: "synced", updatedAt: now }).where(eq(claimsTable.id, claimId));

    await db.insert(auditEventsTable).values({
      id: uuidv4(),
      claimId,
      eventType: "portal_synced",
      actor: "system",
      message: `Decision "${body.decision}" synced to portal`,
      timestamp: now,
    });

    res.json(formatPortalRecord(record));
  } catch (error: any) {
    res.status(400).json({ error: "Failed to sync to portal", message: error.message });
  }
});

router.get("/portal/records", async (_req, res) => {
  try {
    const records = await db.select().from(portalRecordsTable).orderBy(desc(portalRecordsTable.syncedAt));
    res.json(records.map(formatPortalRecord));
  } catch (error: any) {
    res.status(500).json({ error: "Failed to list portal records", message: error.message });
  }
});

function formatPortalRecord(record: any) {
  return {
    ...record,
    syncedAt: record.syncedAt instanceof Date ? record.syncedAt.toISOString() : record.syncedAt,
  };
}

export default router;
