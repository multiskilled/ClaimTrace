import { pgTable, text, timestamp, pgEnum } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { claimsTable } from "./claims";
import { recommendationEnum } from "./claims";

export const portalStatusEnum = pgEnum("portal_status", ["pending", "synced", "rejected", "approved"]);

export const portalRecordsTable = pgTable("portal_records", {
  id: text("id").primaryKey(),
  claimId: text("claim_id").notNull().references(() => claimsTable.id),
  portalStatus: portalStatusEnum("portal_status").notNull().default("pending"),
  portalNotes: text("portal_notes"),
  decision: recommendationEnum("decision").notNull(),
  syncedAt: timestamp("synced_at").notNull().defaultNow(),
  claimTitle: text("claim_title"),
  merchantName: text("merchant_name"),
});

export const insertPortalRecordSchema = createInsertSchema(portalRecordsTable).omit({ id: true, syncedAt: true });
export type InsertPortalRecord = z.infer<typeof insertPortalRecordSchema>;
export type PortalRecord = typeof portalRecordsTable.$inferSelect;
