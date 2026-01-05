# Core Systems Implementation

## 1. Global Input Validation
We use **Zod** for all validation.
- Utilities located in `lib/validation/index.ts`.
- Schemas in `lib/validation/schemas/`.
- Usage: `await parseBody(req, schema)` or `parseQuery(req, schema)`.

## 2. Authorization (RBAC + ABAC)
Centralized in `lib/auth/authorize.ts`.
- `requireAuth(req)`: Validates JWT.
- `requirePermission(req, 'permission:key')`: Checks role-based permissions.
- `requireOwnership(req, options)`: Checks resource ownership.

Database tables:
- `roles`: Defines roles.
- `permissions`: Defines available permissions.
- `role_permissions`: Links roles to permissions.
- `firm_users`: Assigns roles to users within a firm.

## 3. Error Handling
Standardized error responses.
- `lib/errors/catalog.ts`: Defines `ErrorCodes`.
- `lib/errors/respond.ts`: Helper `errorResponse` to return JSON with correct status and i18n message.
- `handleZodError`: Formats validation errors.

## 4. Timezone Safety
- All dates in DB are UTC.
- `lib/time/index.ts` provides helpers:
  - `toUTC`: Client Input -> UTC
  - `fromUTC`: UTC -> Client Timezone
  - `format`: UTC -> Formatted String (Localized)

## 5. Testing
- **Vitest** is set up.
- Run `npm test` or `pnpm test`.
- Tests located in `tests/` and alongside files.
