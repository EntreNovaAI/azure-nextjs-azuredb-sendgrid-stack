// Initial Kysely migration for complete auth schema on MSSQL (Azure SQL)
// Based on Kysely migration docs: https://kysely.dev/docs/migrations
// Note: We use raw SQL to support IF NOT EXISTS/IF EXISTS patterns in T-SQL.
//
// This migration creates all necessary tables for authentication:
// - User: Core user data with OAuth support and password-based login
// - Account: OAuth provider account linking
// - Session: User session management
// - VerificationToken: Email verification tokens
// - PasswordResetToken: Password reset functionality with expiration

import { Kysely, sql } from 'kysely'

export async function up(db: Kysely<any>): Promise<void> {
  // Create dbo.[User]
  // Includes password field for vanilla login support (bcrypt hashed passwords)
  await sql`
    IF NOT EXISTS (
      SELECT * FROM sys.objects 
      WHERE object_id = OBJECT_ID(N'dbo.[User]') AND type IN (N'U')
    )
    BEGIN
      CREATE TABLE dbo.[User] (
        id                NVARCHAR(100)  NOT NULL PRIMARY KEY,
        name              NVARCHAR(255)  NULL,
        email             NVARCHAR(255)  NULL,
        emailVerified     DATETIME2      NULL,
        image             NVARCHAR(2083) NULL,
        password          NVARCHAR(255)  NULL,
        accessLevel       NVARCHAR(50)   NOT NULL CONSTRAINT DF_User_accessLevel DEFAULT ('free'),
        stripeCustomerId  NVARCHAR(100)  NULL,
        createdAt         DATETIME2      NOT NULL CONSTRAINT DF_User_createdAt DEFAULT (SYSUTCDATETIME()),
        updatedAt         DATETIME2      NOT NULL CONSTRAINT DF_User_updatedAt DEFAULT (SYSUTCDATETIME())
      );
      -- Unique index on email for preventing duplicates and faster lookups
      CREATE UNIQUE INDEX IX_User_Email ON dbo.[User] (email) WHERE email IS NOT NULL;
      -- Index for password-based login performance
      CREATE INDEX IX_User_Email_Password ON dbo.[User] (email) 
      WHERE email IS NOT NULL AND password IS NOT NULL;
    END
  `.execute(db)

  // Create dbo.[Account]
  // Stores OAuth provider account information for third-party authentication
  await sql`
    IF NOT EXISTS (
      SELECT * FROM sys.objects 
      WHERE object_id = OBJECT_ID(N'dbo.[Account]') AND type IN (N'U')
    )
    BEGIN
      CREATE TABLE dbo.[Account] (
        id                 NVARCHAR(100) NOT NULL PRIMARY KEY,
        userId             NVARCHAR(100) NOT NULL,
        type               NVARCHAR(255) NOT NULL,
        provider           NVARCHAR(255) NOT NULL,
        providerAccountId  NVARCHAR(255) NOT NULL,
        refresh_token      NVARCHAR(MAX) NULL,
        access_token       NVARCHAR(MAX) NULL,
        expires_at         INT NULL,
        token_type         NVARCHAR(100) NULL,
        scope              NVARCHAR(1000) NULL,
        id_token           NVARCHAR(MAX) NULL,
        session_state      NVARCHAR(255) NULL,
        CONSTRAINT FK_Account_User FOREIGN KEY (userId) REFERENCES dbo.[User](id) ON DELETE CASCADE
      );
      -- Unique index on provider + account ID to prevent duplicate account links
      CREATE UNIQUE INDEX IX_Account_Provider_ProviderAccountId ON dbo.[Account](provider, providerAccountId);
    END
  `.execute(db)

  // Create dbo.[Session]
  // Manages active user sessions
  await sql`
    IF NOT EXISTS (
      SELECT * FROM sys.objects 
      WHERE object_id = OBJECT_ID(N'dbo.[Session]') AND type IN (N'U')
    )
    BEGIN
      CREATE TABLE dbo.[Session] (
        id            NVARCHAR(100) NOT NULL PRIMARY KEY,
        sessionToken  NVARCHAR(255) NOT NULL,
        userId        NVARCHAR(100) NOT NULL,
        expires       DATETIME2      NOT NULL,
        CONSTRAINT UQ_Session_SessionToken UNIQUE (sessionToken),
        CONSTRAINT FK_Session_User FOREIGN KEY (userId) REFERENCES dbo.[User](id) ON DELETE CASCADE
      );
    END
  `.execute(db)

  // Create dbo.[VerificationToken]
  // Handles email verification tokens for account activation
  await sql`
    IF NOT EXISTS (
      SELECT * FROM sys.objects 
      WHERE object_id = OBJECT_ID(N'dbo.[VerificationToken]') AND type IN (N'U')
    )
    BEGIN
      CREATE TABLE dbo.[VerificationToken] (
        identifier NVARCHAR(255) NOT NULL,
        token      NVARCHAR(255) NOT NULL,
        expires    DATETIME2      NOT NULL,
        CONSTRAINT UQ_VerificationToken_Token UNIQUE (token)
      );
      -- Composite index for efficient token lookup by identifier
      CREATE UNIQUE INDEX IX_VerificationToken_Identifier_Token ON dbo.[VerificationToken](identifier, token);
    END
  `.execute(db)

  // Create dbo.[PasswordResetToken]
  // Stores password reset tokens with expiry and usage tracking
  await sql`
    IF NOT EXISTS (
      SELECT * FROM sys.objects 
      WHERE object_id = OBJECT_ID(N'dbo.[PasswordResetToken]') AND type IN (N'U')
    )
    BEGIN
      CREATE TABLE dbo.[PasswordResetToken] (
        id         NVARCHAR(100)  NOT NULL PRIMARY KEY,
        userId     NVARCHAR(100)  NOT NULL,
        token      NVARCHAR(255)  NOT NULL,
        expires    DATETIME2      NOT NULL,
        used       BIT            NOT NULL CONSTRAINT DF_PasswordResetToken_used DEFAULT (0),
        createdAt  DATETIME2      NOT NULL CONSTRAINT DF_PasswordResetToken_createdAt DEFAULT (SYSUTCDATETIME()),
        CONSTRAINT FK_PasswordResetToken_User FOREIGN KEY (userId) REFERENCES dbo.[User](id) ON DELETE CASCADE
      );
      -- Unique token to prevent duplicates and speed lookups by token
      CREATE UNIQUE INDEX IX_PasswordResetToken_Token ON dbo.[PasswordResetToken] (token);
      -- Composite index to efficiently invalidate existing unused tokens per user
      CREATE INDEX IX_PasswordResetToken_UserId_Used ON dbo.[PasswordResetToken] (userId, used);
    END
  `.execute(db)
}

