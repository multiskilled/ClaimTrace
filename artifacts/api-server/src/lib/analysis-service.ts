import { BedrockRuntimeClient, InvokeModelCommand } from "@aws-sdk/client-bedrock-runtime";

const DEFAULT_MODEL_ID = process.env.BEDROCK_MODEL_ID || "us.amazon.nova-lite-v1:0";

interface AwsCredentials {
  accessKeyId: string;
  secretAccessKey: string;
  region: string;
  sessionToken?: string;
}

interface ExtractedFact {
  label: string;
  value: string;
  source: string;
  confidence: "high" | "medium" | "low";
}

interface TimelineEvent {
  date: string;
  event: string;
  source: string;
}

interface AnalysisResult {
  summary: string;
  recommendation: "approve" | "reject" | "human_review";
  contradictions: string[];
  missingEvidence: string[];
  extractedFacts: ExtractedFact[];
  timeline: TimelineEvent[];
  confidenceScore: number;
  rawOutput: string;
}

function createBedrockClient(credentials: AwsCredentials): BedrockRuntimeClient {
  return new BedrockRuntimeClient({
    region: credentials.region,
    credentials: {
      accessKeyId: credentials.accessKeyId,
      secretAccessKey: credentials.secretAccessKey,
      ...(credentials.sessionToken ? { sessionToken: credentials.sessionToken } : {}),
    },
  });
}

async function invokeNova(prompt: string, credentials: AwsCredentials): Promise<string> {
  const client = createBedrockClient(credentials);
  const modelId = DEFAULT_MODEL_ID;

  const payload = {
    messages: [
      {
        role: "user",
        content: [{ text: prompt }],
      },
    ],
    inferenceConfig: {
      maxTokens: 4096,
      temperature: 0.2,
      topP: 0.9,
    },
  };

  const command = new InvokeModelCommand({
    modelId,
    contentType: "application/json",
    accept: "application/json",
    body: JSON.stringify(payload),
  });

  const response = await client.send(command);
  const responseBody = JSON.parse(new TextDecoder().decode(response.body));

  if (responseBody.output?.message?.content?.[0]?.text) {
    return responseBody.output.message.content[0].text;
  }

  throw new Error("Unexpected response format from Bedrock");
}

function extractJsonFromResponse(text: string): Record<string, unknown> {
  const jsonMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (jsonMatch) {
    return JSON.parse(jsonMatch[1].trim());
  }

  const braceMatch = text.match(/\{[\s\S]*\}/);
  if (braceMatch) {
    return JSON.parse(braceMatch[0]);
  }

  throw new Error("No JSON found in model response");
}

export async function analyzeClaim(
  claimTitle: string,
  claimType: string,
  merchantName: string,
  customerName: string,
  orderId: string,
  narrative: string,
  policyText: string | null,
  evidenceDescriptions: string[],
  credentials: AwsCredentials
): Promise<AnalysisResult> {
  const evidenceSection = evidenceDescriptions.length > 0
    ? evidenceDescriptions.map((e, i) => `Evidence ${i + 1}: ${e}`).join("\n")
    : "No evidence files uploaded.";

  const prompt = `You are an expert claims analyst for ecommerce returns, warranty claims, and disputes. Analyze the following claim and provide a structured assessment.

CLAIM DETAILS:
- Title: ${claimTitle}
- Type: ${claimType}
- Merchant: ${merchantName}
- Customer: ${customerName}
- Order ID: ${orderId}
- Narrative: ${narrative}
${policyText ? `- Policy Context: ${policyText}` : ""}

EVIDENCE:
${evidenceSection}

Analyze this claim thoroughly. Consider:
1. Consistency of evidence with the narrative
2. Completeness of supporting documentation
3. Any contradictions between pieces of evidence
4. Missing evidence that would strengthen or weaken the claim
5. Timeline coherence
6. Policy compliance (if policy text provided)

Respond with ONLY valid JSON in this exact format:
{
  "summary": "A concise 2-3 sentence reviewer summary of the claim and evidence",
  "recommendation": "approve" | "reject" | "human_review",
  "contradictions": ["List of specific contradictions found, empty array if none"],
  "missingEvidence": ["List of missing evidence that would help resolve the claim"],
  "extractedFacts": [
    {
      "label": "Fact category (e.g. Purchase Date, Product Name, Damage Type)",
      "value": "The extracted value",
      "source": "Which evidence or narrative this came from",
      "confidence": "high" | "medium" | "low"
    }
  ],
  "timeline": [
    {
      "date": "YYYY-MM-DD or approximate date",
      "event": "Description of what happened",
      "source": "Source of this information"
    }
  ],
  "confidenceScore": 0.0 to 1.0
}`;

  try {
    const rawOutput = await invokeNova(prompt, credentials);
    let parsed: Record<string, unknown>;
    try {
      parsed = extractJsonFromResponse(rawOutput);
    } catch {
      throw new Error(`Model returned an unexpected response format. Raw output: ${rawOutput.slice(0, 500)}`);
    }

    return {
      summary: typeof parsed.summary === "string" ? parsed.summary : "Analysis completed",
      recommendation: validateRecommendation(parsed.recommendation),
      contradictions: Array.isArray(parsed.contradictions) ? parsed.contradictions.map(String) : [],
      missingEvidence: Array.isArray(parsed.missingEvidence) ? parsed.missingEvidence.map(String) : [],
      extractedFacts: Array.isArray(parsed.extractedFacts) ? parsed.extractedFacts.map((f: Record<string, unknown>) => validateFact(f)) : [],
      timeline: Array.isArray(parsed.timeline) ? parsed.timeline.map((t: Record<string, unknown>) => validateTimelineEvent(t)) : [],
      confidenceScore: typeof parsed.confidenceScore === "number" ? Math.min(1, Math.max(0, parsed.confidenceScore)) : 0.5,
      rawOutput,
    };
  } catch (error) {
    throw new Error(`Analysis failed: ${(error instanceof Error ? error.message : String(error))}`);
  }
}

function validateRecommendation(rec: unknown): "approve" | "reject" | "human_review" {
  if (typeof rec === "string" && ["approve", "reject", "human_review"].includes(rec)) return rec as "approve" | "reject" | "human_review";
  return "human_review";
}

function validateFact(fact: Record<string, unknown>): ExtractedFact {
  const confidence = String(fact.confidence || "low");
  return {
    label: String(fact.label || "Unknown"),
    value: String(fact.value || ""),
    source: String(fact.source || "Unknown"),
    confidence: (["high", "medium", "low"].includes(confidence) ? confidence : "low") as "high" | "medium" | "low",
  };
}

function validateTimelineEvent(event: Record<string, unknown>): TimelineEvent {
  return {
    date: String(event.date || "Unknown"),
    event: String(event.event || ""),
    source: String(event.source || "Unknown"),
  };
}

export function getModelId(): string {
  return DEFAULT_MODEL_ID;
}
