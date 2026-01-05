import { pgTable, text, boolean, timestamp } from "drizzle-orm/pg-core";

export const firmNotifications = pgTable("firm_notifications", {
    id: text("id").primaryKey(),
    firmId: text("firm_id").notNull(),
    type: text("type").notNull(), // billing, member, security, system
    title: text("title").notNull(),
    message: text("message"),
    severity: text("severity").default("info"), // info, warning, error
    linkUrl: text("link_url"),
    isRead: boolean("is_read").default(false),
    createdAt: timestamp("created_at").defaultNow(),
});
