import { Router, type IRouter } from "express";
import { v4 as uuidv4 } from "uuid";
import { db } from "@workspace/db";
import { analysisRunsTable, claimsTable, evidenceTable, auditEventsTable, type AnalysisRun } from "@workspace/db/schema";
import { eq, desc } from "drizzle-orm";
import { AnalyzeClaimParams, GetAnalysisParams } from "@workspace/api-zod";
import { analyzeClaim, getModelId } from "../lib/analysis-service";

const router: IRouter = Router();

router.post("/claims/:claimId/analyze", async (req, res) => {
  try {
    const { claimId } = AnalyzeClaimParams.parse(req.params);

    const [claim] = await db.select().from(claimsTable).where(eq(claimsTable.id, claimId));
    if (!claim) {
      res.status(404).json({ error: "Not found", message: "Claim not found" });
      return;
    }

    await db.update(claimsTable).set({ status: "analyzing", updatedAt: new Date() }).where(eq(claimsTable.id, claimId));

    const evidence = await db.select().from(evidenceTable).where(eq(evidenceTable.claimId, claimId));

    const evidenceDescriptions = evidence.map(e => {
      const parts = [`File: ${e.fileName} (${e.fileType}, ${e.mimeType})`];
      if (e.extractedText) parts.push(`Content: ${e.extractedText}`);
      if (e.extractedFacts && e.extractedFacts.length > 0) parts.push(`Facts: ${e.extractedFacts.join(", ")}`);
      return parts.join(" | ");
    });

    await db.insert(auditEventsTable).values({
      id: uuidv4(),
      claimId,
      eventType: "analysis_started",
      actor: "system",
      message: `Analysis started with ${evidence.length} evidence items using ${getModelId()}`,
      timestamp: new Date(),
    });

    const result = await analyzeClaim(
      claim.title,
      claim.claimType,
      claim.merchantName,
      claim.customerName,
      claim.orderId,
      claim.narrative,
      claim.policyText,
      evidenceDescriptions
    );

    const runId = uuidv4();
    const now = new Date();

    const [run] = await db.insert(analysisRunsTable).values({
      id: runId,
      claimId,
      startedAt: now,
      completedAt: now,
      modelName: getModelId(),
      summary: result.summary,
      recommendation: result.recommendation,
      contradictions: result.contradictions,
      missingEvidence: result.missingEvidence,
      extractedFacts: result.extractedFacts,
      timeline: result.timeline,
      confidenceScore: result.confidenceScore,
      rawOutput: result.rawOutput,
    }).returning();

    await db.update(claimsTable).set({
      status: "analyzed",
      recommendation: result.recommendation,
      reviewerSummary: result.summary,
      confidenceScore: result.confidenceScore,
      timelineSummary: result.timeline.map(t => `${t.date}: ${t.event}`).join("\n"),
      updatedAt: now,
    }).where(eq(claimsTable.id, claimId));

    await db.insert(auditEventsTable).values({
      id: uuidv4(),
      claimId,
      eventType: "analysis_completed",
      actor: "system",
      message: `Analysis completed. Recommendation: ${result.recommendation} (confidence: ${(result.confidenceScore * 100).toFixed(0)}%)`,
      timestamp: now,
    });

    res.json(formatAnalysisRun(run));
  } catch (error) {
    res.status(500).json({ error: "Analysis failed", message: (error instanceof Error ? error.message : String(error)) });
  }
});

router.get("/claims/:claimId/analysis", async (req, res) => {
  try {
    const { claimId } = GetAnalysisParams.parse(req.params);
    const [run] = await db.select().from(analysisRunsTable)
      .where(eq(analysisRunsTable.claimId, claimId))
      .orderBy(desc(analysisRunsTable.startedAt))
      .limit(1);

    if (!run) {
      res.status(404).json({ error: "Not found", message: "No analysis found for this claim" });
      return;
    }
    res.json(formatAnalysisRun(run));
  } catch (error) {
    res.status(500).json({ error: "Failed to get analysis", message: (error instanceof Error ? error.message : String(error)) });
  }
});

function formatAnalysisRun(run: AnalysisRun) {
  return {
    ...run,
    startedAt: run.startedAt instanceof Date ? run.startedAt.toISOString() : run.startedAt,
    completedAt: run.completedAt instanceof Date ? run.completedAt.toISOString() : run.completedAt,
  };
}

export default router;
