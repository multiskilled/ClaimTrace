import { Router, type IRouter } from "express";
import { v4 as uuidv4 } from "uuid";
import { db } from "@workspace/db";
import { evidenceTable, auditEventsTable, claimsTable } from "@workspace/db/schema";
import { eq } from "drizzle-orm";
import {
  ListEvidenceParams,
  GetUploadUrlParams,
  GetUploadUrlBody,
  ConfirmUploadParams,
  ConfirmUploadBody,
} from "@workspace/api-zod";
import { createPresignedUploadUrl } from "../lib/storage-service";

const router: IRouter = Router();

router.get("/claims/:claimId/evidence", async (req, res) => {
  try {
    const { claimId } = ListEvidenceParams.parse(req.params);
    const items = await db.select().from(evidenceTable).where(eq(evidenceTable.claimId, claimId));
    res.json(items.map(formatEvidence));
  } catch (error: any) {
    res.status(500).json({ error: "Failed to list evidence", message: error.message });
  }
});

router.post("/claims/:claimId/evidence/upload-url", async (req, res) => {
  try {
    const { claimId } = GetUploadUrlParams.parse(req.params);
    const body = GetUploadUrlBody.parse(req.body);

    const { uploadUrl, s3Key } = await createPresignedUploadUrl(claimId, body.fileName, body.mimeType);
    res.json({ uploadUrl, s3Key });
  } catch (error: any) {
    res.status(400).json({ error: "Failed to generate upload URL", message: error.message });
  }
});

router.post("/claims/:claimId/evidence/confirm", async (req, res) => {
  try {
    const { claimId } = ConfirmUploadParams.parse(req.params);
    const body = ConfirmUploadBody.parse(req.body);
    const id = uuidv4();
    const now = new Date();

    const [item] = await db.insert(evidenceTable).values({
      id,
      claimId,
      fileName: body.fileName,
      fileType: body.fileType,
      mimeType: body.mimeType,
      s3Key: body.s3Key,
      uploadedAt: now,
      analysisStatus: "pending",
    }).returning();

    await db.update(claimsTable).set({
      status: "evidence_uploaded",
      updatedAt: now,
    }).where(eq(claimsTable.id, claimId));

    await db.insert(auditEventsTable).values({
      id: uuidv4(),
      claimId,
      eventType: "evidence_uploaded",
      actor: "system",
      message: `Evidence "${body.fileName}" uploaded`,
      timestamp: now,
    });

    res.status(201).json(formatEvidence(item));
  } catch (error: any) {
    res.status(400).json({ error: "Failed to confirm upload", message: error.message });
  }
});

function formatEvidence(item: any) {
  return {
    ...item,
    uploadedAt: item.uploadedAt instanceof Date ? item.uploadedAt.toISOString() : item.uploadedAt,
  };
}

export default router;
