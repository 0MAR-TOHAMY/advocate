/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { documents, cases, clients, users } from "@/lib/schema";
import { eq, desc, asc, getTableColumns, and, or, like, sql } from "drizzle-orm";
import { nanoid } from "nanoid";
import { verifyToken } from "@/lib/auth/jwt";
import { uploadToCloudinary } from "@/lib/cloudinary/upload";
import { putObject } from "@/lib/s3/client";
import { requireActiveSubscription, hasStorageSpace } from "@/lib/subscription/guard";

export async function GET(request: NextRequest) {
    try {
        const accessToken = request.cookies.get("access_token")?.value;
        if (!accessToken) return NextResponse.json({ error: "غير مصرح" }, { status: 401 });
        const payload = verifyToken<{ userId: string; role: string; firmId: string }>(accessToken);
        const searchParams = request.nextUrl.searchParams;
        const caseId = searchParams.get("caseId");
        const search = searchParams.get("search");
        const type = searchParams.get("type");

        // Build query with joins
        const query = db.select({
            ...getTableColumns(documents),
            caseTitle: cases.title,
            clientName: clients.name,
            creatorName: users.name
        })
            .from(documents)
            .leftJoin(cases, eq(documents.caseId, cases.id))
            .leftJoin(clients, eq(cases.clientId, clients.id))
            .leftJoin(users, eq(documents.uploadedBy, users.id));

        const conditions: any[] = [eq(documents.firmId, payload.firmId) as any];

        if (caseId) {
            conditions.push(eq(documents.caseId, caseId));
        }

        if (type && type !== "all") {
            conditions.push(eq(documents.documentType, type as any));
        }

        if (search) {
            conditions.push(
                or(
                    like(documents.title, `%${search}%`),
                    like(documents.filename, `%${search}%`),
                    like(cases.title, `%${search}%`)
                )!
            );
        }

        const page = parseInt(searchParams.get("page") || "1", 10);
        const pageSize = parseInt(searchParams.get("pageSize") || "10", 10);
        const sort = searchParams.get("sort") || "createdAt";
        const order = (searchParams.get("order") || "desc").toLowerCase();
        const sorter = order === "asc" ? asc((documents as any)[sort]) : desc((documents as any)[sort]);
        const finalQuery = query.where(and(...conditions));
        const [{ count }] = await db.select({ count: sql<number>`count(*)` }).from(documents).where(and(...conditions)!);
        const items = await finalQuery.orderBy(sorter).limit(pageSize).offset((page - 1) * pageSize);

        return NextResponse.json({ items, page, pageSize, total: count });
    } catch (error) {
        console.error("Error fetching documents:", error);
        return NextResponse.json(
            { error: "Failed to fetch documents" },
            { status: 500 }
        );
    }
}

