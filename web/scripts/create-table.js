const postgres = require('postgres');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env.local') });

async function main() {
    const connectionString = process.env.DATABASE_URL;
    const sql = postgres(connectionString);

    try {
        console.log("Creating firm_subscriptions table...");
        await sql`
      CREATE TABLE IF NOT EXISTS "firm_subscriptions" (
        "id" varchar(64) PRIMARY KEY,
        "firm_id" varchar(64) NOT NULL UNIQUE,
        "plan_id" varchar(64) NOT NULL,
        "status" "subscription_status" DEFAULT 'trial' NOT NULL,
        "current_period_start" timestamp with time zone,
        "current_period_end" timestamp with time zone,
        "trial_ends_at" timestamp with time zone,
        "canceled_at" timestamp with time zone,
        "stripe_subscription_id" varchar(255),
        "created_at" timestamp with time zone DEFAULT now(),
        "updated_at" timestamp with time zone DEFAULT now()
      );
    `;
        console.log("Table created successfully.");

        console.log("Creating indexes...");
        await sql`CREATE INDEX IF NOT EXISTS "firm_subscriptions_firm_idx" ON "firm_subscriptions" ("firm_id")`;
        await sql`CREATE INDEX IF NOT EXISTS "firm_subscriptions_status_idx" ON "firm_subscriptions" ("status")`;
        console.log("Indexes created.");

    } catch (err) {
        console.error("Error creating table:", err);
    } finally {
        await sql.end();
    }
}
main();
