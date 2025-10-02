// Migration: Add PasswordResetToken table for password reset functionality (MSSQL/Azure SQL)
// We use raw T-SQL with IF NOT EXISTS to be idempotent on SQL Server.
// This table stores password reset tokens with expiry and usage flags.

import { Kysely, sql } from 'kysely'

export async function up(db: Kysely<any>): Promise<void> {
  // Create dbo.[PasswordResetToken] if it doesn't exist
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
      -- Useful index to invalidate existing unused tokens per user efficiently
      CREATE INDEX IX_PasswordResetToken_UserId_Used ON dbo.[PasswordResetToken] (userId, used);
    END
  `.execute(db)
}

export async function down(db: Kysely<any>): Promise<void> {
  // Drop dbo.[PasswordResetToken] if it exists
  await sql`
    IF OBJECT_ID(N'dbo.[PasswordResetToken]', N'U') IS NOT NULL
    BEGIN
      DROP TABLE dbo.[PasswordResetToken];
    END
  `.execute(db)
}


