import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { clients } from "@/lib/schema";
import { and, eq } from "drizzle-orm";
import { verifyToken } from "@/lib/auth/jwt";
import { requireActiveSubscription } from "@/lib/subscription/guard";
import { requireResourcePermission } from "@/lib/rbac";

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const accessToken = request.cookies.get("access_token")?.value;
        if (!accessToken) return NextResponse.json({ error: "غير مصرح" }, { status: 401 });
        const payload = verifyToken<{ userId: string; role: string; firmId: string }>(accessToken);
        const { id } = await params;

        // Granular Permission Check
        const canView = await requireResourcePermission(payload.userId, payload.firmId, "client", id, "view");
        if (!canView) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

        const [client] = await db.select().from(clients).where(and(eq(clients.id, id), eq(clients.firmId, payload.firmId)));

        if (!client) {
            return NextResponse.json(
                { error: "Client not found" },
                { status: 404 }
            );
        }

        return NextResponse.json(client);
    } catch (error) {
        console.error("Error fetching client:", error);
        return NextResponse.json(
            { error: "Failed to fetch client" },
            { status: 500 }
        );
    }
}

export async function PUT(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const accessToken = request.cookies.get("access_token")?.value;
        if (!accessToken) return NextResponse.json({ error: "غير مصرح" }, { status: 401 });
        const payload = verifyToken<{ userId: string; role: string; firmId: string }>(accessToken);
        const { id } = await params;

        // Granular Permission Check
        const canEdit = await requireResourcePermission(payload.userId, payload.firmId, "client", id, "edit");
        if (!canEdit) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

        const { allowed, errorResponse } = await requireActiveSubscription();
        if (!allowed) return errorResponse;

        const body = await request.json();

        const [result] = await db
            .update(clients)
            .set({
                ...body,
                updatedAt: new Date(),
            })
            .where(and(eq(clients.id, id), eq(clients.firmId, payload.firmId)))
            .returning();

        if (!result) {
            return NextResponse.json(
                { error: "Client not found" },
                { status: 404 }
            );
        }

        return NextResponse.json(result);
    } catch (error) {
        console.error("Error updating client:", error);
        return NextResponse.json(
            { error: "Failed to update client" },
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
        const { id } = await params;

        // Granular Permission Check
        const canDelete = await requireResourcePermission(payload.userId, payload.firmId, "client", id, "delete");
        if (!canDelete) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

        const { allowed, errorResponse } = await requireActiveSubscription();
        if (!allowed) return errorResponse;

        const [result] = await db
            .delete(clients)
            .where(and(eq(clients.id, id), eq(clients.firmId, payload.firmId)))
            .returning();

        if (!result) {
            return NextResponse.json(
                { error: "Client not found" },
                { status: 404 }
            );
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Error deleting client:", error);
        return NextResponse.json(
            { error: "Failed to delete client" },
            { status: 500 }
        );
    }
}


