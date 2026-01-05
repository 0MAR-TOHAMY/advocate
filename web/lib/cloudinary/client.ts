export const CLOUDINARY_API_BASE = "https://api.cloudinary.com/v1_1";

export interface UploadOptions {
  folder?: string;
  resourceType?: "image" | "video" | "raw" | "auto";
  tags?: string[];
}

export interface UploadResult {
  publicId: string;
  url: string;
  secureUrl: string;
  width?: number;
  height?: number;
  format: string;
  resourceType: string;
  bytes: number;
  createdAt: string;
}

export const cloudinaryClientConfig = {
  cloudName: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || process.env.CLOUDINARY_CLOUD_NAME || "",
  uploadPreset: process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET || process.env.CLOUDINARY_UPLOAD_PRESET || "legal_case_manager",
};

export async function uploadToCloudinaryViaPreset(
  file: Blob,
  options: UploadOptions = {}
): Promise<UploadResult> {
  const { folder = "advocate/covers", resourceType = "image", tags = [] } = options;

  const form = new FormData();
  form.append("file", file);
  form.append("upload_preset", cloudinaryClientConfig.uploadPreset);
  form.append("folder", folder);
  if (tags.length) form.append("tags", tags.join(","));

  const url = `${CLOUDINARY_API_BASE}/${cloudinaryClientConfig.cloudName}/${resourceType}/upload`;
  const res = await fetch(url, { method: "POST", body: form });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Cloudinary preset upload failed: ${res.status} ${text}`);
  }
  const result = await res.json() as {
    public_id: string;
    url: string;
    secure_url: string;
    width?: number;
    height?: number;
    format: string;
    resource_type: string;
    bytes: number;
    created_at: string;
  };
  return {
    publicId: result.public_id,
    url: result.url,
    secureUrl: result.secure_url,
    width: result.width,
    height: result.height,
    format: result.format,
    resourceType: result.resource_type,
    bytes: result.bytes,
    createdAt: result.created_at,
  };
}
