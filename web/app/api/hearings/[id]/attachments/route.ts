import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { hearingAttachments, hearings } from "@/lib/schema";
import { eq, and, desc } from "drizzle-orm";
import { nanoid } from "nanoid";
import { verifyToken } from "@/lib/auth/jwt";
import { uploadToCloudinary } from "@/lib/cloudinary/upload";
import { putObject } from "@/lib/s3/client";
import { requireActiveSubscription, hasStorageSpace } from "@/lib/subscription/guard";

export async function GET(
    req: NextRequest,
    ctx: { params: Promise<{ id: string }> }
) {
    try {
        const accessToken = req.cookies.get("access_token")?.value;
        if (!accessToken) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const payload = verifyToken<{ userId: string; role: string; firmId: string }>(accessToken);
        const { id: hearingId } = await ctx.params;

        // Fetch attachments for this hearing
        const items = await (db as any).select()
            .from(hearingAttachments as any)
            .where(and(
                eq((hearingAttachments as any).hearingId, hearingId),
                eq((hearingAttachments as any).firmId, payload.firmId)
            ))
            .orderBy(desc((hearingAttachments as any).createdAt)) as any[];

        return NextResponse.json({ items });
    } catch (error) {
        console.error("Error fetching hearing attachments:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}

export async function POST(
    req: NextRequest,
    ctx: { params: Promise<{ id: string }> }
) {
    try {
        const accessToken = req.cookies.get("access_token")?.value;
        if (!accessToken) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const payload = verifyToken<{ userId: string; role: string; firmId: string }>(accessToken);
        const { id: hearingId } = await ctx.params;

        const formData = await req.formData();
        const file = formData.get("file") as File;

        if (!file) {
            return NextResponse.json({ error: "No file provided" }, { status: 400 });
        }

        // 1. Verify hearing belongs to the firm
        const [hearing] = await (db as any).select().from(hearings as any).where(and(eq((hearings as any).id, hearingId), eq((hearings as any).firmId, payload.firmId))).limit(1) as any[];
        if (!hearing) {
            return NextResponse.json({ error: "Hearing not found" }, { status: 404 });
        }

        // 2. Resource check
        const { allowed, errorResponse } = await requireActiveSubscription();
        if (!allowed) return errorResponse;

        const canUpload = await hasStorageSpace(payload.firmId, file.size);
        if (!canUpload) {
            return NextResponse.json({ error: "Storage limit reached" }, { status: 403 });
        }

        // 3. Upload file
        let storageKey = "";
        const isImage = file.type?.startsWith("image/");

        if (isImage) {
            const arrayBuffer = await file.arrayBuffer();
            const buffer = Buffer.from(arrayBuffer);
            const base64File = `data:${file.type};base64,${buffer.toString("base64")}`;
            const uploadResult = await uploadToCloudinary(base64File, {
                folder: "advocate/hearings",
                resourceType: "image",
            });
            storageKey = uploadResult.secureUrl || uploadResult.url;
        } else {
            const arrayBuffer = await file.arrayBuffer();
            const buffer = Buffer.from(arrayBuffer);
            const basePath = `${payload.firmId}/hearings/${hearingId}`;
            const key = `${basePath}/${Date.now()}-${file.name.replace(/[^a-zA-Z0-9_.-]/g, "_")}`;
            await putObject("documents", key, buffer, file.type || "application/octet-stream");
            storageKey = key;
        }

        // 4. Save to database
        const attachment = {
            id: nanoid(),
            firmId: payload.firmId,
            hearingId,
            fileName: file.name,
            fileUrl: storageKey,
            fileSize: file.size,
            mimeType: file.type,
            uploadedBy: payload.userId,
            createdAt: new Date(),
        };

        const [result] = await (db as any).insert(hearingAttachments as any).values(attachment).returning() as any[];

        return NextResponse.json(result, { status: 201 });
    } catch (error) {
        console.error("Error uploading hearing attachment:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}

export async function DELETE(
    req: NextRequest,
    ctx: { params: Promise<{ id: string }> }
) {
    try {
        const accessToken = req.cookies.get("access_token")?.value;
        if (!accessToken) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const payload = verifyToken<{ userId: string; role: string; firmId: string }>(accessToken);
        const { id: hearingId } = await ctx.params;
        const { searchParams } = new URL(req.url);
        const attachmentId = searchParams.get("attachmentId");

        if (!attachmentId) {
            return NextResponse.json({ error: "Attachment ID is required" }, { status: 400 });
        }

        await (db as any).delete(hearingAttachments as any)
            .where(and(
                eq((hearingAttachments as any).id, attachmentId),
                eq((hearingAttachments as any).hearingId, hearingId),
                eq((hearingAttachments as any).firmId, payload.firmId)
            ));

        return NextResponse.json({ success: true });
    } catch (error: any) {
        console.error("Error deleting hearing attachment:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
