# Database Operations Guide

This guide explains how this template structures and uses database operations with Kysely.

---

## Overview

This template uses **Kysely** as a type-safe SQL query builder for Azure SQL Database (MSSQL). It provides:

- Full TypeScript type safety for all queries
- Clean repository pattern for data access
- Migration system for schema changes
- Lazy initialization for build-time safety

---

## Project Structure

### `/kysely` - Migration Scripts (Root Level)

- `migration-script.ts` - Run migrations (up/down/specific version)
- `check-migration-status.ts` - View applied migrations and table status
- `migrations/files/` - Timestamped migration files
- `migrations/ensure-tables.ts` - Auto-creates tables in development mode

### `/src/lib/kysely` - Application Code

- `client.ts` - Database connection with lazy initialization
- `types.ts` - TypeScript definitions for all tables
- `repositories/` - Data access functions organized by domain
- `index.ts` - Convenient exports

---

## Key Concepts

### 1. Lazy Initialization (`client.ts`)

The database connection uses a **Proxy pattern** to delay initialization until first use. This prevents build-time errors when database credentials aren't available yet (like during Docker builds).

**Connection config:**

- Environment variables: `MSSQL_SERVER`, `MSSQL_DATABASE`, `MSSQL_USER`, `MSSQL_PASSWORD`
- Connection pooling via Tarn (configurable min/max)
- Encrypted connections to Azure SQL

### 2. Type-Safe Schema (`types.ts`)

Every table has TypeScript interfaces that provide compile-time safety:

- `UserTable`, `AccountTable`, `SessionTable`, etc.
- Convenience types: `User`, `NewUser`, `UserUpdate`
- Special `ColumnType<>` for fields with different insert/select/update types

### 3. Repository Pattern (`repositories/`)

All database operations are encapsulated in repository functions:

- One file per domain (e.g., `user-repo.ts`)
- Clean, reusable functions like `getUserByEmail()`, `createUser()`, etc.
- Handles MSSQL quirks (no `RETURNING` clause - must insert then select)
- Always returns type-safe results

### 4. Migrations

Migrations are TypeScript files with `up()` and `down()` functions:

- Use raw SQL for MSSQL-specific features
- Idempotent with `IF NOT EXISTS` guards
- Track applied migrations in `kysely_migration` table

**Run migrations:**

```bash
pnpm dlx tsx kysely/migration-script.ts              # Latest
pnpm dlx tsx kysely/migration-script.ts migrate:down # Rollback
pnpm dlx tsx kysely/check-migration-status.ts        # Status
```

---

## Database Schema

**User** - Core user data (email, password, subscription level, Stripe ID)  
**Account** - OAuth provider links (Google, GitHub, etc.)  
**Session** - Active user sessions  
**VerificationToken** - Email verification flow  
**PasswordResetToken** - Password reset with expiration tracking

All tables use foreign keys with CASCADE delete where appropriate.

---

## How to Use

### In Your Code

Import the database client and query:

```typescript
import { db } from '@lib/kysely'

const user = await db
  .selectFrom('User')
  .selectAll()
  .where('id', '=', userId)
  .executeTakeFirst()
```

### Use Repositories (Recommended)

Instead of direct queries, use repository functions:

```typescript
import { getUserByEmail } from '@lib/kysely/repositories/user-repo'

const user = await getUserByEmail('user@example.com')
```

This keeps database logic organized and reusable.

---

## Best Practices

1. **Always use repositories** - Don't query directly in routes/components
2. **Handle MSSQL limitations** - No `RETURNING`, must insert then select
3. **Update timestamps** - Always set `updatedAt` when modifying records
4. **Use transactions** - For multi-step operations that must succeed/fail together
5. **Leverage type safety** - Let TypeScript catch column/type errors at compile time

---

## Troubleshooting

**Connection errors during build?**  
This is expected! Lazy initialization prevents build-time connections. Everything works at runtime.

**Missing environment variables?**  
Check `.env.local` (development) or Azure Key Vault secrets (production).

**Tables don't exist?**  
Run `bash scripts/dev/02_db_setup.sh` to execute migrations (or manually: `pnpm dlx tsx kysely/migration-script.ts`). In development mode, /init should handle this automatically.

---

## Summary

This template separates database concerns cleanly:

- **Types** define your schema in TypeScript
- **Repositories** contain all data access logic  
- **Migrations** manage schema changes over time
- **Lazy initialization** prevents build issues

All queries are type-safe, maintainable, and organized using the repository pattern.
