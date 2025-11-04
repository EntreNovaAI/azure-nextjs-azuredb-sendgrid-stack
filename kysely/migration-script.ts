// Kysely migration runner for MSSQL (Azure SQL)
// Docs: https://kysely.dev/docs/migrations
//
// How to run:
//  - From project root, run with ts-node or tsx, e.g.:
//      pnpm dlx tsx kysely/migration-script.ts
//  - Set required env vars for DB connection (see `app/_lib/kysely/client.ts`).
//
// Behavior:
//  - migrate:default → migrate to latest
//  - migrate:down    → migrate down one step
//  - migrate:to <name> → migrate to a specific migration name
//
import * as path from 'path'
import { promises as fs } from 'fs'
import { config } from 'dotenv'
import { Kysely, Migrator, FileMigrationProvider, MssqlDialect } from 'kysely'
import * as Tedious from 'tedious'
import * as Tarn from 'tarn'

// Load environment files based on NODE_ENV
// Supports multiple scenarios:
// - Development: .env.local and .env (for local DB)
// - Production: .env.production (for Azure DB)
// - Command line: .env.production, then fallback to .env
if (process.env.NODE_ENV === 'development') {
  // Development mode: use local env files
  config({ path: '.env.local' })
  config({ path: '.env' })
} else {
  // Production/deployment mode: use production env file
  config({ path: '.env.production' })
  // Fallback to .env if .env.production doesn't exist (manual command line usage)
  config({ path: '.env' })
}

// Minimal DB type for migrations on purpose (Kysely<any>)
// Migrations must not depend on app runtime types. See docs.

function getRequiredEnv(name: string): string {
  const value = process.env[name]
  if (!value) throw new Error(`Missing required environment variable: ${name}`)
  return value
}

function createDb(): Kysely<any> {
  const server = getRequiredEnv('MSSQL_SERVER')
  const database = getRequiredEnv('MSSQL_DATABASE')
  const userName = getRequiredEnv('MSSQL_USER')
  const password = getRequiredEnv('MSSQL_PASSWORD')
  const encryptRaw = getRequiredEnv('MSSQL_ENCRYPT').toLowerCase()
  if (encryptRaw !== 'true' && encryptRaw !== 'false') {
    throw new Error('MSSQL_ENCRYPT must be "true" or "false"')
  }
  const encrypt = encryptRaw === 'true'
  const poolMin = Number(process.env.MSSQL_POOL_MIN ?? '0')
  const poolMax = Number(process.env.MSSQL_POOL_MAX ?? '10')

  const dialect = new MssqlDialect({
    tarn: {
      ...Tarn,
      options: { min: poolMin, max: poolMax },
    },
    tedious: {
      ...Tedious,
      connectionFactory: () =>
        new Tedious.Connection({
          server,
          authentication: {
            type: 'default',
            options: { userName, password },
          },
          options: {
            database,
            encrypt,
            rowCollectionOnRequestCompletion: true,
            trustServerCertificate: false,
          },
        }),
    },
  })

  return new Kysely<any>({ dialect })
}

async function getMigrator(db: Kysely<any>): Promise<Migrator> {
  // Resolve absolute migrations folder path relative to project root.
  // Using process.cwd() allows running from repo root regardless of module system.
  const migrationFolder = path.join(process.cwd(), 'kysely', 'migrations', 'files')

  return new Migrator({
    db,
    provider: new FileMigrationProvider({ fs, path, migrationFolder }),
    // allowUnorderedMigrations: true, // enable if multiple branches add migrations concurrently
  })
}

async function migrateToLatest(): Promise<void> {
  const db = createDb()
  try {
    const migrator = await getMigrator(db)
    const { error, results } = await migrator.migrateToLatest()
    for (const it of results ?? []) {
      if (it.status === 'Success') {
        console.log(`migration "${it.migrationName}" executed successfully`)
      } else if (it.status === 'Error') {
        console.error(`failed to execute migration "${it.migrationName}"`)
      }
    }
    if (error) throw error
  } finally {
    await db.destroy()
  }
}

async function migrateDown(): Promise<void> {
  const db = createDb()
  try {
    const migrator = await getMigrator(db)
    const { error, results } = await migrator.migrateDown()
    for (const it of results ?? []) {
      if (it.status === 'Success') {
        console.log(`migration down "${it.migrationName}" reverted successfully`)
      } else if (it.status === 'Error') {
        console.error(`failed to revert migration "${it.migrationName}"`)
      }
    }
    if (error) throw error
  } finally {
    await db.destroy()
  }
}

async function migrateTo(targetName: string): Promise<void> {
  const db = createDb()
  try {
    const migrator = await getMigrator(db)
    const { error, results } = await migrator.migrateTo(targetName)
    for (const it of results ?? []) {
      if (it.status === 'Success') {
        console.log(`migration step "${it.migrationName}" executed successfully`)
      } else if (it.status === 'Error') {
        console.error(`failed to execute step "${it.migrationName}"`)
      }
    }
    if (error) throw error
  } finally {
    await db.destroy()
  }
}

async function main() {
  const [cmd, arg] = process.argv.slice(2)
  if (cmd === 'migrate:down') {
    await migrateDown()
    return
  }
  if (cmd === 'migrate:to') {
    if (!arg) throw new Error('Usage: tsx kysely/migration-script.ts migrate:to <migrationName>')
    await migrateTo(arg)
    return
  }
  await migrateToLatest()
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})

