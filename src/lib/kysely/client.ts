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

// Azure SQL connection settings derived from env
// Required: MSSQL_SERVER, MSSQL_DATABASE, MSSQL_USER, MSSQL_PASSWORD, MSSQL_ENCRYPT
// Optional: MSSQL_POOL_MIN, MSSQL_POOL_MAX
const server = process.env.MSSQL_SERVER
const database = process.env.MSSQL_DATABASE
const userName = process.env.MSSQL_USER
const password = process.env.MSSQL_PASSWORD
const encryptRaw = process.env.MSSQL_ENCRYPT

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

// Lazy holders so module import happens only if someone uses `db`
let kyselyInstance: Kysely<DB> | null = null

export function getDb(): Kysely<DB> {
  if (kyselyInstance) return kyselyInstance

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
          server: server!,
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

export const db = getDb()

// Auto-initialize tables in development if they don't exist
if (process.env.NODE_ENV === 'development') {
  import('../../../kysely/migrations/ensure-tables')
    .then(({ ensureAllTables }) => {
      ensureAllTables().catch(error => {
        console.error('Failed to auto-initialize database tables:', error)
      })
    })
    .catch(error => {
      console.error('Failed to load migration module:', error)
    })
}


