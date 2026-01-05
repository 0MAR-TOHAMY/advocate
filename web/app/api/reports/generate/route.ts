import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { cases, clients, generalWork, hearings, caseExpenses, firms, events } from "@/lib/schema";
import { eq, inArray, and, desc, asc } from "drizzle-orm";
import { verifyToken } from "@/lib/auth/jwt";
import ReactPDF from "@react-pdf/renderer";
import { ClientReportDocument } from "@/components/reports/ClientReportDocument";
import { createElement } from "react";

export async function POST(req: NextRequest) {
    try {
        const accessToken = req.cookies.get("access_token")?.value;
        if (!accessToken) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        const payload = verifyToken<{ userId: string; role: string; firmId: string }>(accessToken);

        const body = await req.json();
        const { clientId, type, content, locale } = body; // content: { cases: string[], works: string[] }

        if (!clientId) return NextResponse.json({ error: "Client ID is required" }, { status: 400 });

        // 1. Fetch Firm Settings (for branding)
        const [firm] = await db.select().from(firms).where(eq(firms.id, payload.firmId)).limit(1);

        // 2. Fetch Client Data
        const [client] = await db.select().from(clients).where(and(eq(clients.id, clientId), eq(clients.firmId, payload.firmId))).limit(1);
        if (!client) return NextResponse.json({ error: "Client not found" }, { status: 404 });

        // 3. Fetch Cases Data (if selected)
        let casesData: any[] = [];
        if (content.cases && content.cases.length > 0) {
            const selectedCases = await db.query.cases.findMany({
                where: and(inArray(cases.id, content.cases), eq(cases.firmId, payload.firmId)),
                with: {
                    hearings: { orderBy: [asc(hearings.hearingDate)] },
                    events: { orderBy: [asc(events.startTime)] },
                    expenses: true,
                }
            });
            casesData = selectedCases;
        }

        // 4. Fetch General Work Data (if selected)
        let worksData: any[] = [];
        if (content.works && content.works.length > 0) {
            const selectedWorks = await db.query.generalWork.findMany({
                where: and(inArray(generalWork.id, content.works), eq(generalWork.firmId, payload.firmId))
            });
            worksData = selectedWorks;
        }

        // 5. Generate PDF
        // We pass all data to a React component that renders the PDF structure
        const stream = await ReactPDF.renderToStream(
            createElement(ClientReportDocument, {
                firm,
                client,
                cases: casesData,
                works: worksData,
                type, // 'full' | 'summary'
                locale: locale || 'ar' // Default to ar if not provided
            }) as any
        );

        return new NextResponse(stream as any, {
            headers: {
                "Content-Type": "application/pdf",
                "Content-Disposition": `attachment; filename="Report_${client.name}_${new Date().toISOString().split('T')[0]}.pdf"`
            }
        });

    } catch (error) {
        console.error("Error generating report:", error);
        return NextResponse.json({ error: "Failed to generate report" }, { status: 500 });
    }
}
