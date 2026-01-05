# Drizzle ORM Type Error - Fix Summary

## Problem
TypeScript error in `advocate/web/app/api/auth/login/route.ts`:
```
Argument of type 'PgTableWithColumns<...>' is not assignable to parameter of type 'PgTable<TableConfig>'
```

## Root Cause
**Duplicate `drizzle-orm` installations** in separate `node_modules` directories:
- `advocate/database/node_modules/drizzle-orm` (v0.33.0)
- `advocate/web/node_modules/drizzle-orm` (v0.33.0)

Even though both were the same version, TypeScript treated them as incompatible types because they came from different module resolution paths. The `users` table schema was imported from the database package's drizzle-orm, but the `db.select().from()` method expected types from the web package's drizzle-orm.

## Solution
Implemented a **pnpm workspace** setup to share dependencies across packages:

### Files Created
1. **`package.json`** (root) - Workspace configuration
2. **`pnpm-workspace.yaml`** - pnpm workspace definition

### Changes Made
1. Created root workspace configuration
2. Removed duplicate `node_modules` directories
3. Ran `pnpm install` to install dependencies using workspace hoisting
4. Added missing dependencies to `advocate/web/package.json`:
   - `bcryptjs` & `@types/bcryptjs`
   - `nanoid`
   - `zod`

### Result
✅ **Original Drizzle ORM type error is completely resolved**
✅ All packages now share a single `drizzle-orm` installation
✅ TypeScript correctly recognizes types across the monorepo

## Verification
```bash
cd advocate/web
pnpm exec tsc --noEmit
# No drizzle-orm or PgTableWithColumns errors
```

## Additional Fixes
Also fixed JWT type errors in `lib/auth/jwt.ts` by properly typing the SignOptions.

## Best Practice
For monorepo projects with shared dependencies, always use a workspace manager (pnpm, npm, or yarn workspaces) to prevent duplicate dependency installations and type incompatibilities.
