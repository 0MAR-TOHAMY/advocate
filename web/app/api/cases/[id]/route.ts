import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { cases } from "@/lib/schema";
import { and, eq } from "drizzle-orm";
import { getAccessToken } from "@/lib/auth/cookies";
import { verifyToken, AccessTokenPayload } from "@/lib/auth/jwt";
import { hashPassword, comparePassword } from "@/lib/auth/password";
import { requireActiveSubscription } from "@/lib/subscription/guard";
import { requireResourcePermission } from "@/lib/rbac";

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const accessToken = request.cookies.get("access_token")?.value || (await getAccessToken());
        if (!accessToken) return NextResponse.json({ error: "غير مصرح" }, { status: 401 });
        const payload = verifyToken<AccessTokenPayload>(accessToken);
        const { id } = await params;

        // Granular Permission Check
        const canView = await requireResourcePermission(payload.userId, payload.firmId, "case", id, "view");
        if (!canView) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

        const [caseData] = await (db.select().from(cases as any).where(and(eq((cases as any).id, id), eq((cases as any).firmId, payload.firmId))) as any);

        if (!caseData) {
            return NextResponse.json(
                { error: "Case not found" },
                { status: 404 }
            );
        }

        type CaseRow = typeof cases.$inferSelect;
        const { password: pw, ...rest } = caseData as CaseRow;
        return NextResponse.json({ ...rest, hasPassword: !!pw });
    } catch (error) {
        console.error("Error fetching case:", error);
        return NextResponse.json(
            { error: "Failed to fetch case" },
            { status: 500 }
        );
    }
}

export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const accessToken = request.cookies.get("access_token")?.value || (await getAccessToken());
        if (!accessToken) return NextResponse.json({ error: "غير مصرح" }, { status: 401 });
        const payload = verifyToken<AccessTokenPayload>(accessToken);
        const { id } = await params;

        // Granular Permission Check (Viewing is required to attempt password)
        const canView = await requireResourcePermission(payload.userId, payload.firmId, "case", id, "view");
        if (!canView) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

        const body = await request.json();
        const password = body?.password as string | undefined;
        if (!password) {
            return NextResponse.json({ error: "Password required" }, { status: 400 });
        }
        const [caseData] = await (db.select().from(cases as any).where(and(eq((cases as any).id, id), eq((cases as any).firmId, payload.firmId))) as any);
        if (!caseData) {
            return NextResponse.json({ error: "Case not found" }, { status: 404 });
        }
        const ok = !!caseData.password && (await comparePassword(password, caseData.password));
        if (!ok) {
            return NextResponse.json({ error: "Invalid password" }, { status: 403 });
        }
        return NextResponse.json({ ok: true }, { status: 200 });
    } catch (error) {
        console.error("Error verifying case password:", error);
        return NextResponse.json({ error: "Failed to verify password" }, { status: 500 });
    }
}

export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const accessToken = request.cookies.get("access_token")?.value || (await getAccessToken());
        if (!accessToken) return NextResponse.json({ error: "غير مصرح" }, { status: 401 });
        const payload = verifyToken<AccessTokenPayload>(accessToken);
        const { id } = await params;

        // Granular Permission Check
        const canDelete = await requireResourcePermission(payload.userId, payload.firmId, "case", id, "delete");
        if (!canDelete) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

        const { allowed, errorResponse } = await requireActiveSubscription();
        if (!allowed) return errorResponse;

        const [deleted] = await (db.delete(cases as any).where(and(eq((cases as any).id, id), eq((cases as any).firmId, payload.firmId))).returning() as any);

        if (!deleted) {
            return NextResponse.json(
                { error: "Case not found" },
                { status: 404 }
            );
        }

        return NextResponse.json(deleted);
    } catch (error) {
        console.error("Error deleting case:", error);
        return NextResponse.json(
            { error: "Failed to delete case" },
            { status: 500 }
        );
    }
}

export async function PATCH(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const accessToken = request.cookies.get("access_token")?.value || (await getAccessToken());
        if (!accessToken) return NextResponse.json({ error: "غير مصرح" }, { status: 401 });
        const payload = verifyToken<AccessTokenPayload>(accessToken);
        const { id } = await params;

        // Granular Permission Check
        const canEdit = await requireResourcePermission(payload.userId, payload.firmId, "case", id, "edit");
        if (!canEdit) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

        const { allowed, errorResponse } = await requireActiveSubscription();
        if (!allowed) return errorResponse;

        const body = await request.json();

        // Extract fields to update
        const { filingDate, ...rest } = body;
        const updateData: Partial<typeof cases.$inferInsert> = { ...rest } as Partial<typeof cases.$inferInsert>;

        if (filingDate) {
            updateData.filingDate = new Date(filingDate);
        }

        // Don't allow updating id, firmId
        delete updateData.id;
        delete updateData.firmId;

        // Prevent accidental password clearing via generic PATCH
        if (Object.prototype.hasOwnProperty.call(updateData, "password")) {
            const pw = updateData.password as unknown as string | undefined;
            if (!pw || typeof pw !== "string" || pw.trim() === "") {
                delete (updateData as any).password;
            } else {
                updateData.password = await hashPassword(pw);
            }
        }

        const [updated] = await (db.update(cases as any)
            .set(updateData)
            .where(and(eq((cases as any).id, id), eq((cases as any).firmId, payload.firmId)))
            .returning() as any);

        if (!updated) {
            return NextResponse.json(
                { error: "Case not found" },
                { status: 404 }
            );
        }

        // --- Phase 5: Stage Synchronization Logic ---
        if (updateData.caseStage && updated.relatedCaseGroupId) {
            try {
                await (db.update(cases as any)
                    .set({
                        caseStage: updated.caseStage,
                        customCaseStage: updated.customCaseStage
                    })
                    .where(
                        and(
                            eq((cases as any).relatedCaseGroupId, updated.relatedCaseGroupId),
                            eq((cases as any).firmId, payload.firmId)
                        )
                    ) as any);
            } catch (syncError) {
                console.error("Error synchronizing case stages:", syncError);
            }
        }

        return NextResponse.json(updated);
    } catch (error) {
        console.error("Error updating case:", error);
        return NextResponse.json(
            { error: "Failed to update case" },
            { status: 500 }
        );
    }
}
