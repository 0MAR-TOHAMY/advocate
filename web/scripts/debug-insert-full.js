const postgres = require('postgres');
const path = require('path');
const crypto = require('crypto');
require('dotenv').config({ path: path.resolve(__dirname, '../.env.local') });

async function main() {
    const connectionString = process.env.DATABASE_URL;
    const sql = postgres(connectionString);
    const id = crypto.randomUUID();
    const planId = "QkHT2c-KNbO1zRhan9Cld";

    try {
        console.log(`Attempting full insert into firms with id ${id}`);
        await sql`
      INSERT INTO firms (
        id, name, timezone, reminder_advance_notice_days,
        current_users, subscription_status, is_active, plan_id,
        created_at, updated_at
      ) VALUES (
        ${id}, 'Debug Firm Full', 'Asia/Dubai', 7,
        1, 'active', true, ${planId},
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
