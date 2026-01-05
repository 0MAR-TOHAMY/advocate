# Legal Case Manager - Advocate Module

Modern legal case management system built with Next.js, PostgreSQL, and Drizzle ORM.

## 🏗️ Architecture

```
advocate/
├── database/              # Database layer
│   ├── config/           # Database configuration
│   ├── docker/           # Docker Compose for PostgreSQL
│   ├── drizzle/          # Drizzle ORM config & migrations
│   └── schema/           # Database schema definitions
│
└── web/                  # Next.js web application
    ├── app/              # Next.js App Router
    ├── components/       # React components
    ├── lib/              # Utilities and database client
    │   ├── db/          # Database connection
    │   └── schema/      # Schema re-exports
    └── public/           # Static assets
```

## 🚀 Quick Start

### Prerequisites

- **Node.js** 18+ and npm 9+
- **Docker** and Docker Compose
- **Git**

### Automated Setup (Recommended)

**Windows:**
```bash
setup-database.bat
```

**Linux/Mac:**
```bash
chmod +x setup-database.sh
./setup-database.sh
```

### Manual Setup

1. **Install database dependencies:**
   ```bash
   cd database
   npm install
   ```

2. **Start PostgreSQL:**
   ```bash
   npm run db:start
   ```

3. **Apply database schema:**
   ```bash
   npm run db:push
   ```

4. **Seed database (optional):**
   ```bash
   npm run db:seed
   ```

5. **Install web dependencies:**
   ```bash
   cd ../web
   npm install
   ```

6. **Start development server:**
   ```bash
   npm run dev
   ```

7. **Test database connection:**
   Open http://localhost:3000/api/health

## 📦 Packages

### Database Package

PostgreSQL 18 database layer with Drizzle ORM.

**Key Scripts:**
- `npm run db:start` - Start PostgreSQL container
- `npm run db:stop` - Stop PostgreSQL container
- `npm run db:push` - Push schema to database
- `npm run db:studio` - Open Drizzle Studio
- `npm run db:seed` - Seed database
- `npm run db:psql` - Open PostgreSQL CLI

**Database Access:**
- PostgreSQL: `localhost:5432`
- PgAdmin: `localhost:5050`
  - Email: admin@legal.com
  - Password: admin123

### Web Package

Next.js 16 web application with React 19.

**Key Scripts:**
- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint

**Development Server:**
- URL: http://localhost:3000
- Health Check: http://localhost:3000/api/health

## 🗄️ Database Schema

The database includes comprehensive tables for:

- **Authentication & Users**
  - users, firms
  
- **Client Management**
  - clients, client-documents, general-work
  
- **Case Management**
  - cases, case-history, case-updates, case-expenses
  
- **Court Proceedings**
  - hearings, judgments, hearing-attachments
  
- **Documents & Notes**
  - documents, notes, draft-documents
  
- **Scheduling**
  - events, reminders, calendars
  
- **Subscriptions**
  - subscription-plans, user-subscriptions, payment-history

See [DATABASE_SETUP.md](./DATABASE_SETUP.md) for detailed schema information.

## 💻 Development

### Using the Database

**In API Routes:**
```typescript
import { db, users } from "@/lib/db";

export async function GET() {
  const allUsers = await db.select().from(users);
  return Response.json({ users: allUsers });
}
```

**In Server Components:**
```typescript
import { db, cases } from "@/lib/db";
import { eq } from "drizzle-orm";

export default async function CasePage({ params }) {
  const [caseData] = await db
    .select()
    .from(cases)
    .where(eq(cases.id, params.id));
  
  return <div>{/* Render case */}</div>;
}
```

**In Server Actions:**
```typescript
"use server";
import { db, clients } from "@/lib/db";

export async function createClient(data) {
  const [newClient] = await db
    .insert(clients)
    .values(data)
    .returning();
  
  return newClient;
}
```

### Database Utilities

```typescript
import { testConnection, getDatabaseVersion } from "@/lib/db";

// Test connection
const isConnected = await testConnection();

// Get PostgreSQL version
const version = await getDatabaseVersion();
```

## 🔧 Configuration

### Environment Variables

**Web Application (.env.local):**
```env
DATABASE_URL="postgresql://root:strongpassword@localhost:5432/legal_case_manager"
NODE_ENV=development
```

**Database Package (config/.env):**
```env
POSTGRES_USER=root
POSTGRES_PASSWORD=strongpassword
POSTGRES_DB=legal_case_manager
POSTGRES_HOST=localhost
POSTGRES_PORT=5432
DATABASE_URL="postgresql://root:strongpassword@localhost:5432/legal_case_manager"
```

## 🐛 Troubleshooting

### Database won't start
```bash
cd database
npm run db:stop
docker volume rm legal-case-manager_postgres_data
npm run db:start
```

### Connection errors
1. Check Docker is running: `docker ps`
2. Check database logs: `npm run db:logs`
3. Verify DATABASE_URL in `.env.local`

### Schema changes not applying
```bash
cd database
npm run db:push
```

### Port conflicts
If port 5432 or 5050 is in use:
1. Edit `database/config/.env`
2. Change `POSTGRES_PORT` or `PGADMIN_PORT`
3. Restart: `npm run db:restart`

## 📚 Documentation

- [Database Setup Guide](./DATABASE_SETUP.md) - Comprehensive database setup
- [Drizzle ORM Docs](https://orm.drizzle.team/)
- [Next.js Docs](https://nextjs.org/docs)
- [PostgreSQL Docs](https://www.postgresql.org/docs/)

## 🛠️ Tech Stack

- **Frontend:** Next.js 16, React 19, TailwindCSS 4
- **Backend:** Next.js API Routes, Server Actions
- **Database:** PostgreSQL 18, Drizzle ORM
- **DevOps:** Docker, Docker Compose
- **Tools:** PgAdmin, Drizzle Studio

## 📝 Project Status

- ✅ Database schema defined
- ✅ Database connection configured
- ✅ Docker setup complete
- ✅ Health check endpoint
- 🔄 Authentication (in progress)
- 🔄 API routes (in progress)
- 🔄 UI components (in progress)

## 🤝 Contributing

1. Ensure database is running
2. Create feature branch
3. Make changes
4. Test thoroughly
5. Submit pull request

## 📄 License

Private - All rights reserved

## 🆘 Support

For issues or questions:
1. Check [DATABASE_SETUP.md](./DATABASE_SETUP.md)
2. Review error logs: `npm run db:logs`
3. Test connection: http://localhost:3000/api/health
