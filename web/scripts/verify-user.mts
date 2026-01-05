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

async function main() {
    const email = "test_17183@example.com";
    console.log(`Verifying user: ${email}`);

    const [user] = await db.select().from(users).where(eq(users.email, email));

    if (!user) {
        console.error("User not found!");
        process.exit(1);
    }

    await db.update(users).set({ isVerified: true }).where(eq(users.id, user.id));
    console.log("User verified successfully!");
    process.exit(0);
}

main().catch((err) => {
    console.error(err);
    process.exit(1);
});
