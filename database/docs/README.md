# Legal Case Manager - Database Layer

Production-ready PostgreSQL 18 database layer with Drizzle ORM, Docker containerization, and comprehensive schema management.

## 📋 Table of Contents

- [Overview](#overview)
- [Quick Start](#quick-start)
- [Architecture](#architecture)
- [Folder Structure](#folder-structure)
- [Setup Instructions](#setup-instructions)
- [Schema Management](#schema-management)
- [Migrations](#migrations)
- [Seeding Data](#seeding-data)
- [Database Access](#database-access)
- [Best Practices](#best-practices)
- [Troubleshooting](#troubleshooting)

## 🎯 Overview

This database layer provides:

- **PostgreSQL 18**: Latest stable PostgreSQL with advanced features
- **Drizzle ORM**: Type-safe, performant ORM for PostgreSQL
- **Docker Setup**: Containerized database with pgAdmin 4
- **Complete Schema**: 30+ tables covering all legal case management needs
- **Multi-tenancy**: Firm-based data isolation
- **Type Safety**: Full TypeScript support with inferred types

## 🚀 Quick Start

### Prerequisites

- Docker Desktop installed and running
- Node.js 18+ and npm/pnpm
- Git

### 1. Start the Database

```bash
# Navigate to docker directory
cd database/docker

# Start PostgreSQL and pgAdmin
docker-compose up -d

# Verify containers are running
docker ps
```

### 2. Configure Environment

```bash
# Copy example environment file
cp database/config/.env.example database/config/.env

# Edit .env with your configuration (optional for local dev)
```

### 3. Install Dependencies

```bash
# From project root
npm install drizzle-orm postgres dotenv nanoid
npm install -D drizzle-kit @types/node
```

### 4. Generate and Apply Migrations

```bash
# Generate migration from schema
npx drizzle-kit generate

# Apply migrations to database
npx drizzle-kit push
```

### 5. Seed Demo Data

```bash
# Run seed script
npx tsx database/drizzle/seed.ts
```

### 6. Access pgAdmin

Open browser to `http://localhost:5050`

- **Email**: `admin@legal.com`
- **Password**: `admin123`

Add server connection:
- **Host**: `postgres` (container name)
- **Port**: `5432`
- **Database**: `legal_case_manager`
- **Username**: `root`
- **Password**: `strongpassword`

## 🏗️ Architecture

### Database Stack

```
┌─────────────────────────────────────┐
│   Application Layer (TypeScript)    │
├─────────────────────────────────────┤
│   Drizzle ORM (Type-safe queries)   │
├─────────────────────────────────────┤
│   PostgreSQL 18 (ACID database)     │
├─────────────────────────────────────┤
│   Docker Container (Isolation)       │
└─────────────────────────────────────┘
```

### Multi-Tenancy Model

Each firm has isolated data through `firm_id` foreign keys:

```
Firm (tenant)
  ├── Users
  ├── Clients
  │   └── Client Documents
  ├── Cases
  │   ├── Documents
  │   ├── Notes
  │   ├── Events
  │   ├── Updates
  │   ├── Hearings
  │   └── Expenses
  └── General Work
      └── Work Documents
```

## 📁 Folder Structure

```
database/
│
├── docker/                          # Docker configuration
│   ├── docker-compose.yml          # Multi-container setup
│   ├── Dockerfile                  # Custom PostgreSQL image
│   └── init.sql                    # Database initialization
│
├── schema/                         # Drizzle ORM schema
│   ├── tables/                     # Table definitions
│   │   ├── users.ts
│   │   ├── firms.ts
│   │   ├── clients.ts
│   │   ├── cases.ts
│   │   ├── hearings.ts
│   │   ├── calendars.ts
│   │   └── ... (30+ tables)
│   ├── enums.ts                    # PostgreSQL enums
│   ├── relations.ts                # Table relationships
│   └── index.ts                    # Schema exports
│
├── drizzle/                        # Drizzle ORM config
│   ├── migrations/                 # Generated migrations
│   ├── seed.ts                     # Database seeding
│   └── drizzle.config.ts          # Drizzle configuration
│
├── config/                         # Configuration files
│   ├── .env.example               # Environment template
│   └── database.config.md         # Detailed config guide
│
└── README.md                       # This file
```

## 🔧 Setup Instructions

### Local Development Setup

1. **Clone and Navigate**
   ```bash
   cd database
   ```

2. **Start Docker Services**
   ```bash
   docker-compose -f docker/docker-compose.yml up -d
   ```

3. **Verify Database Connection**
   ```bash
   docker exec -it legal_postgres psql -U root -d legal_case_manager
   ```

4. **Install Node Dependencies**
   ```bash
   npm install drizzle-orm postgres dotenv nanoid
   npm install -D drizzle-kit @types/node tsx
   ```

5. **Configure Environment**
   ```bash
   cp config/.env.example config/.env
   # Edit config/.env if needed
   ```

### Production Setup

1. **Update Environment Variables**
   - Use strong passwords
   - Enable SSL connections
   - Configure backup strategy

2. **Apply Security Hardening**
   - Restrict network access
   - Enable audit logging
   - Set up monitoring

3. **Configure Backups**
   - Automated daily backups
   - Point-in-time recovery
   - Off-site backup storage

## 📊 Schema Management

### Database Schema Overview

The schema includes 30+ tables organized into logical groups:

#### Core Tables
- `users` - User accounts with role-based access
- `firms` - Law firm information (multi-tenant root)
- `clients` - Client information and KYC data
- `client_documents` - Client-related documents

#### Case Management
- `cases` - Legal cases with full details
- `case_history` - Audit trail for case changes
- `case_updates` - Significant case milestones
- `case_expenses` - Case-related expenses
- `documents` - Case documents metadata
- `notes` - Case notes and comments

#### Hearings & Judgments
- `hearings` - Court hearing records
- `judgments` - Court judgment details
- `hearing_attachments` - Hearing-related files

#### Calendar System
- `calendars` - User calendars
- `calendar_events` - Events with recurrence support
- `event_attendees` - Event participants
- `event_reminders` - Event notifications
- `calendar_acl` - Calendar sharing permissions
- `calendar_audit_log` - Calendar change history
- `calendar_sync_tokens` - External calendar sync

#### General Work
- `general_work` - Non-case legal services
- `general_work_documents` - Work-related documents

#### Reminders & Events
- `reminders` - Automated and manual reminders
- `events` - Legacy events table

#### Subscriptions & Billing
- `subscription_plans` - Available subscription tiers
- `user_subscriptions` - Active subscriptions
- `payment_history` - Payment transactions

#### AI Features
- `draft_documents` - Documents for AI drafting

### Type Safety

All tables have TypeScript types:

```typescript
import { cases, type Case, type InsertCase } from './database/schema';

// Inferred select type
const case: Case = await db.select().from(cases).where(...);

// Inferred insert type
const newCase: InsertCase = {
  firmId: 'firm_123',
  clientId: 'client_456',
  title: 'New Case',
  // ... TypeScript ensures all required fields
};
```

## 🔄 Migrations

### Generate Migration

After modifying schema files:

```bash
# Generate migration SQL
npx drizzle-kit generate
```

This creates a new migration file in `database/drizzle/migrations/`

### Apply Migrations

```bash
# Push schema to database
npx drizzle-kit push

# Or apply specific migration
npx drizzle-kit migrate
```

### Migration Best Practices

1. **Always backup before migrations**
   ```bash
   docker exec legal_postgres pg_dump -U root legal_case_manager > backup.sql
   ```

2. **Test in development first**
   ```bash
   # Test migration
   npx drizzle-kit push
   
   # Verify changes
   npx drizzle-kit studio
   ```

3. **Use transactions for safety**
   Drizzle automatically wraps migrations in transactions

4. **Document breaking changes**
   Add comments to migration files explaining changes

### Rollback Strategy

```bash
# Restore from backup
docker exec -i legal_postgres psql -U root legal_case_manager < backup.sql
```

## 🌱 Seeding Data

### Run Seed Script

```bash
# Seed database with demo data
npx tsx database/drizzle/seed.ts
```

### Seed Data Includes

- 3 subscription plans (Essential, Professional, Enterprise)
- 1 demo law firm
- 2 demo users (admin and lawyer)
- 2 demo clients (company and individual)
- 2 demo cases (commercial and family)
- 1 demo calendar with events

### Demo Credentials

After seeding, you can use these demo accounts:

- **Admin**: `ahmed@alqasimilegal.ae`
- **Lawyer**: `fatima@alqasimilegal.ae`

### Custom Seeding

Edit `database/drizzle/seed.ts` to add your own data:

```typescript
await db.insert(clients).values({
  id: nanoid(),
  firmId: 'your_firm_id',
  clientNumber: 'CLT-001',
  name: 'Your Client Name',
  // ... other fields
});
```

## 🔌 Database Access

### Using Drizzle ORM

```typescript
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { cases, clients } from './database/schema';
import { eq, and } from 'drizzle-orm';

// Create connection
const client = postgres(process.env.DATABASE_URL!);
const db = drizzle(client);

// Query examples
const allCases = await db.select().from(cases);

const firmCases = await db
  .select()
  .from(cases)
  .where(eq(cases.firmId, 'firm_123'));

const caseWithClient = await db
  .select()
  .from(cases)
  .leftJoin(clients, eq(cases.clientId, clients.id))
  .where(eq(cases.id, 'case_123'));

// Insert
await db.insert(cases).values({
  id: nanoid(),
  firmId: 'firm_123',
  clientId: 'client_456',
  // ... other fields
});

// Update
await db
  .update(cases)
  .set({ status: 'closed' })
  .where(eq(cases.id, 'case_123'));

// Delete
await db
  .delete(cases)
  .where(eq(cases.id, 'case_123'));
```

### Using pgAdmin

1. Open `http://localhost:5050`
2. Login with credentials
3. Add server connection
4. Browse tables and run queries

### Using psql CLI

```bash
# Connect to database
docker exec -it legal_postgres psql -U root -d legal_case_manager

# List tables
\dt

# Describe table
\d cases

# Run query
SELECT * FROM cases LIMIT 10;

# Exit
\q
```

## ✅ Best Practices

### 1. Always Use Firm-Based Filtering

```typescript
// ✅ Good - includes firm filter
const cases = await db
  .select()
  .from(cases)
  .where(and(
    eq(cases.firmId, userFirmId),
    eq(cases.status, 'active')
  ));

// ❌ Bad - missing firm filter (data leak!)
const cases = await db
  .select()
  .from(cases)
  .where(eq(cases.status, 'active'));
```

### 2. Use Transactions for Related Changes

```typescript
await db.transaction(async (tx) => {
  const caseId = nanoid();
  
  await tx.insert(cases).values({ id: caseId, ... });
  await tx.insert(caseHistory).values({ caseId, ... });
  await tx.insert(events).values({ caseId, ... });
});
```

### 3. Leverage Indexes

All tables have optimized indexes. Use them in queries:

```typescript
// ✅ Uses index on firm_id and status
const activeCases = await db
  .select()
  .from(cases)
  .where(and(
    eq(cases.firmId, firmId),
    eq(cases.status, 'active')
  ));
```

### 4. Handle Timestamps Properly

All timestamps are timezone-aware:

```typescript
const event = await db.insert(events).values({
  startTime: new Date(), // Automatically stored in UTC
  endTime: new Date(Date.now() + 3600000),
});
```

### 5. Use Type Inference

```typescript
// ✅ Type-safe
import { type Case } from './database/schema';

function processCase(case: Case) {
  // TypeScript knows all fields
  console.log(case.title, case.status);
}
```

## 🐛 Troubleshooting

### Database Won't Start

```bash
# Check Docker status
docker ps -a

# View logs
docker logs legal_postgres

# Restart container
docker-compose -f database/docker/docker-compose.yml restart

# Nuclear option: rebuild
docker-compose -f database/docker/docker-compose.yml down -v
docker-compose -f database/docker/docker-compose.yml up -d
```

### Connection Refused

```bash
# Check if port is available
netstat -an | grep 5432

# Verify environment variables
cat database/config/.env

# Test connection
docker exec legal_postgres pg_isready -U root
```

### Migration Errors

```bash
# Check current schema
npx drizzle-kit introspect

# Force regenerate migrations
rm -rf database/drizzle/migrations/*
npx drizzle-kit generate

# Manual migration
docker exec -it legal_postgres psql -U root -d legal_case_manager
```

### Slow Queries

```sql
-- Enable query logging
ALTER DATABASE legal_case_manager SET log_min_duration_statement = 1000;

-- Check slow queries
SELECT * FROM pg_stat_statements ORDER BY mean_time DESC LIMIT 10;

-- Analyze query
EXPLAIN ANALYZE SELECT * FROM cases WHERE firm_id = 'xxx';
```

### Disk Space Issues

```bash
# Check disk usage
docker exec legal_postgres df -h

# Check database size
docker exec legal_postgres psql -U root -d legal_case_manager -c "SELECT pg_size_pretty(pg_database_size('legal_case_manager'));"

# Vacuum database
docker exec legal_postgres psql -U root -d legal_case_manager -c "VACUUM FULL;"
```

## 📚 Additional Resources

- [PostgreSQL 18 Documentation](https://www.postgresql.org/docs/18/)
- [Drizzle ORM Documentation](https://orm.drizzle.team/)
- [Docker Compose Documentation](https://docs.docker.com/compose/)
- [pgAdmin Documentation](https://www.pgadmin.org/docs/)

## 🤝 Contributing

When modifying the database schema:

1. Update schema files in `database/schema/tables/`
2. Update relations in `database/schema/relations.ts`
3. Generate migration: `npx drizzle-kit generate`
4. Test migration locally
5. Update seed script if needed
6. Document changes in this README

## 📝 License

This database layer is part of the Legal Case Manager project.

---

**Need Help?** Check the [database.config.md](config/database.config.md) for detailed configuration options.
