import { S3Client, HeadBucketCommand, CreateBucketCommand, GetObjectCommand, PutObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

const isProd = process.env.NODE_ENV === "production";

const endpoint = process.env.S3_ENDPOINT || process.env.MINIO_ENDPOINT;
const region = process.env.AWS_REGION || process.env.S3_REGION || process.env.MINIO_REGION || "us-east-1";
const accessKeyId = process.env.AWS_ACCESS_KEY_ID || process.env.MINIO_ACCESS_KEY || process.env.MINIO_ROOT_USER;
const secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY || process.env.MINIO_SECRET_KEY || process.env.MINIO_ROOT_PASSWORD;
const forcePathStyle = (process.env.S3_FORCE_PATH_STYLE || (endpoint ? "true" : "false")) === "true";
const autoCreateBuckets = (process.env.S3_AUTO_CREATE_BUCKETS || (isProd ? "false" : "true")) === "true";

if (isProd) {
  if (!accessKeyId) throw new Error("AWS_ACCESS_KEY_ID is required");
  if (!secretAccessKey) throw new Error("AWS_SECRET_ACCESS_KEY is required");
  if (forcePathStyle && !endpoint) throw new Error("S3_ENDPOINT is required when S3_FORCE_PATH_STYLE=true");
}

export const s3Client = new S3Client({
  region,
  forcePathStyle,
  ...(endpoint ? { endpoint } : {}),
  ...(accessKeyId && secretAccessKey ? { credentials: { accessKeyId, secretAccessKey } } : {}),
});

export async function ensureBucket(bucket: string) {
  try {
    await s3Client.send(new HeadBucketCommand({ Bucket: bucket }));
  } catch {
    if (!autoCreateBuckets) {
      throw new Error(`Bucket "${bucket}" does not exist or is not accessible`);
    }
    await s3Client.send(new CreateBucketCommand({ Bucket: bucket }));
  }
}

export async function presignGet(bucket: string, key: string, expires = 900) {
  const cmd = new GetObjectCommand({ Bucket: bucket, Key: key });
  return getSignedUrl(s3Client, cmd, { expiresIn: expires });
}

export async function putObject(bucket: string, key: string, body: Buffer | Uint8Array | string, contentType?: string) {
  await ensureBucket(bucket);
  await s3Client.send(new PutObjectCommand({ Bucket: bucket, Key: key, Body: body, ContentType: contentType }));
}

export async function deleteObject(bucket: string, key: string) {
  await s3Client.send(new DeleteObjectCommand({ Bucket: bucket, Key: key }));
}
