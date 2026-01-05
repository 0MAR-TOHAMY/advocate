const postgres = require('postgres');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env.local') });

async function main() {
    const connectionString = process.env.DATABASE_URL;
    const sql = postgres(connectionString);
    try {
        const firms = await sql`SELECT * FROM firms LIMIT 1`;
        console.log('Firms:', firms);
    } catch (err) {
        console.error(err);
    } finally {
        await sql.end();
    }
}
main();
