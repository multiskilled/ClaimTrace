import { pgTable, text, timestamp, real, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { claimsTable } from "./claims";
import { recommendationEnum } from "./claims";

export const analysisRunsTable = pgTable("analysis_runs", {
  id: text("id").primaryKey(),
  claimId: text("claim_id").notNull().references(() => claimsTable.id),
  startedAt: timestamp("started_at").notNull().defaultNow(),
  completedAt: timestamp("completed_at"),
  modelName: text("model_name").notNull(),
  summary: text("summary"),
  recommendation: recommendationEnum("recommendation").notNull(),
  contradictions: jsonb("contradictions").$type<string[]>(),
  missingEvidence: jsonb("missing_evidence").$type<string[]>(),
  extractedFacts: jsonb("extracted_facts").$type<{ label: string; value: string; source: string; confidence: string }[]>(),
  timeline: jsonb("timeline").$type<{ date: string; event: string; source: string }[]>(),
  confidenceScore: real("confidence_score").notNull(),
  rawOutput: text("raw_output"),
});

export const insertAnalysisRunSchema = createInsertSchema(analysisRunsTable).omit({ id: true, startedAt: true });
export type InsertAnalysisRun = z.infer<typeof insertAnalysisRunSchema>;
export type AnalysisRun = typeof analysisRunsTable.$inferSelect;
