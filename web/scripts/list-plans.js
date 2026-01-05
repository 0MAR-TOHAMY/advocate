const postgres = require('postgres');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env.local') });

async function main() {
    const connectionString = process.env.DATABASE_URL;
    const sql = postgres(connectionString);
    try {
        const plans = await sql`SELECT id, name, plan_type FROM subscription_plans`;
        console.log(plans);
    } catch (err) {
        console.error(err);
    } finally {
        await sql.end();
    }
}
main();
