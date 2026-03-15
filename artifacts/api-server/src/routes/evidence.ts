import { Router, type IRouter } from "express";
import { v4 as uuidv4 } from "uuid";
import multer from "multer";
import { db } from "@workspace/db";
import { evidenceTable, auditEventsTable, claimsTable, type EvidenceItem } from "@workspace/db/schema";
import { eq } from "drizzle-orm";
import {
  ListEvidenceParams,
  GetUploadUrlParams,
  GetUploadUrlBody,
  ConfirmUploadParams,
  ConfirmUploadBody,
} from "@workspace/api-zod";
import { uploadFileToS3, createPresignedUploadUrl } from "../lib/storage-service";

const router: IRouter = Router();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 50 * 1024 * 1024 } });

const FILE_TYPE_MAP: Record<string, string> = {
  "image/jpeg": "photo",
  "image/png": "photo",
  "image/gif": "photo",
  "image/webp": "photo",
  "application/pdf": "document",
  "text/plain": "text_note",
  "audio/mpeg": "audio",
  "audio/mp4": "audio",
  "video/mp4": "video",
};

router.get("/claims/:claimId/evidence", async (req, res) => {
  try {
    const { claimId } = ListEvidenceParams.parse(req.params);
    const items = await db.select().from(evidenceTable).where(eq(evidenceTable.claimId, claimId));
    res.json(items.map(formatEvidence));
  } catch (error) {
    res.status(500).json({ error: "Failed to list evidence", message: (error instanceof Error ? error.message : String(error)) });
  }
});

router.post("/claims/:claimId/evidence/upload", upload.single("file"), async (req, res) => {
  try {
    const claimId = String(req.params.claimId);

    if (!req.file) {
      res.status(400).json({ error: "No file provided", message: "A file must be included in the request." });
      return;
    }

    let awsCredentials: { accessKeyId: string; secretAccessKey: string; region: string; s3BucketName: string; sessionToken?: string };
    try {
      awsCredentials = JSON.parse(req.body.awsCredentials || "{}");
    } catch {
      res.status(400).json({ error: "Invalid credentials", message: "awsCredentials must be a valid JSON string." });
      return;
    }

    if (!awsCredentials.accessKeyId || !awsCredentials.secretAccessKey || !awsCredentials.region || !awsCredentials.s3BucketName) {
      res.status(400).json({ error: "Missing credentials", message: "awsCredentials must include accessKeyId, secretAccessKey, region, and s3BucketName." });
      return;
    }

    const fileName = req.file.originalname;
    const mimeType = req.file.mimetype;
    const fileType = (FILE_TYPE_MAP[mimeType] || "document") as "receipt" | "photo" | "screenshot" | "document" | "text_note" | "audio" | "video";

    const { s3Key } = await uploadFileToS3(claimId, fileName, mimeType, req.file.buffer, {
      accessKeyId: awsCredentials.accessKeyId,
      secretAccessKey: awsCredentials.secretAccessKey,
      region: awsCredentials.region,
      sessionToken: awsCredentials.sessionToken,
      bucketName: awsCredentials.s3BucketName,
    });

    const id = uuidv4();
    const now = new Date();

    const [item] = await db.insert(evidenceTable).values({
      id,
      claimId,
      fileName,
      fileType,
      mimeType,
      s3Key,
      uploadedAt: now,
      analysisStatus: "pending",
    }).returning();

    await db.update(claimsTable).set({ status: "evidence_uploaded", updatedAt: now }).where(eq(claimsTable.id, claimId));

    await db.insert(auditEventsTable).values({
      id: uuidv4(),
      claimId,
      eventType: "evidence_uploaded",
      actor: "system",
      message: `Evidence "${fileName}" uploaded`,
      timestamp: now,
    });

    res.status(201).json(formatEvidence(item));
  } catch (error) {
    res.status(500).json({ error: "Upload failed", message: (error instanceof Error ? error.message : String(error)) });
  }
});

router.post("/claims/:claimId/evidence/upload-url", async (req, res) => {
  try {
    const { claimId } = GetUploadUrlParams.parse(req.params);
    const bodyResult = GetUploadUrlBody.safeParse(req.body);
    if (!bodyResult.success) {
      const issues = bodyResult.error.issues.map(i => `${i.path.join(".")}: ${i.message}`).join("; ");
      res.status(400).json({ error: "Invalid request body", message: issues || "awsCredentials (accessKeyId, secretAccessKey, region, s3BucketName) are required." });
      return;
    }
    const body = bodyResult.data;

    const { uploadUrl, s3Key } = await createPresignedUploadUrl(claimId, body.fileName, body.mimeType, {
      accessKeyId: body.awsCredentials.accessKeyId,
      secretAccessKey: body.awsCredentials.secretAccessKey,
      region: body.awsCredentials.region,
      sessionToken: body.awsCredentials.sessionToken,
      bucketName: body.awsCredentials.s3BucketName,
    });
    res.json({ uploadUrl, s3Key });
  } catch (error) {
    res.status(400).json({ error: "Failed to generate upload URL", message: (error instanceof Error ? error.message : String(error)) });
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

    await db.update(claimsTable).set({ status: "evidence_uploaded", updatedAt: now }).where(eq(claimsTable.id, claimId));

    await db.insert(auditEventsTable).values({
      id: uuidv4(),
      claimId,
      eventType: "evidence_uploaded",
      actor: "system",
      message: `Evidence "${body.fileName}" uploaded`,
      timestamp: now,
    });

    res.status(201).json(formatEvidence(item));
  } catch (error) {
    res.status(400).json({ error: "Failed to confirm upload", message: (error instanceof Error ? error.message : String(error)) });
  }
});

function formatEvidence(item: EvidenceItem) {
  return {
    ...item,
    uploadedAt: item.uploadedAt instanceof Date ? item.uploadedAt.toISOString() : item.uploadedAt,
  };
}

export default router;
