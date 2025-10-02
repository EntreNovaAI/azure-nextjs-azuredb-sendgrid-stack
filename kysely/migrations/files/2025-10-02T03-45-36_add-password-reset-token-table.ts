// Add PasswordResetToken table for password reset functionality
// This migration creates a table to store password reset tokens with expiration

import { Kysely, sql } from 'kysely'

export async function up(db: Kysely<any>): Promise<void> {
  // Create PasswordResetToken table and indexes in a single batch
  // This avoids transaction issues with multiple separate SQL execute statements
  await sql`
    -- Create the PasswordResetToken table if it doesn't exist
    IF NOT EXISTS (
      SELECT * FROM sys.objects 
      WHERE object_id = OBJECT_ID(N'dbo.[PasswordResetToken]') AND type IN (N'U')
    )
    BEGIN
      CREATE TABLE dbo.[PasswordResetToken] (
        id NVARCHAR(255) PRIMARY KEY,
        userId NVARCHAR(255) NOT NULL,
        token NVARCHAR(255) NOT NULL,
        expires DATETIME2 NOT NULL,
        used BIT NOT NULL DEFAULT 0,
        createdAt DATETIME2 NOT NULL DEFAULT (GETUTCDATE()),
        CONSTRAINT FK_PasswordResetToken_User FOREIGN KEY (userId) REFERENCES dbo.[User](id) ON DELETE CASCADE
      );
      
      -- Create indexes for better query performance
      CREATE INDEX IX_PasswordResetToken_userId ON dbo.[PasswordResetToken](userId);
      CREATE INDEX IX_PasswordResetToken_token ON dbo.[PasswordResetToken](token);
      CREATE INDEX IX_PasswordResetToken_expires ON dbo.[PasswordResetToken](expires);
    END
  `.execute(db)
}

export async function down(db: Kysely<any>): Promise<void> {
  // Drop the PasswordResetToken table if it exists
  // Indexes are automatically dropped when the table is dropped
  await sql`
    IF OBJECT_ID(N'dbo.[PasswordResetToken]', N'U') IS NOT NULL
    BEGIN
      DROP TABLE dbo.[PasswordResetToken];
    END
  `.execute(db)
}
