import { test } from 'vitest';
import * as dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

// Load env vars before other imports
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, "../.env.local") });

import { db } from "../lib/db";
import { users } from "../lib/schema";
import { eq } from "drizzle-orm";

test('verify user', async () => {
    const email = "test_17183@example.com";
    console.log(`Verifying user: ${email}`);

    const [user] = await db.select().from(users).where(eq(users.email, email));

    if (!user) {
        console.error("User not found!");
        throw new Error("User not found");
    }

    await db.update(users).set({ isVerified: true }).where(eq(users.id, user.id));
    console.log("User verified successfully!");
});
