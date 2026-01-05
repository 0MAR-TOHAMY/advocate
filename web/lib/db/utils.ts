import { sql } from "drizzle-orm";
import { db } from "./client";

export async function testConnection(): Promise<boolean> {
  try {
    await db.execute(sql`SELECT 1`);
    return true;
  } catch (error) {
    console.error("Database connection test failed:", error);
    return false;
  }
}

export async function getDatabaseVersion(): Promise<string> {
  try {
    const result = await db.execute(sql`SELECT version()`);
    return (result[0] as any)?.version || "Unknown";
  } catch (error) {
    console.error("Failed to get database version:", error);
    return "Error";
  }
}

export async function getDatabaseTime(): Promise<Date> {
  const result = await db.execute(sql`SELECT NOW() as now`);
  return new Date((result[0] as any)?.now);
}

export async function tableExists(tableName: string): Promise<boolean> {
  try {
    const result = await db.execute(
      sql`SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = ${tableName}
      )`
    );
    return (result[0] as any)?.exists || false;
  } catch (error) {
    console.error(`Failed to check if table ${tableName} exists:`, error);
    return false;
  }
}
