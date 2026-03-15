import { S3Client, PutObjectCommand, GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { v4 as uuidv4 } from "uuid";

interface AwsCredentials {
  accessKeyId: string;
  secretAccessKey: string;
  region: string;
  sessionToken?: string;
  bucketName: string;
}

function createS3Client(credentials: AwsCredentials): S3Client {
  return new S3Client({
    region: credentials.region,
    credentials: {
      accessKeyId: credentials.accessKeyId,
      secretAccessKey: credentials.secretAccessKey,
      ...(credentials.sessionToken ? { sessionToken: credentials.sessionToken } : {}),
    },
  });
}

export async function createPresignedUploadUrl(
  claimId: string,
  fileName: string,
  mimeType: string,
  credentials: AwsCredentials
): Promise<{ uploadUrl: string; s3Key: string }> {
  const s3Key = `claims/${claimId}/evidence/${uuidv4()}-${fileName}`;
  const client = createS3Client(credentials);

  const command = new PutObjectCommand({
    Bucket: credentials.bucketName,
    Key: s3Key,
    ContentType: mimeType,
  });

  const uploadUrl = await getSignedUrl(client, command, { expiresIn: 3600 });
  return { uploadUrl, s3Key };
}

export async function getSignedDownloadUrl(s3Key: string, credentials: AwsCredentials): Promise<string> {
  const client = createS3Client(credentials);
  const command = new GetObjectCommand({
    Bucket: credentials.bucketName,
    Key: s3Key,
  });

  return getSignedUrl(client, command, { expiresIn: 3600 });
}
