import { db } from "@/lib/db";
import { cases, clients, reminders, events } from "@/lib/schema";
import { and, eq, ilike, or, count, desc, gte, lte } from "drizzle-orm";
import { z } from "zod";

// --- Tool Schemas (for OpenAI) ---

export const getFirmStatsSchema = z.object({});

export const searchSchema = z.object({
    query: z.string().describe("The search term (name, number, etc.)"),
    type: z.enum(["cases", "clients", "all"]).default("all").describe("Type of resource to search for"),
});

export const getRemindersSchema = z.object({
    days: z.number().default(7).describe("Number of days to look ahead"),
});

export const navigateSchema = z.object({
    page: z.enum(["dashboard", "cases", "clients", "calendar", "documents", "settings", "billing"]).describe("The page to navigate to"),
});

// --- Implementation Logic ---

export async function getFirmStats(firmId: string) {
    try {
        const [casesCount] = await db.select({ count: count() }).from(cases).where(eq(cases.firmId, firmId));
        const [clientsCount] = await db.select({ count: count() }).from(clients).where(eq(clients.firmId, firmId));
        const [activeReminders] = await db.select({ count: count() }).from(reminders).where(and(eq(reminders.firmId, firmId), eq(reminders.status, "active")));

        return {
            totalCases: casesCount.count,
            totalClients: clientsCount.count,
            activeReminders: activeReminders.count,
        };
    } catch (error) {
        console.error("Error getting stats:", error);
        return { error: "Failed to fetch stats" };
    }
}

export async function searchResources(firmId: string, query: string, type: "cases" | "clients" | "all") {
    try {
        const results: any = {};
        const term = `%${query}%`;

        if (type === "cases" || type === "all") {
            const casesResults = await db.select({
                id: cases.id,
                title: cases.title,
                caseNumber: cases.caseNumber,
                status: cases.status,
            })
                .from(cases)
                .where(and(
                    eq(cases.firmId, firmId),
                    or(
                        ilike(cases.caseNumber, term),
                        ilike(cases.title, term)
                    )
                ))
                .limit(5);
            results.cases = casesResults;
        }

        if (type === "clients" || type === "all") {
            const clientsResults = await db.select({
                id: clients.id,
                name: clients.name,
                email: clients.email,
                phone: clients.phone,
            })
                .from(clients)
                .where(and(
                    eq(clients.firmId, firmId),
                    or(
                        ilike(clients.name, term),
                        ilike(clients.email, term),
                        ilike(clients.clientNumber, term)
                    )
                ))
                .limit(5);
            results.clients = clientsResults;
        }

        return results;
    } catch (error) {
        console.error("Search error:", error);
        return { error: "Search failed" };
    }
}

export async function getUpcomingReminders(firmId: string, days: number = 7) {
    try {
        const now = new Date();
        const future = new Date();
        future.setDate(now.getDate() + days);

        const remindersData = await db.select()
            .from(reminders)
            .where(and(
                eq(reminders.firmId, firmId),
                eq(reminders.status, "active"),
                gte(reminders.dueDate, now),
                lte(reminders.dueDate, future)
            ))
            .orderBy(reminders.dueDate)
            .limit(10);

        return remindersData;
    } catch (error) {
        console.error("Reminders error:", error);
        return { error: "Failed to fetch reminders" };
    }
}
