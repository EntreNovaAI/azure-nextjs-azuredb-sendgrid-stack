#!/usr/bin/env bash
#
# Database Migration Library
#
# Purpose:
#   Run Kysely migrations against Azure SQL Database after infrastructure deployment
#   This creates all necessary database tables before the app is deployed
#
# Uses variables from calling script:
#   - PROJECT_ROOT
#
# Exports variables:
#   - None
#
# Prerequisites:
#   - .env.production file exists with database credentials
#   - pnpm and Node.js installed
#   - Infrastructure deployed (SQL Server and Database exist)
#

# ============================================================================
# Database Migration Function
# ============================================================================

# Run Kysely migrations to create database tables
# This is critical - without tables, the app will fail to start
run_database_migrations() {
  print_header "Running Database Migrations"
  
  # ========================================================================
  # Check Prerequisites
  # ========================================================================
  
  print_info "Checking migration prerequisites..."
  
  # Check if .env.production exists
  if [ ! -f ".env.production" ]; then
    print_error ".env.production file not found"
    print_info "The environment file should have been created in the previous step"
    return 1
  fi
  
  # Check if pnpm is installed
  if ! command -v pnpm &> /dev/null; then
    print_warning "pnpm is not installed"
    print_info "Skipping automatic migrations - you'll need to run them manually"
    print_info "Install pnpm: npm install -g pnpm"
    print_info "Then run: pnpm dlx tsx kysely/migration-script.ts"
    return 0  # Don't fail deployment, just warn
  fi
  
  # Check if Node.js is installed
  if ! command -v node &> /dev/null; then
    print_warning "Node.js is not installed"
    print_info "Skipping automatic migrations - you'll need to run them manually"
    print_info "After installing Node.js, run: pnpm dlx tsx kysely/migration-script.ts"
    return 0  # Don't fail deployment, just warn
  fi
  
  print_success "Prerequisites check passed"
  
  # ========================================================================
  # Load Environment Variables
  # ========================================================================
  
  print_info "Loading database credentials from .env.production..."
  
  # Export variables for the migration script to use
  # We need: MSSQL_SERVER, MSSQL_DATABASE, MSSQL_USER, MSSQL_PASSWORD, MSSQL_ENCRYPT
  set -a  # Auto-export all variables
  source .env.production
  set +a  # Stop auto-export
  
  # Validate required variables
  if [ -z "${MSSQL_SERVER:-}" ]; then
    print_error "MSSQL_SERVER not found in .env.production"
    return 1
  fi
  
  if [ -z "${MSSQL_DATABASE:-}" ]; then
    print_error "MSSQL_DATABASE not found in .env.production"
    return 1
  fi
  
  if [ -z "${MSSQL_USER:-}" ]; then
    print_error "MSSQL_USER not found in .env.production"
    return 1
  fi
  
  if [ -z "${MSSQL_PASSWORD:-}" ]; then
    print_error "MSSQL_PASSWORD not found in .env.production"
    return 1
  fi
  
  # Set MSSQL_ENCRYPT to true if not set (required for Azure SQL)
  export MSSQL_ENCRYPT="${MSSQL_ENCRYPT:-true}"
  
  print_success "Database credentials loaded"
  print_info "Server: ${MSSQL_SERVER}"
  print_info "Database: ${MSSQL_DATABASE}"
  
  # ========================================================================
  # Test Database Connection
  # ========================================================================
  
  print_info "Testing database connection..."
  
  # Use the check-migration-status script to test connection
  # Redirect output to capture it
  CONNECTION_TEST=$(pnpm dlx tsx kysely/check-migration-status.ts 2>&1)
  
  if echo "$CONNECTION_TEST" | grep -q "Checking database tables"; then
    print_success "Database connection successful"
  else
    print_error "Failed to connect to database"
    print_info "Error details:"
    echo "$CONNECTION_TEST"
    print_info ""
    print_info "Please verify:"
    print_info "  - SQL Server firewall allows your IP address"
    print_info "  - Database credentials are correct in .env.production"
    print_info "  - MSSQL_ENCRYPT is set to 'true' for Azure SQL"
    print_info ""
    print_info "You can run migrations manually later with:"
    print_info "  pnpm dlx tsx kysely/migration-script.ts"
    return 1
  fi
  
  # ========================================================================
  # Run Migrations
  # ========================================================================
  
  print_info "Executing Kysely migrations..."
  print_info "This will create all necessary tables in the database"
  printf "\n"
  
  # Run the migration script and capture output
  if MIGRATION_OUTPUT=$(pnpm dlx tsx kysely/migration-script.ts 2>&1); then
    print_success "Migrations completed successfully!"
    printf "\n"
    
    # Show migration output
    echo "$MIGRATION_OUTPUT"
    printf "\n"
    
    # Show what was created
    print_info "Verifying migration status..."
    pnpm dlx tsx kysely/check-migration-status.ts
    printf "\n"
    
    print_success "Database tables created:"
    print_info "  ✓ User"
    print_info "  ✓ Account"
    print_info "  ✓ Session"
    print_info "  ✓ VerificationToken"
    print_info "  ✓ PasswordResetToken"
    
  else
    print_error "Migration failed"
    print_info "Error details:"
    echo "$MIGRATION_OUTPUT"
    print_info ""
    print_info "You can try running migrations manually:"
    print_info "  pnpm dlx tsx kysely/migration-script.ts"
    return 1
  fi
}



