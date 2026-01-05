const postgres = require('postgres');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env.local') });

async function main() {
    const connectionString = process.env.DATABASE_URL;
    const sql = postgres(connectionString);
    try {
        const triggers = await sql`
      SELECT trigger_name, event_manipulation, event_object_table, action_statement
      FROM information_schema.triggers
      WHERE event_object_table = 'firms'
    `;
        console.log('Triggers:', triggers);
    } catch (err) {
        console.error(err);
    } finally {
        await sql.end();
    }
}
main();
