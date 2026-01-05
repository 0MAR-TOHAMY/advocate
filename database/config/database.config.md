# Database Configuration Guide

## Overview

This document provides detailed configuration information for the Legal Case Manager PostgreSQL 18 database.

## Architecture

### Database Engine
- **PostgreSQL**: Version 18 (latest stable)
- **ORM**: Drizzle ORM with PostgreSQL dialect
- **Containerization**: Docker + Docker Compose
- **Management Tool**: pgAdmin 4

### Key Features
- Multi-tenant architecture (firm-based isolation)
- Full ACID compliance
- Advanced indexing for performance
- JSON/JSONB support for flexible data structures
- Timezone-aware timestamps
- Foreign key constraints with cascading
- Comprehensive audit trails

## Connection Configuration

### Local Development

```typescript
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';

const connectionString = process.env.DATABASE_URL || 
  'postgresql://root:strongpassword@localhost:5432/legal_case_manager';

const client = postgres(connectionString);
const db = drizzle(client);
```

### Production

For production environments, use connection pooling and SSL:

```typescript
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';

const client = postgres(process.env.DATABASE_URL!, {
  max: 10, // Maximum pool size
  idle_timeout: 20,
  connect_timeout: 10,
  ssl: process.env.DATABASE_SSL === 'true' ? {
    rejectUnauthorized: process.env.DATABASE_SSL_REJECT_UNAUTHORIZED !== 'false'
  } : false,
});

const db = drizzle(client);
```

## Environment Variables

### Required Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `POSTGRES_USER` | Database superuser | `root` |
| `POSTGRES_PASSWORD` | Database password | `strongpassword` |
| `POSTGRES_DB` | Database name | `legal_case_manager` |
| `POSTGRES_HOST` | Database host | `localhost` |
| `POSTGRES_PORT` | Database port | `5432` |
| `DATABASE_URL` | Full connection string | `postgresql://...` |

### Optional Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `PGADMIN_EMAIL` | pgAdmin login email | `admin@legal.com` |
| `PGADMIN_PASSWORD` | pgAdmin password | `admin123` |
| `PGADMIN_PORT` | pgAdmin web port | `5050` |
| `DATABASE_SSL` | Enable SSL | `false` |

## Performance Tuning

### Recommended PostgreSQL Settings

For production deployments, adjust these settings in `postgresql.conf`:

```conf
# Memory Settings
shared_buffers = 256MB              # 25% of system RAM
effective_cache_size = 1GB          # 50-75% of system RAM
work_mem = 16MB                     # Per operation memory
maintenance_work_mem = 128MB        # For maintenance operations

# Connection Settings
max_connections = 100               # Adjust based on load

# Query Planner
random_page_cost = 1.1              # For SSD storage
effective_io_concurrency = 200      # For SSD storage

# Write-Ahead Log
wal_buffers = 16MB
checkpoint_completion_target = 0.9
```

### Indexing Strategy

The schema includes optimized indexes for:
- **Firm-based queries**: All tables indexed on `firm_id`
- **User lookups**: Email and ID indexes
- **Case searches**: Status, number, client, assigned user
- **Date ranges**: Hearing dates, deadlines, timestamps
- **Full-text search**: Using `pg_trgm` extension

## Backup Strategy

### Automated Backups

```bash
# Daily backup script
#!/bin/bash
BACKUP_DIR="/backups/postgres"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="$BACKUP_DIR/legal_case_manager_$TIMESTAMP.sql"

docker exec legal_postgres pg_dump -U root legal_case_manager > $BACKUP_FILE
gzip $BACKUP_FILE

# Keep only last 30 days
find $BACKUP_DIR -name "*.sql.gz" -mtime +30 -delete
```

### Point-in-Time Recovery

Enable WAL archiving for point-in-time recovery:

```conf
# postgresql.conf
wal_level = replica
archive_mode = on
archive_command = 'cp %p /var/lib/postgresql/wal_archive/%f'
```

## Security Best Practices

### 1. Password Management
- Use strong, unique passwords
- Rotate credentials regularly
- Store credentials in secure vaults (not in code)

### 2. Network Security
- Restrict database access to application servers only
- Use SSL/TLS for all connections
- Implement IP whitelisting

### 3. Access Control
```sql
-- Create read-only user for reporting
CREATE USER reporting_user WITH PASSWORD 'secure_password';
GRANT CONNECT ON DATABASE legal_case_manager TO reporting_user;
GRANT USAGE ON SCHEMA public TO reporting_user;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO reporting_user;
```

### 4. Audit Logging
Enable PostgreSQL audit logging:

```conf
# postgresql.conf
log_statement = 'mod'               # Log all modifications
log_duration = on                   # Log query duration
log_connections = on                # Log connections
log_disconnections = on             # Log disconnections
```

## Monitoring

### Key Metrics to Monitor

1. **Connection Pool**
   - Active connections
   - Idle connections
   - Connection wait time

2. **Query Performance**
   - Slow queries (> 1 second)
   - Query execution plans
   - Index usage

3. **Database Size**
   - Table sizes
   - Index sizes
   - WAL size

4. **System Resources**
   - CPU usage
   - Memory usage
   - Disk I/O

### Monitoring Queries

```sql
-- Active connections
SELECT count(*) FROM pg_stat_activity WHERE state = 'active';

-- Database size
SELECT pg_size_pretty(pg_database_size('legal_case_manager'));

-- Table sizes
SELECT 
  schemaname,
  tablename,
  pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;

-- Slow queries
SELECT 
  query,
  calls,
  total_time,
  mean_time,
  max_time
FROM pg_stat_statements
ORDER BY mean_time DESC
LIMIT 10;
```

## Migration Strategy

### Development to Production

1. **Test migrations in staging**
   ```bash
   npm run db:generate
   npm run db:migrate
   ```

2. **Backup production database**
   ```bash
   npm run db:backup
   ```

3. **Apply migrations with zero downtime**
   - Use blue-green deployment
   - Apply backward-compatible changes first
   - Monitor for errors

4. **Rollback plan**
   ```bash
   npm run db:rollback
   ```

## Troubleshooting

### Common Issues

#### Connection Refused
```bash
# Check if PostgreSQL is running
docker ps | grep legal_postgres

# Check logs
docker logs legal_postgres

# Restart container
docker-compose -f database/docker/docker-compose.yml restart postgres
```

#### Slow Queries
```sql
-- Enable query logging
ALTER DATABASE legal_case_manager SET log_min_duration_statement = 1000;

-- Analyze query plan
EXPLAIN ANALYZE SELECT * FROM cases WHERE firm_id = 'xxx';
```

#### Disk Space Issues
```bash
# Check disk usage
docker exec legal_postgres df -h

# Clean up old WAL files
docker exec legal_postgres pg_archivecleanup /var/lib/postgresql/data/pg_wal
```

## Support

For database-related issues:
1. Check Docker logs: `docker logs legal_postgres`
2. Review pgAdmin query history
3. Consult PostgreSQL documentation: https://www.postgresql.org/docs/18/
4. Check Drizzle ORM docs: https://orm.drizzle.team/

## Version History

- **v1.0.0** (2024-11): Initial PostgreSQL 18 setup with Drizzle ORM
