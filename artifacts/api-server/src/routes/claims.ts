import { Router, type IRouter } from "express";
import { v4 as uuidv4 } from "uuid";
import { db } from "@workspace/db";
import { claimsTable, auditEventsTable, type Claim } from "@workspace/db/schema";
import { eq, desc } from "drizzle-orm";
import {
  CreateClaimBody,
  GetClaimByIdParams,
  UpdateClaimBody,
  UpdateClaimParams,
  GetAuditTrailParams,
} from "@workspace/api-zod";

const router: IRouter = Router();

router.get("/claims", async (_req, res) => {
  try {
    const claims = await db.select().from(claimsTable).orderBy(desc(claimsTable.createdAt));
    res.json(claims.map(formatClaim));
  } catch (error) {
    res.status(500).json({ error: "Failed to list claims", message: (error instanceof Error ? error.message : String(error)) });
  }
});

router.post("/claims", async (req, res) => {
  try {
    const body = CreateClaimBody.parse(req.body);
    const id = uuidv4();
    const now = new Date();

    const [claim] = await db.insert(claimsTable).values({
      id,
      title: body.title,
      claimType: body.claimType,
      merchantName: body.merchantName,
      customerName: body.customerName,
      orderId: body.orderId,
      narrative: body.narrative,
      policyText: body.policyText || null,
      status: "draft",
      createdAt: now,
      updatedAt: now,
    }).returning();

    await db.insert(auditEventsTable).values({
      id: uuidv4(),
      claimId: id,
      eventType: "claim_created",
      actor: "system",
      message: `Claim "${body.title}" created`,
      timestamp: now,
    });

    res.status(201).json(formatClaim(claim));
  } catch (error) {
    res.status(400).json({ error: "Failed to create claim", message: (error instanceof Error ? error.message : String(error)) });
  }
});

router.get("/claims/:claimId", async (req, res) => {
  try {
    const { claimId } = GetClaimByIdParams.parse(req.params);
    const [claim] = await db.select().from(claimsTable).where(eq(claimsTable.id, claimId));
    if (!claim) {
      res.status(404).json({ error: "Not found", message: "Claim not found" });
      return;
    }
    res.json(formatClaim(claim));
  } catch (error) {
    res.status(500).json({ error: "Failed to get claim", message: (error instanceof Error ? error.message : String(error)) });
  }
});

router.patch("/claims/:claimId", async (req, res) => {
  try {
    const { claimId } = UpdateClaimParams.parse(req.params);
    const body = UpdateClaimBody.parse(req.body);

    const updates: Partial<Claim> & { updatedAt: Date } = { updatedAt: new Date() };
    if (body.title !== undefined) updates.title = body.title;
    if (body.narrative !== undefined) updates.narrative = body.narrative;
    if (body.policyText !== undefined) updates.policyText = body.policyText;
    if (body.status !== undefined) updates.status = body.status;

    const [claim] = await db.update(claimsTable).set(updates).where(eq(claimsTable.id, claimId)).returning();
    if (!claim) {
      res.status(404).json({ error: "Not found", message: "Claim not found" });
      return;
    }
    res.json(formatClaim(claim));
  } catch (error) {
    res.status(400).json({ error: "Failed to update claim", message: (error instanceof Error ? error.message : String(error)) });
  }
});

router.get("/claims/:claimId/audit", async (req, res) => {
  try {
    const { claimId } = GetAuditTrailParams.parse(req.params);
    const events = await db.select().from(auditEventsTable)
      .where(eq(auditEventsTable.claimId, claimId))
      .orderBy(desc(auditEventsTable.timestamp));
    res.json(events.map(e => ({
      ...e,
      timestamp: e.timestamp.toISOString(),
    })));
  } catch (error) {
    res.status(500).json({ error: "Failed to get audit trail", message: (error instanceof Error ? error.message : String(error)) });
  }
});

function formatClaim(claim: Claim) {
  return {
    ...claim,
    createdAt: claim.createdAt instanceof Date ? claim.createdAt.toISOString() : claim.createdAt,
    updatedAt: claim.updatedAt instanceof Date ? claim.updatedAt.toISOString() : claim.updatedAt,
  };
}

export default router;
