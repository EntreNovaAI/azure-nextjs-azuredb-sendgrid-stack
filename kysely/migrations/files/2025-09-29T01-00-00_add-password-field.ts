// Add password field to User table for vanilla login support
// This migration adds a secure password field with proper indexing

import { Kysely, sql } from 'kysely'

export async function up(db: Kysely<any>): Promise<void> {
  // Add password field to User table
  // Using NVARCHAR(255) to store bcrypt hashed passwords (bcrypt produces 60-char strings)
  await sql`
    IF NOT EXISTS (
      SELECT * FROM sys.columns 
      WHERE object_id = OBJECT_ID(N'dbo.[User]') AND name = 'password'
    )
    BEGIN
      ALTER TABLE dbo.[User] 
      ADD password NVARCHAR(255) NULL;
    END
  `.execute(db)

  // Add index on email for faster login lookups (if not already exists)
  // This is important for vanilla login performance
  await sql`
    IF NOT EXISTS (
      SELECT * FROM sys.indexes 
      WHERE object_id = OBJECT_ID(N'dbo.[User]') AND name = 'IX_User_Email_Password'
    )
    BEGIN
      CREATE INDEX IX_User_Email_Password ON dbo.[User] (email) 
      WHERE email IS NOT NULL AND password IS NOT NULL;
    END
  `.execute(db)
}

export async function down(db: Kysely<any>): Promise<void> {
  // Drop the index first
  await sql`
    IF EXISTS (
      SELECT * FROM sys.indexes 
      WHERE object_id = OBJECT_ID(N'dbo.[User]') AND name = 'IX_User_Email_Password'
    )
    BEGIN
      DROP INDEX IX_User_Email_Password ON dbo.[User];
    END
  `.execute(db)

  // Remove password field from User table
  await sql`
    IF EXISTS (
      SELECT * FROM sys.columns 
      WHERE object_id = OBJECT_ID(N'dbo.[User]') AND name = 'password'
    )
    BEGIN
      ALTER TABLE dbo.[User] 
      DROP COLUMN password;
    END
  `.execute(db)
}
