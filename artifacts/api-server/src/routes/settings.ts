import { Router, type IRouter } from "express";
import { checkS3Connection } from "../lib/storage-service";
import { checkBedrockConnection, getModelId, getRegion } from "../lib/analysis-service";

const router: IRouter = Router();

router.get("/settings/status", async (_req, res) => {
  try {
    const [s3Status, bedrockStatus] = await Promise.all([
      checkS3Connection(),
      checkBedrockConnection(),
    ]);

    const hasDatabaseUrl = !!process.env.DATABASE_URL;

    res.json({
      s3: s3Status,
      database: {
        configured: hasDatabaseUrl,
        connected: hasDatabaseUrl,
        ...(hasDatabaseUrl ? {} : { error: "DATABASE_URL not configured" }),
      },
      bedrock: bedrockStatus,
      modelId: getModelId(),
      region: getRegion(),
    });
  } catch (error) {
    res.status(500).json({ error: "Failed to check status", message: (error instanceof Error ? error.message : String(error)) });
  }
});

export default router;
