import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { events } from "@/lib/schema";
import { isNull, isNotNull } from "drizzle-orm";

function toICSDate(d: Date) {
  const pad = (n: number) => (n < 10 ? `0${n}` : `${n}`);
  return `${d.getUTCFullYear()}${pad(d.getUTCMonth() + 1)}${pad(d.getUTCDate())}T${pad(d.getUTCHours())}${pad(d.getUTCMinutes())}${pad(d.getUTCSeconds())}Z`;
}

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const scope = url.searchParams.get("scope"); // "public" | "private" | null

    let rows;
    if (scope === "public") {
      rows = await db.select().from(events).where(isNotNull(events.caseId));
    } else if (scope === "private") {
      rows = await db.select().from(events).where(isNull(events.caseId));
    } else {
      rows = await db.select().from(events);
    }

    const icsLines: string[] = [
      "BEGIN:VCALENDAR",
      "VERSION:2.0",
      "PRODID:-//Legal Case Manager//Calendar//EN",
    ];

    for (const ev of rows) {
      const start = new Date(ev.startTime as unknown as string);
      const end = ev.endTime ? new Date(ev.endTime as unknown as string) : new Date(start.getTime() + 60 * 60 * 1000);
      icsLines.push("BEGIN:VEVENT");
      icsLines.push(`UID:${ev.id}@legalcasemanager`);
      icsLines.push(`DTSTAMP:${toICSDate(new Date())}`);
      icsLines.push(`DTSTART:${toICSDate(start)}`);
      icsLines.push(`DTEND:${toICSDate(end)}`);
      icsLines.push(`SUMMARY:${(ev.title || "Event").replace(/\n/g, " ")}`);
      if (ev.location) icsLines.push(`LOCATION:${ev.location.replace(/\n/g, " ")}`);
      if (ev.description) icsLines.push(`DESCRIPTION:${ev.description.replace(/\n/g, " ")}`);
      icsLines.push("END:VEVENT");
    }

    icsLines.push("END:VCALENDAR");

    return new NextResponse(icsLines.join("\r\n"), {
      status: 200,
      headers: {
        "Content-Type": "text/calendar; charset=utf-8",
        "Content-Disposition": "attachment; filename=calendar.ics",
      },
    });
  } catch (e) {
    return NextResponse.json({ error: "Failed to generate ICS" }, { status: 500 });
  }
}

