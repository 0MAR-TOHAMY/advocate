const postgres = require('postgres');
const path = require('path');
const crypto = require('crypto');
require('dotenv').config({ path: path.resolve(__dirname, '../.env.local') });

async function main() {
    const connectionString = process.env.DATABASE_URL;
    const sql = postgres(connectionString);
    const firmId = crypto.randomUUID();
    const subId = crypto.randomUUID();
    const planId = "QkHT2c-KNbO1zRhan9Cld";

    try {
        console.log(`Creating firm ${firmId}`);
        await sql`
      INSERT INTO firms (id, name) VALUES (${firmId}, 'Debug Sub Firm')
    `;

        console.log(`Attempting insert into firm_subscriptions`);
        await sql`
      INSERT INTO "firm_subscriptions" (
        id, firm_id, plan_id, status,
        current_period_start, current_period_end,
        created_at, updated_at
      ) VALUES (
        ${subId}, ${firmId}, ${planId}, 'active',
        NOW(), NOW() + INTERVAL '30 days',
        NOW(), NOW()
      )
    `;
        console.log('Insert successful!');
    } catch (err) {
        console.error('Insert failed:', err);
    } finally {
        await sql.end();
    }
}
main();
