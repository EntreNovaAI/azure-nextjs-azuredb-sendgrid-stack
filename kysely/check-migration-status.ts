// Check migration status and what migrations have been applied
import * as path from 'path'
import { promises as fs } from 'fs'
import { config } from 'dotenv'
import { Kysely, Migrator, FileMigrationProvider, MssqlDialect, sql } from 'kysely'
import * as Tedious from 'tedious'
import * as Tarn from 'tarn'

// Determine project root directory
// This allows the script to be run from any location (project root or subdirectory)
// and still find the correct .env files
const projectRoot = process.cwd()

// Load environment files based on NODE_ENV
// Uses absolute paths so script can be run from command line from any directory
// Supports multiple scenarios:
// - Development: .env.local and .env (for local DB)
// - Production: .env.production (for Azure DB)
// - Command line: .env.production, then fallback to .env
console.log('Loading environment from:', projectRoot)
console.log('NODE_ENV:', process.env.NODE_ENV || 'not set')

if (process.env.NODE_ENV === 'development') {
  // Development mode: use local env files
  const localPath = path.join(projectRoot, '.env.local')
  const envPath = path.join(projectRoot, '.env')
  console.log('Attempting to load:', localPath)
  // Use override: true to ensure file values take precedence over shell-exported vars
  const result1 = config({ path: localPath, override: true })
  if (result1.error) {
    console.log('  ⚠ .env.local not found or error:', result1.error.message)
  } else {
    console.log(`  ✓ Loaded .env.local (${Object.keys(result1.parsed || {}).length} vars)`)
  }
  console.log('Attempting to load:', envPath)
  const result2 = config({ path: envPath, override: true })
  if (result2.error) {
    console.log('  ⚠ .env not found or error:', result2.error.message)
  } else {
    console.log(`  ✓ Loaded .env (${Object.keys(result2.parsed || {}).length} vars)`)
  }
} else {
  // Production/deployment mode: use production env file
  const prodPath = path.join(projectRoot, '.env.production')
  const envPath = path.join(projectRoot, '.env')
  console.log('Attempting to load:', prodPath)
  // Use override: true to ensure file values take precedence over shell-exported vars
  const result1 = config({ path: prodPath, override: true })
  if (result1.error) {
    console.log('  ⚠ .env.production not found or error:', result1.error.message)
  } else {
    console.log(`  ✓ Loaded .env.production (${Object.keys(result1.parsed || {}).length} vars)`)
  }
  console.log('Attempting to load:', envPath)
  const result2 = config({ path: envPath, override: true })
  if (result2.error) {
    console.log('  ⚠ .env not found or error:', result2.error.message)
  } else {
    console.log(`  ✓ Loaded .env (${Object.keys(result2.parsed || {}).length} vars)`)
  }
}

console.log('')

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

async function checkStatus() {
  const db = createDb()
  try {
    console.log('Checking database tables...\n')
    
    // Check if PasswordResetToken table exists
    const tableCheck = await sql<{ TableExists: number }>`
      SELECT 
        CASE WHEN EXISTS (
          SELECT * FROM sys.objects 
          WHERE object_id = OBJECT_ID(N'dbo.[PasswordResetToken]') AND type IN (N'U')
        ) THEN 1 ELSE 0 END AS TableExists
    `.execute(db)
    
    console.log('PasswordResetToken table exists:', tableCheck.rows[0])
    
    // Check migration tracking table
    const migrationTableCheck = await sql<{ MigrationTableExists: number }>`
      SELECT 
        CASE WHEN EXISTS (
          SELECT * FROM sys.objects 
          WHERE object_id = OBJECT_ID(N'dbo.[kysely_migration]') AND type IN (N'U')
        ) THEN 1 ELSE 0 END AS MigrationTableExists
    `.execute(db)
    
    console.log('Migration tracking table exists:', migrationTableCheck.rows[0])
    
    // If migration table exists, show applied migrations
    if (migrationTableCheck.rows[0]?.MigrationTableExists === 1) {
      const migrations = await sql`SELECT * FROM dbo.[kysely_migration]`.execute(db)
      console.log('\nApplied migrations:')
      if (migrations.rows.length === 0) {
        console.log('  (No migrations have been applied yet)')
      } else {
        migrations.rows.forEach((row: any) => {
          console.log(`  - ${row.name} (timestamp: ${row.timestamp})`)
        })
      }
    }
    
  } catch (error) {
    console.error('Error checking status:', error)
  } finally {
    await db.destroy()
  }
}

checkStatus().catch((err) => {
  console.error(err)
  process.exit(1)
})

