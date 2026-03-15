import { Router, type IRouter } from "express";

const router: IRouter = Router();

router.get("/settings/status", async (_req, res) => {
  try {
    const hasDatabaseUrl = !!process.env.DATABASE_URL;

    res.json({
      database: {
        configured: hasDatabaseUrl,
        connected: hasDatabaseUrl,
        ...(hasDatabaseUrl ? {} : { error: "DATABASE_URL not configured" }),
      },
    });
  } catch (error) {
    res.status(500).json({ error: "Failed to check status", message: (error instanceof Error ? error.message : String(error)) });
  }
});

export default router;
