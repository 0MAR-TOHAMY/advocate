/* eslint-disable @typescript-eslint/no-explicit-any */
import { cloudinary, cloudinaryConfig } from "./config";

const CLOUDINARY_API_BASE = "https://api.cloudinary.com/v1_1";

export interface UploadOptions {
  folder?: string;
  transformation?: object[];
  resourceType?: "image" | "video" | "raw" | "auto";
  publicId?: string;
  overwrite?: boolean;
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

/**
 * Upload file to Cloudinary from base64 string
 */
export async function uploadToCloudinary(
  fileData: string,
  options: UploadOptions = {}
): Promise<UploadResult> {
  try {
    const {
      folder = cloudinaryConfig.folder.avatars,
      transformation = [],
      resourceType = "auto",
      publicId,
      overwrite = true,
      tags = [],
    } = options;

    const uploadOptions: any = {
      folder,
      resource_type: resourceType,
      overwrite,
      tags,
    };

    if (publicId) {
      uploadOptions.public_id = publicId;
    }

    if (transformation.length > 0) {
      uploadOptions.transformation = transformation;
    }

    const result = await cloudinary.uploader.upload(fileData, uploadOptions);

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
  } catch (error) {
    console.error("Cloudinary upload error:", error);
    throw new Error("Failed to upload file to Cloudinary");
  }
}

/**
 * Upload using unsigned preset via multipart/form-data (more robust for large files)
 */
export async function uploadToCloudinaryViaPreset(
  file: Blob,
  options: UploadOptions = {}
): Promise<UploadResult> {
  try {
    const {
      folder = cloudinaryConfig.folder.documents,
      resourceType = "auto",
      tags = [],
    } = options;

    const form = new FormData();
    form.append("file", file);
    form.append("upload_preset", cloudinaryConfig.uploadPreset);
    form.append("folder", folder);
    if (tags.length) form.append("tags", tags.join(","));

    const url = `${CLOUDINARY_API_BASE}/${cloudinaryConfig.cloudName}/${resourceType}/upload`;
    const res = await fetch(url, { method: "POST", body: form });
    if (!res.ok) {
      const text = await res.text();
      throw new Error(`Cloudinary preset upload failed: ${res.status} ${text}`);
    }
    const result: any = await res.json();
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
  } catch (error) {
    console.error("Cloudinary preset upload error:", error);
    throw new Error("Failed to upload file to Cloudinary (preset)");
  }
}

/**
 * Upload avatar image with automatic optimization
 */
export async function uploadAvatar(
  fileData: string,
  userId: string
): Promise<UploadResult> {
  return uploadToCloudinary(fileData, {
    folder: cloudinaryConfig.folder.avatars,
    publicId: `avatar_${userId}`,
    transformation: [
      {
        width: 400,
        height: 400,
        crop: "fill",
        gravity: "face",
        quality: "auto:good",
        fetch_format: "auto",
      },
    ],
    tags: ["avatar", userId],
  });
}

/**
 * Upload cover image with automatic optimization
 */
export async function uploadCover(
  fileData: string,
  userId: string
): Promise<UploadResult> {
  return uploadToCloudinary(fileData, {
    folder: cloudinaryConfig.folder.covers,
    publicId: `cover_${userId}`,
    transformation: [
      {
        width: 1200,
        height: 400,
        crop: "fill",
        quality: "auto:good",
        fetch_format: "auto",
      },
    ],
    tags: ["cover", userId],
  });
}

/**
 * Upload firm logo with automatic optimization
 */
export async function uploadFirmLogo(
  fileData: string,
  firmId: string
): Promise<UploadResult> {
  return uploadToCloudinary(fileData, {
    folder: "firms/logos",
    publicId: `logo_${firmId}`,
    transformation: [
      {
        width: 500,
        height: 500,
        crop: "limit",
        quality: "auto:good",
        fetch_format: "auto",
      },
    ],
    tags: ["firm_logo", firmId],
  });
}

/**
 * Upload firm license document (raw/auto)
 */
export async function uploadFirmLicense(
  fileData: string,
  firmId: string
): Promise<UploadResult> {
  return uploadToCloudinary(fileData, {
    folder: "firms/licenses",
    publicId: `license_${firmId}`,
    resourceType: "auto",
    tags: ["firm_license", firmId],
  });
}

/**
 * Delete file from Cloudinary
 */
export async function deleteFromCloudinary(
  publicId: string,
  resourceType: "image" | "video" | "raw" = "image"
): Promise<boolean> {
  try {
    const result = await cloudinary.uploader.destroy(publicId, {
      resource_type: resourceType,
    });
    return result.result === "ok";
  } catch (error) {
    console.error("Cloudinary delete error:", error);
    return false;
  }
}

/**
 * Get optimized image URL with transformations
 */
export function getOptimizedImageUrl(
  publicId: string,
  options: {
    width?: number;
    height?: number;
    crop?: string;
    quality?: string;
    format?: string;
  } = {}
): string {
  const {
    width,
    height,
    crop = "fill",
    quality = "auto:good",
    format = "auto",
  } = options;

  const transformation: any = {
    quality,
    fetch_format: format,
  };

  if (width) transformation.width = width;
  if (height) transformation.height = height;
  if (width || height) transformation.crop = crop;

  return cloudinary.url(publicId, { transformation });
}
