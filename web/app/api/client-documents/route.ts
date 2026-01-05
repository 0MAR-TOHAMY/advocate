import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { clientDocuments } from "@/lib/schema";
import { eq, desc, and, sql } from "drizzle-orm";
import { nanoid } from "nanoid";
import { putObject } from "@/lib/s3/client";
import { verifyToken } from "@/lib/auth/jwt";

export async function GET(request: NextRequest) {
    try {
        const accessToken = request.cookies.get("access_token")?.value;
        if (!accessToken) return NextResponse.json({ error: "غير مصرح" }, { status: 401 });
        const payload = verifyToken<{ userId: string; role: string; firmId: string }>(accessToken);
        const searchParams = request.nextUrl.searchParams;
        const clientId = searchParams.get("clientId");
        const page = parseInt(searchParams.get("page") || "1", 10);
        const pageSize = parseInt(searchParams.get("pageSize") || "10", 10);

        const conditions: any[] = [eq(clientDocuments.firmId as any, payload.firmId)];
        if (clientId) conditions.push(eq(clientDocuments.clientId as any, clientId));

        const [{ count }] = await (db as any)
            .select({ count: sql<number>`count(*)` })
            .from(clientDocuments as any)
            .where(and(...conditions));

        const result = await (db as any)
            .select()
            .from(clientDocuments as any)
            .where(and(...conditions))
            .orderBy(desc(clientDocuments.createdAt as any))
            .limit(pageSize)
            .offset((page - 1) * pageSize);

        return NextResponse.json({
            items: result,
            total: count,
            page,
            pageSize
        });
    } catch (error) {
        console.error("Error fetching client documents:", error);
        return NextResponse.json(
            { error: "Failed to fetch client documents" },
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
        const clientId = formData.get("clientId") as string;
        const title = formData.get("title") as string;
        const description = formData.get("description") as string;
        const documentType = formData.get("documentType") as string | null;
        const expiryDate = formData.get("expiryDate") as string;

        if (!file || !clientId) {
            return NextResponse.json(
                { error: "File and Client ID are required" },
                { status: 400 }
            );
        }

        // Convert file to buffer
        const arrayBuffer = await file.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);

        // Create a unique key for the file
        const fileExtension = file.name.split('.').pop() || 'bin';
        const key = `${payload.firmId}/clients/${clientId}/${nanoid()}.${fileExtension}`;
        const bucket = "documents";

        // Upload to S3/MinIO
        await putObject(bucket, key, buffer, file.type);

        // Store a URL that works through our proxy or directly
        // For consistency with other parts of the app that store only the key,
        // but the frontend expects a URL. Let's use the download proxy URL.
        const fileUrl = `/api/documents/download?key=${encodeURIComponent(key)}&name=${encodeURIComponent(file.name)}`;

        // Map document types to DB enum values
        const typeMapping: Record<string, string> = {
            "registrationDocument": "trade_license",
            "authorizationLetter": "poa",
            "representativeId": "national_id",
            "representativeProofOfAddress": "other",
            "powerOfAttorneyDocument": "poa",
            "kycFormDocument": "other",
            "national_id": "national_id",
            "passport": "passport",
            "trade_license": "trade_license",
            "tax_certificate": "tax_certificate",
            "poa": "poa",
            "contract": "contract",
            "other": "other"
        };

        const dbDocumentType = typeMapping[documentType || ""] || "other";

        const newDocument = {
            id: nanoid(),
            firmId: payload.firmId,
            clientId,
            title: title || file.name,
            description,
            documentType: dbDocumentType,
            fileUrl: fileUrl,
            fileSize: file.size,
            mimeType: file.type,
            expiryDate: expiryDate ? new Date(expiryDate) : null,
            uploadedBy: payload.userId,
        };

        const [result] = await (db as any).insert(clientDocuments as any).values(newDocument).returning();

        return NextResponse.json(result, { status: 201 });
    } catch (error) {
        console.error("Error creating client document:", error);
        return NextResponse.json(
            { error: "Failed to create client document" },
            { status: 500 }
        );
    }
}
