const postgres = require('postgres');
const path = require('path');
const crypto = require('crypto');
require('dotenv').config({ path: path.resolve(__dirname, '../.env.local') });

async function main() {
    const connectionString = process.env.DATABASE_URL;
    const sql = postgres(connectionString);
    const id = crypto.randomUUID();

    try {
        console.log(`Attempting insert into firms with id ${id}`);
        await sql`
      INSERT INTO firms (id, name)
      VALUES (${id}, 'Debug Firm')
    `;
        console.log('Insert successful!');
    } catch (err) {
        console.error('Insert failed:', err);
    } finally {
        await sql.end();
    }
}
main();
