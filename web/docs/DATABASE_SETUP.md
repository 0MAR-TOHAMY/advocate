# Database Setup Guide

Complete guide for setting up the PostgreSQL database and connecting it to the web application.

## Architecture

```
advocate/
├── database/          # Database package (schema, migrations, seeds)
│   ├── config/       # Database configuration and .env
│   ├── docker/       # Docker Compose for PostgreSQL
│   ├── drizzle/      # Drizzle config and migrations
│   └── schema/       # Database schema definitions
└── web/              # Next.js web application
    └── lib/
        ├── db/       # Database client
        └── schema/   # Schema re-exports
```

## Prerequisites

- Node.js 18+ and npm 9+
- Docker and Docker Compose
- Git

## Step-by-Step Setup

### 1. Database Package Setup

Navigate to the database package:

```bash
cd advocate/database
```

Install dependencies:

```bash
npm install
```

Configure environment variables (already set up in `config/.env`):

```env
POSTGRES_USER=root
POSTGRES_PASSWORD=strongpassword
POSTGRES_DB=legal_case_manager
POSTGRES_HOST=localhost
POSTGRES_PORT=5432
DATABASE_URL="postgresql://root:strongpassword@localhost:5432/legal_case_manager"
```

### 2. Start PostgreSQL Database

Start the PostgreSQL container:

```bash
npm run db:start
```

This will start:
- **PostgreSQL 18** on `localhost:5432`
- **PgAdmin** on `localhost:5050`

Verify the database is running:

```bash
npm run db:logs
```

### 3. Apply Database Schema

Push the schema to the database:

```bash
npm run db:push
```

Or generate and run migrations:

```bash
npm run db:generate
npm run db:migrate
```

### 4. Seed Initial Data (Optional)

Populate the database with sample data:

```bash
npm run db:seed
```

### 5. Web Application Setup

Navigate to the web package:

```bash
cd ../web
```

Install dependencies:

```bash
npm install
```

Configure environment variables (`.env.local` already created):

```env
DATABASE_URL="postgresql://root:strongpassword@localhost:5432/legal_case_manager"
NODE_ENV=development
```

### 6. Test Database Connection

Start the development server:

```bash
npm run dev
```

Test the database connection by visiting:

```
http://localhost:3000/api/health
```

You should see:

```json
{
  "status": "healthy",
  "database": "connected",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "result": { "health": 1 }
}
```

## Database Management Commands

### Database Package (advocate/database)

| Command | Description |
|---------|-------------|
| `npm run db:start` | Start PostgreSQL container |
| `npm run db:stop` | Stop PostgreSQL container |
| `npm run db:restart` | Restart PostgreSQL container |
| `npm run db:logs` | View PostgreSQL logs |
| `npm run db:generate` | Generate migrations from schema |
| `npm run db:migrate` | Run migrations |
| `npm run db:push` | Push schema directly (dev only) |
| `npm run db:studio` | Open Drizzle Studio |
| `npm run db:seed` | Seed database with initial data |
| `npm run db:reset` | Reset database (⚠️ destroys data) |
| `npm run db:psql` | Open PostgreSQL CLI |

## Using the Database in Code

### In API Routes

```typescript
import { db } from "@/lib/db";
import { users, cases } from "@/lib/db";

export async function GET() {
  // Query users
  const allUsers = await db.select().from(users);
  
  return Response.json({ users: allUsers });
}
```

### In Server Components

```typescript
import { db } from "@/lib/db";
import { cases } from "@/lib/db";
import { eq } from "drizzle-orm";

export default async function CasePage({ params }: { params: { id: string } }) {
  // Query a specific case
  const caseData = await db
    .select()
    .from(cases)
    .where(eq(cases.id, params.id))
    .limit(1);
  
  return <div>{/* Render case data */}</div>;
}
```

### In Server Actions

```typescript
"use server";

import { db } from "@/lib/db";
import { clients } from "@/lib/db";

export async function createClient(data: any) {
  const [newClient] = await db
    .insert(clients)
    .values(data)
    .returning();
  
  return newClient;
}
```

## Database Schema

The database includes the following main tables:

- **users** - User accounts and authentication
- **firms** - Law firms
- **clients** - Client information
- **cases** - Legal cases
- **hearings** - Court hearings
- **judgments** - Court judgments
- **documents** - Case documents
- **notes** - Case notes
- **reminders** - Task reminders
- **subscriptions** - Subscription plans and user subscriptions
- **payments** - Payment history

See `database/schema/` for complete schema definitions.

## PgAdmin Access

Access PgAdmin at `http://localhost:5050`:

- **Email**: admin@legal.com
- **Password**: admin123

To connect to the database in PgAdmin:
1. Right-click "Servers" → "Register" → "Server"
2. **General Tab**: Name = "Legal Case Manager"
3. **Connection Tab**:
   - Host: `postgres` (or `host.docker.internal` on Windows/Mac)
   - Port: `5432`
   - Database: `legal_case_manager`
   - Username: `root`
   - Password: `strongpassword`

## Troubleshooting

### Database won't start

```bash
# Check if port 5432 is already in use
netstat -an | grep 5432

# Stop any existing PostgreSQL instances
npm run db:stop

# Remove old volumes and restart
docker volume rm legal-case-manager_postgres_data
npm run db:start
```

### Connection refused errors

1. Ensure the database container is running:
   ```bash
   docker ps | grep legal_postgres
   ```

2. Check database logs:
   ```bash
   npm run db:logs
   ```

3. Verify DATABASE_URL in `.env.local`

### Schema changes not applying

```bash
cd advocate/database
npm run db:push
```

### Module not found errors

```bash
cd advocate/web
npm install
```

## Production Considerations

For production deployment:

1. Use a managed PostgreSQL service (AWS RDS, Supabase, etc.)
2. Enable SSL connections:
   ```env
   DATABASE_SSL=true
   DATABASE_SSL_REJECT_UNAUTHORIZED=true
   ```
3. Use connection pooling (PgBouncer)
4. Set appropriate connection limits
5. Enable database backups
6. Use migrations instead of `db:push`

## Next Steps

1. ✅ Database is running
2. ✅ Schema is applied
3. ✅ Web app can connect
4. 🔄 Start building API routes
5. 🔄 Implement authentication
6. 🔄 Build UI components

## Support

For issues or questions, refer to:
- [Drizzle ORM Documentation](https://orm.drizzle.team/)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
- [Next.js Documentation](https://nextjs.org/docs)
