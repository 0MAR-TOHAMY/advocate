const postgres = require('postgres');
const path = require('path');
const crypto = require('crypto');
require('dotenv').config({ path: path.resolve(__dirname, '../.env.local') });

async function main() {
    const connectionString = process.env.DATABASE_URL;
    if (!connectionString) {
        console.error("DATABASE_URL not found");
        process.exit(1);
    }

    const sql = postgres(connectionString);

    try {
        const email = "test_17183@example.com";
        console.log(`Finding user: ${email}`);

        const users = await sql`SELECT * FROM users WHERE email = ${email}`;
        if (users.length === 0) {
            console.error("User not found!");
            process.exit(1);
        }
        const user = users[0];

        if (user.firm_id) {
            console.log("User already has a firm:", user.firm_id);
            process.exit(0);
        }

        const firmId = crypto.randomUUID();
        const subscriptionId = crypto.randomUUID();
        const planId = "QkHT2c-KNbO1zRhan9Cld"; // Professional

        console.log(`Creating firm ${firmId} for user ${user.id}`);

        // Create Firm
        await sql`
      INSERT INTO firms (
        id, name, timezone, reminder_advance_notice_days,
        current_users, subscription_status, is_active, plan_id,
        created_at, updated_at
      ) VALUES (
        ${firmId}, 'Test Firm', 'Asia/Dubai', 7,
        1, 'active', true, ${planId},
        NOW(), NOW()
      )
    `;

        // Create Subscription
        await sql`
      INSERT INTO firm_subscriptions (
        id, firm_id, plan_id, status,
        current_period_start, current_period_end,
        created_at, updated_at
      ) VALUES (
        ${subscriptionId}, ${firmId}, ${planId}, 'active',
        NOW(), NOW() + INTERVAL '30 days',
        NOW(), NOW()
      )
    `;

        // Update User
        await sql`
        UPDATE users
        SET firm_id = ${firmId}, role = 'admin'
        WHERE id = ${user.id}
    `;

        console.log("Firm created and user updated successfully!");

    } catch (err) {
        console.error(err);
        process.exit(1);
    } finally {
        await sql.end();
    }
}

main();
