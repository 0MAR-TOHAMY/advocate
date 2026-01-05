/* eslint-disable @typescript-eslint/no-unused-vars */
import { NextResponse } from "next/server";
import { cloudinary } from "@/lib/cloudinary/config";

export async function POST(req: Request) {
  try {
    const form = await req.formData();
    const file = form.get("file") as File | null;
    if (!file) return NextResponse.json({ message: "file مطلوب" }, { status: 400 });
    const folder = (form.get("folder") as string) || "advocate/documents";
    const resourceTypeRaw = (form.get("resourceType") as string) || "image";
    const resourceType =
      resourceTypeRaw === "auto" ||
      resourceTypeRaw === "image" ||
      resourceTypeRaw === "video" ||
      resourceTypeRaw === "raw"
        ? resourceTypeRaw
        : "image";
    const tagsStr = (form.get("tags") as string) || "";
    const publicId = (form.get("publicId") as string) || undefined;

    const ab = await file.arrayBuffer();
    const base64 = Buffer.from(ab).toString("base64");
    const dataUri = `data:${file.type};base64,${base64}`;

    const result: any = await cloudinary.uploader.upload(dataUri, {
      folder,
      resource_type: resourceType,
      overwrite: true,
      public_id: publicId,
      tags: tagsStr ? tagsStr.split(",") : undefined,
    });

    return NextResponse.json({
      publicId: result.public_id,
      url: result.url,
      secureUrl: result.secure_url,
      width: result.width,
      height: result.height,
      format: result.format,
      resourceType: result.resource_type,
      bytes: result.bytes,
      createdAt: result.created_at,
    }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ message: "فشل الرفع" }, { status: 500 });
  }
}
