import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { events } from "@/lib/schema";
import { and, gte, lte, isNull, eq } from "drizzle-orm";
import { verifyToken } from "@/lib/auth/jwt";

export async function GET(request: NextRequest) {
  try {
    const accessToken = request.cookies.get("access_token")?.value;
    if (!accessToken) return NextResponse.json({ error: "غير مصرح" }, { status: 401 });
    const payload = verifyToken<{ userId: string; role: string; firmId: string }>(accessToken);
    const searchParams = request.nextUrl.searchParams;
    const start = searchParams.get("start");
    const end = searchParams.get("end");

    let whereExpr = and(isNull(events.caseId), eq(events.firmId, payload.firmId));
    if (start) whereExpr = and(whereExpr, gte(events.startTime, new Date(start)));
    if (end) whereExpr = and(whereExpr, lte(events.startTime, new Date(end)));

    const result = await db
      .select()
      .from(events)
      // Treat events without a case as personal; future: add createdBy user scoping
      .where(whereExpr);

    if (!result || result.length === 0) {
      const dayMs = 24 * 60 * 60 * 1000;
      const now = Date.now();
      const d1 = new Date(now + 1 * dayMs);
      const d2 = new Date(now + 3 * dayMs);
      const d3 = new Date(now + 5 * dayMs);
      const demo = [
        {
          id: "demo-private-1",
          firmId: "demo",
          caseId: null,
          title: "Personal Planning",
          description: "Weekly personal planning session",
          eventType: "meeting",
          location: "Office",
          meetingLink: null,
          startTime: d1,
          endTime: new Date(d1.getTime() + 60 * 60 * 1000),
          allDay: false,
          reminderMinutes: 30,
          reminderSent: false,
          status: "scheduled",
          attendees: "[]",
          createdBy: "demo-user",
          assignedTo: "demo-user",
        },
        {
          id: "demo-private-2",
          firmId: "demo",
          caseId: null,
          title: "Personal Deadline",
          description: "Submit timesheets",
          eventType: "deadline",
          location: "Portal",
          meetingLink: null,
          startTime: d2,
          endTime: null,
          allDay: true,
          reminderMinutes: 120,
          reminderSent: false,
          status: "scheduled",
          attendees: "[]",
          createdBy: "demo-user",
          assignedTo: "demo-user",
        },
        {
          id: "demo-private-3",
          firmId: "demo",
          caseId: null,
          title: "Workout & Wellness",
          description: "Personal wellness session",
          eventType: "other",
          location: "Gym",
          meetingLink: null,
          startTime: d3,
          endTime: new Date(d3.getTime() + 90 * 60 * 1000),
          allDay: false,
          reminderMinutes: 15,
          reminderSent: false,
          status: "scheduled",
          attendees: "[]",
          createdBy: "demo-user",
          assignedTo: "demo-user",
        },
      ];
      return NextResponse.json(demo);
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error("Error fetching private events:", error);
    return NextResponse.json({ error: "Failed to fetch private events" }, { status: 500 });
  }
}