export async function down(db: Kysely<any>): Promise<void> {
  // Drop in reverse dependency order to avoid foreign key constraint errors
  
  // Drop PasswordResetToken (depends on User)
  await sql`
    IF OBJECT_ID(N'dbo.[PasswordResetToken]', N'U') IS NOT NULL
    BEGIN
      DROP TABLE dbo.[PasswordResetToken];
    END
  `.execute(db)

  // Drop VerificationToken (no dependencies)
  await sql`
    IF OBJECT_ID(N'dbo.[VerificationToken]', N'U') IS NOT NULL
    BEGIN
      DROP TABLE dbo.[VerificationToken];
    END
  `.execute(db)

  // Drop Session (depends on User)
  await sql`
    IF OBJECT_ID(N'dbo.[Session]', N'U') IS NOT NULL
    BEGIN
      DROP TABLE dbo.[Session];
    END
  `.execute(db)

  // Drop Account (depends on User)
  await sql`
    IF OBJECT_ID(N'dbo.[Account]', N'U') IS NOT NULL
    BEGIN
      DROP TABLE dbo.[Account];
    END
  `.execute(db)

  // Drop User (base table)
  await sql`
    IF OBJECT_ID(N'dbo.[User]', N'U') IS NOT NULL
    BEGIN
      DROP TABLE dbo.[User];
    END
  `.execute(db)
}