export async function POST(request: NextRequest) {
    try {
        const accessToken = request.cookies.get("access_token")?.value;
        if (!accessToken) return NextResponse.json({ error: "غير مصرح" }, { status: 401 });
        const payload = verifyToken<{ userId: string; role: string; firmId: string }>(accessToken);
        const formData = await request.formData();
        const file = formData.get("file") as File;
        const caseId = formData.get("caseId") as string;
        const title = formData.get("title") as string;
        const description = formData.get("description") as string;
        const documentType = formData.get("documentType") as any;
        const documentDate = formData.get("documentDate") as string;

        if (!file || !caseId) {
            return NextResponse.json(
                { error: "File and Case ID are required" },
                { status: 400 }
            );
        }

        const { allowed, errorResponse } = await requireActiveSubscription();
        if (!allowed) return errorResponse;

        const canUpload = await hasStorageSpace(payload.firmId, file.size);
        if (!canUpload) {
            return NextResponse.json(
                { error: "Storage limit reached. Please upgrade your plan." },
                { status: 403 }
            );
        }

        let storageKey = "";
        const isImage = file.type?.startsWith("image/");
        if (isImage) {
            // Keep Cloudinary for images
            const arrayBuffer = await file.arrayBuffer();
            const buffer = Buffer.from(arrayBuffer);
            const base64File = `data:${file.type};base64,${buffer.toString("base64")}`;
            const uploadResult = await uploadToCloudinary(base64File, {
                folder: "advocate/images",
                resourceType: "image",
            });
            storageKey = uploadResult.secureUrl || uploadResult.url;
        } else {
            // Use MinIO for documents
            const arrayBuffer = await file.arrayBuffer();
            const buffer = Buffer.from(arrayBuffer);
            const basePath = `${payload.firmId}/cases/${caseId}`;
            const key = `${basePath}/${Date.now()}-${file.name.replace(/[^a-zA-Z0-9_.-]/g, "_")}`;
            await putObject("documents", key, buffer, file.type || "application/octet-stream");
            storageKey = key; // store S3 key in DB
        }

        const newDocument = {
            id: nanoid(),
            firmId: payload.firmId,
            caseId,
            title: title || file.name,
            filename: file.name,
            description,
            documentType: documentType || "other",
            fileUrl: storageKey,
            fileSize: file.size,
            mimeType: file.type,
            documentDate: documentDate || null,
            uploadedBy: payload.userId,
        };

        const [result] = await db.insert(documents).values(newDocument).returning();

        return NextResponse.json(result, { status: 201 });
    } catch (error) {
        console.error("Error creating document:", error);
        return NextResponse.json(
            { error: "Failed to create document" },
            { status: 500 }
        );
    }
}

export async function DELETE(request: NextRequest) {
    try {
        const accessToken = request.cookies.get("access_token")?.value;
        if (!accessToken) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        const payload = verifyToken<{ userId: string; role: string; firmId: string }>(accessToken);

        // Check subscription (optional, but good practice for write ops)
        const { allowed, errorResponse } = await requireActiveSubscription();
        if (!allowed) return errorResponse;

        const searchParams = request.nextUrl.searchParams;
        const id = searchParams.get("id");

        if (!id) {
            return NextResponse.json({ error: "Document ID is required" }, { status: 400 });
        }

        // Check if document exists and belongs to firm
        const [doc] = await db.select().from(documents).where(and(eq(documents.id, id), eq(documents.firmId, payload.firmId)));
        if (!doc) {
            return NextResponse.json({ error: "Document not found" }, { status: 404 });
        }

        // Delete from DB
        await db.delete(documents).where(eq(documents.id, id));

        // Note: Ideally we should also delete from S3/Cloudinary, but skipping for now to avoid complexity without correct bucket info.

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Error deleting document:", error);
        return NextResponse.json({ error: "Failed to delete document" }, { status: 500 });
    }
}

export async function PATCH(request: NextRequest) {
    try {
        const accessToken = request.cookies.get("access_token")?.value;
        if (!accessToken) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        const payload = verifyToken<{ userId: string; role: string; firmId: string }>(accessToken);

        // Check subscription
        const { allowed, errorResponse } = await requireActiveSubscription();
        if (!allowed) return errorResponse;

        const data = await request.json();
        const { id, title, description, documentType, documentDate } = data;

        if (!id) {
            return NextResponse.json({ error: "Document ID is required" }, { status: 400 });
        }

        // Verify document belongs to firm
        const [existing] = await db.select().from(documents).where(and(eq(documents.id, id), eq(documents.firmId, payload.firmId)));
        if (!existing) {
            return NextResponse.json({ error: "Document not found" }, { status: 404 });
        }

        const updates: any = {};
        if (title !== undefined) updates.title = title;
        if (description !== undefined) updates.description = description;
        if (documentType !== undefined) updates.documentType = documentType;
        if (documentDate !== undefined) updates.documentDate = documentDate;

        const [updated] = await db.update(documents)
            .set(updates)
            .where(eq(documents.id, id))
            .returning();

        return NextResponse.json(updated);
    } catch (error) {
        console.error("Error updating document:", error);
        return NextResponse.json({ error: "Failed to update document" }, { status: 500 });
    }
}
