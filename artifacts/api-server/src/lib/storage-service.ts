import { S3Client, PutObjectCommand, GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { v4 as uuidv4 } from "uuid";

const region = process.env.AWS_REGION || "us-east-1";
const bucketName = process.env.S3_BUCKET_NAME;

let s3Client: S3Client | null = null;

function getS3Client(): S3Client {
  if (!s3Client) {
    if (!process.env.AWS_ACCESS_KEY_ID || !process.env.AWS_SECRET_ACCESS_KEY) {
      throw new Error("AWS credentials not configured. Set AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY.");
    }
    s3Client = new S3Client({
      region,
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
        ...(process.env.AWS_SESSION_TOKEN ? { sessionToken: process.env.AWS_SESSION_TOKEN } : {}),
      },
    });
  }
  return s3Client;
}

export async function createPresignedUploadUrl(claimId: string, fileName: string, mimeType: string): Promise<{ uploadUrl: string; s3Key: string }> {
  if (!bucketName) {
    throw new Error("S3_BUCKET_NAME not configured.");
  }

  const s3Key = `claims/${claimId}/evidence/${uuidv4()}-${fileName}`;
  const client = getS3Client();

  const command = new PutObjectCommand({
    Bucket: bucketName,
    Key: s3Key,
    ContentType: mimeType,
  });

  const uploadUrl = await getSignedUrl(client, command, { expiresIn: 3600 });
  return { uploadUrl, s3Key };
}

export async function getSignedDownloadUrl(s3Key: string): Promise<string> {
  if (!bucketName) {
    throw new Error("S3_BUCKET_NAME not configured.");
  }

  const client = getS3Client();
  const command = new GetObjectCommand({
    Bucket: bucketName,
    Key: s3Key,
  });

  return getSignedUrl(client, command, { expiresIn: 3600 });
}

export function isS3Configured(): boolean {
  return !!(process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY && bucketName);
}

export async function checkS3Connection(): Promise<{ configured: boolean; connected: boolean; error?: string }> {
  if (!isS3Configured()) {
    return { configured: false, connected: false, error: "S3 credentials or bucket name not configured" };
  }
  try {
    getS3Client();
    return { configured: true, connected: true };
  } catch (e: any) {
    return { configured: true, connected: false, error: e.message };
  }
}
