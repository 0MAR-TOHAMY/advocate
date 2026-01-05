import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as dotenv from "dotenv";
import { resolve } from "path";
import { subscriptionPlans } from "../database/schema/index.js";

dotenv.config({ path: ".env.local" });

const DATABASE_URL = process.env.DATABASE_URL;

async function listPlans() {
    const client = postgres(DATABASE_URL);
    const db = drizzle(client);
    try {
        const plans = await db.select().from(subscriptionPlans);
        console.log(JSON.stringify(plans, null, 2));
    } catch (error) {
        console.error("FAILED:", error.message);
    } finally {
        await client.end();
    }
}

listPlans();
