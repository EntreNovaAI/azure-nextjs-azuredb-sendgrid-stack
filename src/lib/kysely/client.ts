// Kysely MSSQL client configured for Azure SQL (uses tedious + tarn)
// Reference: Kysely Getting Started docs: https://kysely.dev/docs/getting-started
import 'server-only'

import { Kysely, MssqlDialect } from 'kysely'
import type { DB } from './types'
import * as Tedious from 'tedious'
import * as Tarn from 'tarn'

// We import the libraries lazily to avoid ESM/CJS interop headaches in SSR
// apps unless the client is actually used.
// You must add dependencies: `kysely`, `tedious`, `tarn`.

// Azure SQL connection settings
// Required: MSSQL_SERVER, MSSQL_DATABASE, MSSQL_USER, MSSQL_PASSWORD, MSSQL_ENCRYPT
// Optional: MSSQL_POOL_MIN, MSSQL_POOL_MAX
//
// IMPORTANT: Lazy initialization prevents build-time errors
// In production (Azure Container Apps), secrets are injected at runtime from Key Vault
// During Docker build, these env vars won't exist yet, so we defer initialization

// Lazy holders so module import happens only if someone uses `db`
let kyselyInstance: Kysely<DB> | null = null

/**
 * Get configuration from environment variables at runtime
 * This prevents errors during Docker build when secrets aren't available yet
 */
function getDbConfig() {
  const server = process.env.MSSQL_SERVER
  const database = process.env.MSSQL_DATABASE
  const userName = process.env.MSSQL_USER
  const password = process.env.MSSQL_PASSWORD
  const encryptRaw = process.env.MSSQL_ENCRYPT

  // Validate at runtime (not at module import time)
  if (!server) throw new Error('Missing required environment variable: MSSQL_SERVER')
  if (!database) throw new Error('Missing required environment variable: MSSQL_DATABASE')
  if (!userName) throw new Error('Missing required environment variable: MSSQL_USER')
  if (!password) throw new Error('Missing required environment variable: MSSQL_PASSWORD')
  if (!encryptRaw) throw new Error('Missing required environment variable: MSSQL_ENCRYPT')

  const encryptRawLower = encryptRaw.toLowerCase()
  if (encryptRawLower !== 'true' && encryptRawLower !== 'false') {
    throw new Error('MSSQL_ENCRYPT must be "true" or "false"')
  }
  const encrypt = encryptRawLower === 'true'
  const poolMin = Number(process.env.MSSQL_POOL_MIN ?? '0')
  const poolMax = Number(process.env.MSSQL_POOL_MAX ?? '10')

  return { server, database, userName, password, encrypt, poolMin, poolMax }
}

export function getDb(): Kysely<DB> {
  if (kyselyInstance) return kyselyInstance

  // Get configuration at runtime (lazy)
  const { server, database, userName, password, encrypt, poolMin, poolMax } = getDbConfig()

  const dialect = new MssqlDialect({
    tarn: {
      ...Tarn,
      options: {
        min: poolMin,
        max: poolMax,
      },
    },
    tedious: {
      ...Tedious,
      connectionFactory: () =>
        new Tedious.Connection({
          server: server,
          authentication: {
            type: 'default',
            options: {
              userName: userName,
              password: password,
            },
          },
          options: {
            database: database,
            encrypt,
            rowCollectionOnRequestCompletion: true,
            trustServerCertificate: false,
          },
        }),
    },
  })

  kyselyInstance = new Kysely<DB>({ dialect })
  return kyselyInstance
}

export async function closeDb(): Promise<void> {
  if (kyselyInstance) {
    await kyselyInstance.destroy()
    kyselyInstance = null
  }
}

/**
 * Lazy-initialized database instance using Proxy pattern
 * 
 * Why we need the Proxy:
 * - Next.js build process executes server code to collect page data
 * - Without Proxy, getDb() would run during build when env vars don't exist
 * - The Proxy defers initialization until first actual use at runtime
 * - This is critical for Docker builds where secrets are injected later
 */
export const db = new Proxy({} as Kysely<DB>, {
  get(_target, prop) {
    // Lazy-load database on first property access
    const instance = getDb()
    const value = instance[prop as keyof Kysely<DB>]
    
    // Bind functions to preserve 'this' context and access to private members
    if (typeof value === 'function') {
      return value.bind(instance)
    }
    
    return value
  }
})

// Auto-initialize tables in development if they don't exist
// Only run at runtime, not during build
if (typeof window === 'undefined' && process.env.NODE_ENV === 'development') {
  // Defer this to avoid executing during build
  Promise.resolve().then(() => {
    import('../../../kysely/migrations/ensure-tables')
      .then(({ ensureAllTables }) => {
        ensureAllTables().catch(error => {
          console.error('Failed to auto-initialize database tables:', error)
        })
      })
      .catch(error => {
        console.error('Failed to load migration module:', error)
      })
  })
}


