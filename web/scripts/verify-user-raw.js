const postgres = require('postgres');
const path = require('path');
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
        console.log(`Verifying user: ${email}`);

        const users = await sql`SELECT * FROM users WHERE email = ${email}`;
        if (users.length === 0) {
            console.error("User not found!");
            process.exit(1);
        }

        await sql`UPDATE users SET is_verified = true WHERE id = ${users[0].id}`;
        console.log("User verified successfully!");
    } catch (err) {
        console.error(err);
        process.exit(1);
    } finally {
        await sql.end();
    }
}

main();
