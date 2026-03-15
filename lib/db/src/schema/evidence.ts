import { pgTable, text, timestamp, jsonb, pgEnum } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { claimsTable } from "./claims";

export const evidenceTypeEnum = pgEnum("evidence_type", ["receipt", "photo", "screenshot", "document", "text_note", "audio", "video"]);
export const evidenceStatusEnum = pgEnum("evidence_status", ["pending", "processing", "completed", "failed"]);

export const evidenceTable = pgTable("evidence_items", {
  id: text("id").primaryKey(),
  claimId: text("claim_id").notNull().references(() => claimsTable.id),
  fileName: text("file_name").notNull(),
  fileType: evidenceTypeEnum("file_type").notNull(),
  mimeType: text("mime_type").notNull(),
  s3Key: text("s3_key").notNull(),
  uploadedAt: timestamp("uploaded_at").notNull().defaultNow(),
  extractedText: text("extracted_text"),
  extractedFacts: jsonb("extracted_facts").$type<string[]>(),
  analysisStatus: evidenceStatusEnum("analysis_status").notNull().default("pending"),
});

export const insertEvidenceSchema = createInsertSchema(evidenceTable).omit({ id: true, uploadedAt: true });
export type InsertEvidence = z.infer<typeof insertEvidenceSchema>;
export type EvidenceItem = typeof evidenceTable.$inferSelect;
