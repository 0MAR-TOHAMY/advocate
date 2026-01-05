import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { events } from "@/lib/schema";
import { and, eq } from "drizzle-orm";
import { verifyToken } from "@/lib/auth/jwt";

export async function GET(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  try {
    const accessToken = req.cookies.get("access_token")?.value;
    if (!accessToken) return NextResponse.json({ error: "غير مصرح" }, { status: 401 });
    const payload = verifyToken<{ userId: string; role: string; firmId: string }>(accessToken);
    const { id } = await ctx.params;
    const [row] = await db.select().from(events).where(and(eq(events.id, id), eq(events.firmId, payload.firmId))).limit(1);
    if (!row) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json(row);
  } catch (error) {
    console.error("Error fetching event:", error);
    return NextResponse.json({ error: "Failed to fetch event" }, { status: 500 });
  }
}

export async function PUT(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  try {
    const accessToken = req.cookies.get("access_token")?.value;
    if (!accessToken) return NextResponse.json({ error: "غير مصرح" }, { status: 401 });
    const payload = verifyToken<{ userId: string; role: string; firmId: string }>(accessToken);
    const { id } = await ctx.params;
    const body = await req.json();
    const updateData: Partial<typeof events.$inferInsert> = { ...body };
    if (updateData.startTime) updateData.startTime = new Date(updateData.startTime);
    if (updateData.endTime) updateData.endTime = new Date(updateData.endTime);
    const [row] = await db.update(events).set(updateData).where(and(eq(events.id, id), eq(events.firmId, payload.firmId))).returning();
    if (!row) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json(row);
  } catch (error) {
    console.error("Error updating event:", error);
    return NextResponse.json({ error: "Failed to update event" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  try {
    const accessToken = req.cookies.get("access_token")?.value;
    if (!accessToken) return NextResponse.json({ error: "غير مصرح" }, { status: 401 });
    const payload = verifyToken<{ userId: string; role: string; firmId: string }>(accessToken);
    const { id } = await ctx.params;
    const [row] = await db.delete(events).where(and(eq(events.id, id), eq(events.firmId, payload.firmId))).returning();
    if (!row) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting event:", error);
    return NextResponse.json({ error: "Failed to delete event" }, { status: 500 });
  }
}
