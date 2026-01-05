import { db } from "@/lib/db";
import { firmNotifications } from "@/lib/schema";
import { nanoid } from "nanoid";

export interface CreateNotificationData {
    firmId: string;
    type: "billing" | "member" | "security" | "system";
    title: string;
    message?: string;
    severity?: "info" | "warning" | "error";
    linkUrl?: string;
}

/**
 * Creates an in-app notification for a firm.
 */
export async function createFirmNotification(data: CreateNotificationData) {
    try {
        await db.insert(firmNotifications).values({
            id: nanoid(),
            firmId: data.firmId,
            type: data.type,
            title: data.title,
            message: data.message || null,
            severity: data.severity || "info",
            linkUrl: data.linkUrl || null,
            isRead: false,
            createdAt: new Date(),
        });
    } catch (error) {
        console.error("Failed to create firm notification:", error);
    }
}
