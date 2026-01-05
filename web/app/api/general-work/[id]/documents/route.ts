/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { generalWork, generalWorkDocuments } from "@/lib/schema";
import { eq, and, desc } from "drizzle-orm";
import { nanoid } from "nanoid";
import { verifyToken } from "@/lib/auth/jwt";

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const accessToken = request.cookies.get("access_token")?.value;
        if (!accessToken) return NextResponse.json({ error: "غير مصرح" }, { status: 401 });
        const payload = verifyToken<{ userId: string; role: string; firmId: string }>(accessToken);

        if (!payload.firmId) {
            return NextResponse.json({ error: "No firm associated with user" }, { status: 403 });
        }

        const { id } = await params;

        // Verify work belongs to the firm
        const [work] = await db
            .select()
            .from(generalWork)
            .where(and(eq(generalWork.id, id), eq(generalWork.firmId, payload.firmId)))
            .limit(1);

        if (!work) {
            return NextResponse.json({ error: "Work not found" }, { status: 404 });
        }

        // Get documents for this work
        const documents = await db
            .select()
            .from(generalWorkDocuments)
            .where(eq(generalWorkDocuments.workId, id))
            .orderBy(desc(generalWorkDocuments.createdAt));

        return NextResponse.json(documents);
    } catch (error) {
        console.error("Error fetching work documents:", error);
        return NextResponse.json(
            { error: "Failed to fetch documents" },
            { status: 500 }
        );
    }
}

export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const accessToken = request.cookies.get("access_token")?.value;
        if (!accessToken) return NextResponse.json({ error: "غير مصرح" }, { status: 401 });
        const payload = verifyToken<{ userId: string; role: string; firmId: string }>(accessToken);

        if (!payload.firmId) {
            return NextResponse.json({ error: "No firm associated with user" }, { status: 403 });
        }

        const { id } = await params;

        // Handle FormData upload
        const formData = await request.formData();
        const file = formData.get("file") as File;

        if (!file) {
            return NextResponse.json({ error: "No file provided" }, { status: 400 });
        }

        // Verify work belongs to the firm
        const [work] = await (db as any)
            .select()
            .from(generalWork as any)
            .where(and(eq((generalWork as any).id, id), eq((generalWork as any).firmId, payload.firmId)))
            .limit(1);

        if (!work) {
            return NextResponse.json({ error: "Work not found" }, { status: 404 });
        }

        // Upload to S3
        const arrayBuffer = await file.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);
        const fileExtension = file.name.split('.').pop() || 'bin';
        const key = `${payload.firmId}/general-work/${id}/${nanoid()}.${fileExtension}`;

        // Use putObject helper from existing codebase (assuming it exists as used in client docs)
        // If not imported, we need to import it. It was used in client-docs route.
        const { putObject } = await import("@/lib/s3/client");
        await putObject("documents", key, buffer, file.type);

        // Create download URL
        const fileUrl = `/api/documents/download?key=${encodeURIComponent(key)}&name=${encodeURIComponent(file.name)}`;

        const newDocument = {
            id: nanoid(),
            firmId: payload.firmId,
            workId: id,
            title: file.name,
            description: null,
            documentType: "other",
            fileUrl: fileUrl,
            fileSize: file.size,
            mimeType: file.type,
            uploadedBy: payload.userId,
            createdAt: new Date(),
            updatedAt: new Date(),
        };

        const [result] = await (db as any).insert(generalWorkDocuments as any).values(newDocument).returning();

        return NextResponse.json(result, { status: 201 });
    } catch (error) {
        console.error("Error uploading work document:", error);
        return NextResponse.json(
            { error: "Failed to upload document" },
            { status: 500 }
        );
    }
}

export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const accessToken = request.cookies.get("access_token")?.value;
        if (!accessToken) return NextResponse.json({ error: "غير مصرح" }, { status: 401 });
        const payload = verifyToken<{ userId: string; role: string; firmId: string }>(accessToken);

        if (!payload.firmId) {
            return NextResponse.json({ error: "No firm associated with user" }, { status: 403 });
        }

        const { id } = await params;
        const { searchParams } = new URL(request.url);
        const documentId = searchParams.get("documentId");

        if (!documentId) {
            return NextResponse.json({ error: "Document ID is required" }, { status: 400 });
        }

        // Verify document belongs to work and firm
        const [document] = await (db as any)
            .select()
            .from(generalWorkDocuments as any)
            .where(and(
                eq((generalWorkDocuments as any).id, documentId),
                eq((generalWorkDocuments as any).workId, id),
                eq((generalWorkDocuments as any).firmId, payload.firmId)
            ))
            .limit(1);

        if (!document) {
            return NextResponse.json({ error: "Document not found" }, { status: 404 });
        }

        await (db as any)
            .delete(generalWorkDocuments as any)
            .where(eq((generalWorkDocuments as any).id, documentId));

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Error deleting work document:", error);
        return NextResponse.json(
            { error: "Failed to delete document" },
            { status: 500 }
        );
    }
}
