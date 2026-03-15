import { Router, type IRouter } from "express";
import { v4 as uuidv4 } from "uuid";
import { db } from "@workspace/db";
import { claimsTable, evidenceTable, analysisRunsTable, auditEventsTable } from "@workspace/db/schema";

const router: IRouter = Router();

router.post("/seed", async (_req, res) => {
  try {
    const now = new Date();
    const claimIds: string[] = [];

    const claim1Id = uuidv4();
    claimIds.push(claim1Id);
    await db.insert(claimsTable).values({
      id: claim1Id,
      title: "Damaged Laptop Screen - Return Request",
      claimType: "damage",
      merchantName: "TechStore Global",
      customerName: "Sarah Chen",
      orderId: "ORD-2024-78432",
      narrative: "Customer received a laptop with a cracked screen. The device was packaged in original manufacturer packaging with standard shipping protection. Customer reports the outer box showed no signs of damage, suggesting the screen was damaged before packaging. Photos of the damaged screen and intact packaging provided.",
      policyText: "Damaged goods can be returned within 30 days of delivery. Proof of damage must include photos of the product and original packaging. Refund or replacement offered at merchant discretion.",
      status: "analyzed",
      recommendation: "approve",
      reviewerSummary: "Strong evidence supports the damage claim. The customer provided clear photos of both the cracked screen and undamaged outer packaging, consistent with a pre-shipment defect. Timeline is within return policy window. Recommend approval for full refund or replacement.",
      confidenceScore: 0.92,
      timelineSummary: "2024-12-01: Order placed\n2024-12-05: Item shipped\n2024-12-08: Item delivered\n2024-12-08: Customer discovered damage\n2024-12-09: Claim filed with photos",
      createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
      updatedAt: now,
    });

    await db.insert(evidenceTable).values([
      {
        id: uuidv4(), claimId: claim1Id, fileName: "damaged_screen.jpg", fileType: "photo",
        mimeType: "image/jpeg", s3Key: `claims/${claim1Id}/evidence/damaged_screen.jpg`,
        uploadedAt: now, analysisStatus: "completed",
        extractedText: "Photo shows a laptop screen with visible cracks extending from the lower-left corner across the display.",
        extractedFacts: ["Visible screen cracks", "Lower-left corner impact point", "LCD panel separation visible"],
      },
      {
        id: uuidv4(), claimId: claim1Id, fileName: "intact_packaging.jpg", fileType: "photo",
        mimeType: "image/jpeg", s3Key: `claims/${claim1Id}/evidence/intact_packaging.jpg`,
        uploadedAt: now, analysisStatus: "completed",
        extractedText: "Photo shows original shipping box in good condition with no visible damage or crushing.",
        extractedFacts: ["Packaging intact", "No external damage visible", "Original manufacturer box used"],
      },
      {
        id: uuidv4(), claimId: claim1Id, fileName: "order_receipt.pdf", fileType: "receipt",
        mimeType: "application/pdf", s3Key: `claims/${claim1Id}/evidence/order_receipt.pdf`,
        uploadedAt: now, analysisStatus: "completed",
        extractedText: "Order #ORD-2024-78432. TechStore Global. ProBook Laptop 15-inch. $1,299.99. Ordered: Dec 1, 2024. Delivered: Dec 8, 2024.",
        extractedFacts: ["Order amount: $1,299.99", "Product: ProBook Laptop 15-inch", "Order date: Dec 1, 2024", "Delivery date: Dec 8, 2024"],
      },
    ]);

    await db.insert(analysisRunsTable).values({
      id: uuidv4(), claimId: claim1Id, startedAt: now, completedAt: now,
      modelName: "amazon.nova-lite-v1:0", recommendation: "approve", confidenceScore: 0.92,
      summary: "Strong evidence supports the damage claim. The customer provided clear photos of both the cracked screen and undamaged outer packaging, consistent with a pre-shipment defect. Timeline is within return policy window. Recommend approval for full refund or replacement.",
      contradictions: [],
      missingEvidence: ["Carrier delivery confirmation", "Unboxing video would further strengthen claim"],
      extractedFacts: [
        { label: "Product", value: "ProBook Laptop 15-inch", source: "Order receipt", confidence: "high" },
        { label: "Purchase Amount", value: "$1,299.99", source: "Order receipt", confidence: "high" },
        { label: "Damage Type", value: "Cracked screen, LCD separation", source: "Product photo", confidence: "high" },
        { label: "Packaging Condition", value: "Intact, no external damage", source: "Packaging photo", confidence: "high" },
        { label: "Claim Filed Within Policy", value: "Yes (1 day after delivery, within 30 days)", source: "Timeline analysis", confidence: "high" },
      ],
      timeline: [
        { date: "2024-12-01", event: "Order placed for ProBook Laptop", source: "Order receipt" },
        { date: "2024-12-05", event: "Item shipped by merchant", source: "Narrative" },
        { date: "2024-12-08", event: "Item delivered to customer", source: "Order receipt" },
        { date: "2024-12-08", event: "Customer discovered cracked screen upon unboxing", source: "Customer narrative" },
        { date: "2024-12-09", event: "Claim filed with supporting evidence", source: "System records" },
      ],
    });

    await db.insert(auditEventsTable).values([
      { id: uuidv4(), claimId: claim1Id, eventType: "claim_created", actor: "system", message: "Demo claim created: Damaged Laptop Screen", timestamp: now },
      { id: uuidv4(), claimId: claim1Id, eventType: "evidence_uploaded", actor: "system", message: "3 evidence items uploaded", timestamp: now },
      { id: uuidv4(), claimId: claim1Id, eventType: "analysis_completed", actor: "system", message: "Analysis completed. Recommendation: approve (92%)", timestamp: now },
    ]);

    const claim2Id = uuidv4();
    claimIds.push(claim2Id);
    await db.insert(claimsTable).values({
      id: claim2Id,
      title: "Warranty Claim - Contradictory Evidence",
      claimType: "warranty",
      merchantName: "ElectroMart",
      customerName: "James Wilson",
      orderId: "ORD-2024-55891",
      narrative: "Customer claims their wireless headphones stopped working after 2 months of normal use. Requests warranty replacement. Customer states headphones were never exposed to water or physical damage.",
      policyText: "12-month manufacturer warranty covers defects in materials and workmanship. Does not cover damage from misuse, water exposure, or physical impact. Proof of purchase required.",
      status: "analyzed",
      recommendation: "reject",
      reviewerSummary: "Evidence contains significant contradictions. Customer claims no water exposure, but product photos show visible water damage indicators (corrosion on charging contacts, water staining inside ear cup). Receipt confirms purchase is within warranty period, but damage appears to be from water exposure which is excluded under warranty terms.",
      confidenceScore: 0.85,
      timelineSummary: "2024-10-15: Order placed\n2024-10-18: Item delivered\n2024-12-20: Customer reports malfunction\n2024-12-21: Claim filed",
      createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
      updatedAt: now,
    });

    await db.insert(evidenceTable).values([
      {
        id: uuidv4(), claimId: claim2Id, fileName: "headphones_exterior.jpg", fileType: "photo",
        mimeType: "image/jpeg", s3Key: `claims/${claim2Id}/evidence/headphones_exterior.jpg`,
        uploadedAt: now, analysisStatus: "completed",
        extractedText: "Photo shows wireless headphones with visible wear. Charging port area shows green corrosion consistent with water exposure.",
        extractedFacts: ["Green corrosion on charging contacts", "Visible wear on headband", "Water damage indicators present"],
      },
      {
        id: uuidv4(), claimId: claim2Id, fileName: "customer_statement.txt", fileType: "text_note",
        mimeType: "text/plain", s3Key: `claims/${claim2Id}/evidence/customer_statement.txt`,
        uploadedAt: now, analysisStatus: "completed",
        extractedText: "I have been using these headphones normally for about 2 months. They suddenly stopped charging. I never got them wet or dropped them. They should still be under warranty.",
        extractedFacts: ["Claims normal use only", "Denies water exposure", "Denies physical damage", "Reports charging failure"],
      },
    ]);

    await db.insert(analysisRunsTable).values({
      id: uuidv4(), claimId: claim2Id, startedAt: now, completedAt: now,
      modelName: "amazon.nova-lite-v1:0", recommendation: "reject", confidenceScore: 0.85,
      summary: "Evidence contains significant contradictions. Customer claims no water exposure, but product photos show visible water damage indicators (corrosion on charging contacts, water staining inside ear cup). Receipt confirms purchase is within warranty period, but damage appears to be from water exposure which is excluded under warranty terms.",
      contradictions: [
        "Customer states no water exposure, but photos show corrosion consistent with water damage",
        "Customer claims normal use, but physical evidence suggests exposure to moisture or liquid",
        "Charging failure is consistent with water damage, not a manufacturing defect",
      ],
      missingEvidence: ["Original purchase receipt", "Additional photos of internal components"],
      extractedFacts: [
        { label: "Product", value: "Wireless headphones", source: "Customer statement", confidence: "high" },
        { label: "Usage Duration", value: "~2 months", source: "Customer statement", confidence: "medium" },
        { label: "Reported Issue", value: "Stopped charging", source: "Customer statement", confidence: "high" },
        { label: "Water Damage Indicators", value: "Corrosion on charging contacts", source: "Product photo", confidence: "high" },
        { label: "Customer Water Claim", value: "Denies any water exposure", source: "Customer statement", confidence: "high" },
      ],
      timeline: [
        { date: "2024-10-15", event: "Headphones purchased from ElectroMart", source: "Order information" },
        { date: "2024-10-18", event: "Item delivered", source: "Order information" },
        { date: "2024-12-20", event: "Customer reports headphones stopped charging", source: "Customer statement" },
        { date: "2024-12-21", event: "Warranty claim filed with photos", source: "System records" },
      ],
    });

    await db.insert(auditEventsTable).values([
      { id: uuidv4(), claimId: claim2Id, eventType: "claim_created", actor: "system", message: "Demo claim created: Warranty Claim - Contradictory Evidence", timestamp: now },
      { id: uuidv4(), claimId: claim2Id, eventType: "analysis_completed", actor: "system", message: "Analysis completed. Recommendation: reject (85%)", timestamp: now },
    ]);

    const claim3Id = uuidv4();
    claimIds.push(claim3Id);
    await db.insert(claimsTable).values({
      id: claim3Id,
      title: "Partial Refund Dispute - Incomplete Documentation",
      claimType: "dispute",
      merchantName: "FashionHub",
      customerName: "Maria Garcia",
      orderId: "ORD-2024-92104",
      narrative: "Customer ordered 3 items but only received 2. Requests refund for the missing item. Customer states they contacted support but received no response after 5 days.",
      status: "analyzed",
      recommendation: "human_review",
      reviewerSummary: "Claim has merit but lacks sufficient documentation for automated resolution. Customer reports a missing item from a multi-item order but has not provided the delivery confirmation or packing slip that would verify partial delivery. Support ticket reference is mentioned but not attached. Human review recommended to verify shipping records and support history before deciding.",
      confidenceScore: 0.55,
      timelineSummary: "2024-11-28: Order placed (3 items)\n2024-12-02: Package delivered\n2024-12-02: Customer notices missing item\n2024-12-03: Customer contacts support\n2024-12-08: No response from support\n2024-12-09: Dispute filed",
      createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
      updatedAt: now,
    });

    await db.insert(evidenceTable).values([
      {
        id: uuidv4(), claimId: claim3Id, fileName: "order_confirmation.pdf", fileType: "receipt",
        mimeType: "application/pdf", s3Key: `claims/${claim3Id}/evidence/order_confirmation.pdf`,
        uploadedAt: now, analysisStatus: "completed",
        extractedText: "Order #ORD-2024-92104. 3 items ordered: Blue Dress ($89.99), White Blouse ($45.99), Black Skirt ($59.99). Total: $195.97.",
        extractedFacts: ["3 items ordered", "Total: $195.97", "Order date: Nov 28, 2024"],
      },
    ]);

    await db.insert(analysisRunsTable).values({
      id: uuidv4(), claimId: claim3Id, startedAt: now, completedAt: now,
      modelName: "amazon.nova-lite-v1:0", recommendation: "human_review", confidenceScore: 0.55,
      summary: "Claim has merit but lacks sufficient documentation for automated resolution. Customer reports a missing item from a multi-item order but has not provided the delivery confirmation or packing slip that would verify partial delivery. Support ticket reference is mentioned but not attached. Human review recommended to verify shipping records and support history before deciding.",
      contradictions: [],
      missingEvidence: [
        "Delivery confirmation or tracking details",
        "Packing slip from received package",
        "Screenshot of support ticket or communication",
        "Photo of received items showing only 2 of 3 ordered",
      ],
      extractedFacts: [
        { label: "Items Ordered", value: "3 (Blue Dress, White Blouse, Black Skirt)", source: "Order confirmation", confidence: "high" },
        { label: "Total Amount", value: "$195.97", source: "Order confirmation", confidence: "high" },
        { label: "Items Received", value: "2 (claimed by customer)", source: "Customer narrative", confidence: "medium" },
        { label: "Missing Item", value: "Not specified which item is missing", source: "Customer narrative", confidence: "low" },
        { label: "Support Response", value: "No response after 5 days", source: "Customer narrative", confidence: "low" },
      ],
      timeline: [
        { date: "2024-11-28", event: "Order placed for 3 items totaling $195.97", source: "Order confirmation" },
        { date: "2024-12-02", event: "Package delivered to customer", source: "Customer narrative" },
        { date: "2024-12-02", event: "Customer discovers only 2 of 3 items received", source: "Customer narrative" },
        { date: "2024-12-03", event: "Customer contacts merchant support", source: "Customer narrative" },
        { date: "2024-12-08", event: "No response received from support (5 days)", source: "Customer narrative" },
        { date: "2024-12-09", event: "Dispute claim filed", source: "System records" },
      ],
    });

    await db.insert(auditEventsTable).values([
      { id: uuidv4(), claimId: claim3Id, eventType: "claim_created", actor: "system", message: "Demo claim created: Partial Refund Dispute", timestamp: now },
      { id: uuidv4(), claimId: claim3Id, eventType: "analysis_completed", actor: "system", message: "Analysis completed. Recommendation: human_review (55%)", timestamp: now },
    ]);

    res.json({ message: "Demo data seeded successfully", claimIds });
  } catch (error) {
    res.status(500).json({ error: "Failed to seed demo data", message: (error instanceof Error ? error.message : String(error)) });
  }
});

export default router;
