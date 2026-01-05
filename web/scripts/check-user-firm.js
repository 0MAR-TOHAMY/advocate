const postgres = require('postgres');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env.local') });

async function main() {
    const connectionString = process.env.DATABASE_URL;
    const sql = postgres(connectionString);
    try {
        const email = "test_17183@example.com";
        const users = await sql`SELECT id, email, firm_id, role FROM users WHERE email = ${email}`;
        console.log(users);
    } catch (err) {
        console.error(err);
    } finally {
        await sql.end();
    }
}
main();
