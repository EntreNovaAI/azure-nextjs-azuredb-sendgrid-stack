// Kysely table and database types for Azure SQL (MSSQL)
// We target Azure SQL (MSSQL) via Kysely's Mssql dialect.
// These types define the database schema used by the application.

import {
  ColumnType,
  Insertable,
  Selectable,
  Updateable,
} from 'kysely'

// NOTE ON TYPES
// - Prisma uses String ids with cuid() defaults. We model them as plain string here.
// - DateTime maps to JavaScript Date at runtime; Kysely typing uses Date for selected values.
// - For createdAt/updatedAt, we model insert/update types to allow passing Date or ISO string.

export interface UserTable {
  id: string
  name: string | null
  email: string | null
  emailVerified: Date | null
  image: string | null
  password: string | null // Bcrypt hashed password for vanilla login
  accessLevel: string // 'free' | 'basic' | 'premium' in app logic; keep as string in DB
  stripeCustomerId: string | null
  // On select: Date; on insert: optional Date or string; on update: never (server default)
  createdAt: ColumnType<Date, Date | string | undefined, never>
  // On select: Date; on insert: optional Date or string; on update: Date or string
  updatedAt: ColumnType<Date, Date | string | undefined, Date | string | undefined>
}

export interface AccountTable {
  id: string
  userId: string
  type: string
  provider: string
  providerAccountId: string
  refresh_token: string | null
  access_token: string | null
  expires_at: number | null
  token_type: string | null
  scope: string | null
  id_token: string | null
  session_state: string | null
}

export interface SessionTable {
  id: string
  sessionToken: string
  userId: string
  expires: Date
}

export interface VerificationTokenTable {
  identifier: string
  token: string
  expires: Date
}

// Database mapping of table names to their schemas.
// NOTE: We intentionally match Prisma's model names as table names here
//       (User, Account, Session, VerificationToken). MSSQL is case-insensitive
//       by default, but keeping the names consistent avoids surprises.
export interface DB {
  User: UserTable
  Account: AccountTable
  Session: SessionTable
  VerificationToken: VerificationTokenTable
}

// Convenient derived types if you want to surface them in repos/services
export type User = Selectable<UserTable>
export type NewUser = Insertable<UserTable>
export type UserUpdate = Updateable<UserTable>

export type Account = Selectable<AccountTable>
export type NewAccount = Insertable<AccountTable>
export type AccountUpdate = Updateable<AccountTable>

export type Session = Selectable<SessionTable>
export type NewSession = Insertable<SessionTable>
export type SessionUpdate = Updateable<SessionTable>

export type VerificationToken = Selectable<VerificationTokenTable>
export type NewVerificationToken = Insertable<VerificationTokenTable>
export type VerificationTokenUpdate = Updateable<VerificationTokenTable>


