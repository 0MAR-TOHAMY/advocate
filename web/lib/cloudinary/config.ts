import { v2 as cloudinary } from "cloudinary";

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
});

export { cloudinary };

export const cloudinaryConfig = {
  cloudName: process.env.CLOUDINARY_CLOUD_NAME || "",
  uploadPreset: process.env.CLOUDINARY_UPLOAD_PRESET || "legal_case_manager",
  folder: {
    avatars: "advocate/avatars",
    covers: "advocate/covers",
    documents: "advocate/documents",
    cases: "advocate/cases",
  },
};
