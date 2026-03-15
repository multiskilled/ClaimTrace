import { pgTable, text, timestamp, real, pgEnum } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const claimTypeEnum = pgEnum("claim_type", ["return", "warranty", "dispute", "damage", "other"]);
export const claimStatusEnum = pgEnum("claim_status", ["draft", "evidence_uploaded", "analyzing", "analyzed", "synced"]);
export const recommendationEnum = pgEnum("recommendation", ["approve", "reject", "human_review"]);

export const claimsTable = pgTable("claims", {
  id: text("id").primaryKey(),
  title: text("title").notNull(),
  claimType: claimTypeEnum("claim_type").notNull(),
  merchantName: text("merchant_name").notNull(),
  customerName: text("customer_name").notNull(),
  orderId: text("order_id").notNull(),
  narrative: text("narrative").notNull(),
  policyText: text("policy_text"),
  status: claimStatusEnum("status").notNull().default("draft"),
  recommendation: recommendationEnum("recommendation"),
  reviewerSummary: text("reviewer_summary"),
  confidenceScore: real("confidence_score"),
  timelineSummary: text("timeline_summary"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const insertClaimSchema = createInsertSchema(claimsTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertClaim = z.infer<typeof insertClaimSchema>;
export type Claim = typeof claimsTable.$inferSelect;
