#!/usr/bin/env bash
#
# Database Setup and Migration Script
#
# Purpose:
#   Run Kysely migrations and check migration status for the database
#   Uses pnpm to execute TypeScript migration scripts
#
# Usage:
#   bash scripts/dev/02_db_setup.sh [command]
#
# Commands:
#   (no args)       - Run migrations to latest, then check status to verify
#   migrate         - Run migrations to latest only
#   check           - Check migration status only
#   migrate:down    - Migrate down one step
#   migrate:to <name> - Migrate to a specific migration name
#
# Prerequisites:
#   - pnpm must be installed
#   - Environment variables must be configured (.env.local or .env)
#   - Database server must be accessible
#

set -euo pipefail

# ============================================================================
# Change to Project Root Directory
# ============================================================================

# Get the directory where this script is located
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# Change to project root (two levels up from scripts/dev/)
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
cd "$PROJECT_ROOT"

echo "Working from project root: $PROJECT_ROOT"

# ============================================================================
# Source Library Modules (for styled output)
# ============================================================================

# Source utility functions if available
if [ -f "$SCRIPT_DIR/lib/utils.sh" ]; then
  source "$SCRIPT_DIR/lib/utils.sh"
  init_log
else
  # Fallback print functions if utils not available
  print_header() { echo -e "\n========== $1 ==========\n"; }
  print_info() { echo "[INFO] $1"; }
  print_success() { echo "[SUCCESS] $1"; }
  print_error() { echo "[ERROR] $1" >&2; }
  print_warning() { echo "[WARNING] $1"; }
fi

# ============================================================================
# Helper Functions
# ============================================================================

# Check if pnpm is installed
check_pnpm() {
  if ! command -v pnpm &> /dev/null; then
    print_error "pnpm is not installed"
    print_info "Install with: npm install -g pnpm"
    return 1
  fi
  return 0
}

# Check if environment file exists
check_env_file() {
  if [ -f ".env.local" ] || [ -f ".env" ] || [ -f ".env.production" ]; then
    return 0
  else
    print_warning "No environment file found (.env.local, .env, or .env.production)"
    print_info "Make sure database connection variables are set"
    return 1
  fi
}

# Check if required database environment variables are set (loads from env files)
check_db_env_vars() {
  print_info "Checking database environment variables..."
  
  # Load environment variables from .env.local or .env if they exist
  if [ -f ".env.local" ]; then
    export $(grep -v '^#' .env.local | xargs 2>/dev/null || true)
  elif [ -f ".env" ]; then
    export $(grep -v '^#' .env | xargs 2>/dev/null || true)
  fi
  
  local missing_vars=()
  
  # Check each required variable
  [ -z "$MSSQL_SERVER" ] && missing_vars+=("MSSQL_SERVER")
  [ -z "$MSSQL_DATABASE" ] && missing_vars+=("MSSQL_DATABASE")
  [ -z "$MSSQL_USER" ] && missing_vars+=("MSSQL_USER")
  [ -z "$MSSQL_PASSWORD" ] && missing_vars+=("MSSQL_PASSWORD")
  [ -z "$MSSQL_ENCRYPT" ] && missing_vars+=("MSSQL_ENCRYPT")
  
  if [ ${#missing_vars[@]} -gt 0 ]; then
    print_error "Missing required database environment variables:"
    for var in "${missing_vars[@]}"; do
      print_error "  - $var"
    done
    echo ""
    print_info "To fix this:"
    print_info "1. Create a .env.local file in the project root"
    print_info "2. Add the following variables:"
    echo ""
    echo "    MSSQL_SERVER=localhost"
    echo "    MSSQL_DATABASE=mydatabase"
    echo "    MSSQL_USER=sa"
    echo "    MSSQL_PASSWORD=YourPassword123!"
    echo "    MSSQL_ENCRYPT=false"
    echo ""
    print_info "For local SQL Server setup using Docker:"
    echo '    docker run -e "ACCEPT_EULA=Y" -e "MSSQL_SA_PASSWORD=YourPassword123!" \'
    echo '      -p 1433:1433 --name sqlserver -d mcr.microsoft.com/mssql/server:2022-latest'
    echo ""
    return 1
  fi
  
  print_success "All required database environment variables are set"
  return 0
}

# Check migration status
run_check_status() {
  print_header "Checking Migration Status"
  
  print_info "Running migration status check..."
  # Use absolute path to ensure correct file is found
  pnpm dlx tsx "$PROJECT_ROOT/kysely/check-migration-status.ts"
  
  print_success "Status check completed"
}

# Run migrations to latest
run_migrations() {
  print_header "Running Database Migrations"
  
  print_info "Migrating to latest version..."
  # Use absolute path to ensure correct file is found
  pnpm dlx tsx "$PROJECT_ROOT/kysely/migration-script.ts"
  
  print_success "Migrations completed successfully"
}

# Migrate down one step
run_migrate_down() {
  print_header "Rolling Back Last Migration"
  
  print_warning "This will revert the last applied migration"
  print_info "Running migrate:down..."
  # Use absolute path to ensure correct file is found
  pnpm dlx tsx "$PROJECT_ROOT/kysely/migration-script.ts" migrate:down
  
  print_success "Migration rolled back successfully"
}

# Migrate to specific version
run_migrate_to() {
  local migration_name="$1"
  print_header "Migrating to Specific Version"
  
  print_info "Migrating to: $migration_name"
  # Use absolute path to ensure correct file is found
  pnpm dlx tsx "$PROJECT_ROOT/kysely/migration-script.ts" migrate:to "$migration_name"
  
  print_success "Migration to $migration_name completed"
}

# ============================================================================
# Main Setup Process
# ============================================================================

main() {
  local command="${1:-default}"
  local arg="${2:-}"
  
  # Validate prerequisites
  if ! check_pnpm; then
    print_error "Cannot proceed without pnpm"
    exit 1
  fi
  
  # Check environment configuration (warning only)
  check_env_file || true
  
  # Check database environment variables (required for DB operations)
  if ! check_db_env_vars; then
    print_error "Cannot proceed without required database environment variables"
    exit 1
  fi
  
  # Execute based on command
  case "$command" in
    check)
      # Only check status
      run_check_status
      ;;
    
    migrate)
      # Only run migrations
      run_migrations
      ;;
    
    migrate:down)
      # Rollback last migration
      run_migrate_down
      ;;
    
    migrate:to)
      # Migrate to specific version
      if [ -z "$arg" ]; then
        print_error "Migration name required for migrate:to command"
        print_info "Usage: bash scripts/dev/02_db_setup.sh migrate:to <migration_name>"
        exit 1
      fi
      run_migrate_to "$arg"
      ;;
    
    default)
      # Default: run migrations first, then check status to verify
      run_migrations
      echo ""  # Add spacing between operations
      run_check_status
      ;;
    
    *)
      print_error "Unknown command: $command"
      print_info "Available commands:"
      print_info "  (no args)       - Run migrations, then check status"
      print_info "  check           - Check migration status only"
      print_info "  migrate         - Run migrations only"
      print_info "  migrate:down    - Rollback last migration"
      print_info "  migrate:to <name> - Migrate to specific version"
      exit 1
      ;;
  esac
  
  # Success message
  echo ""
  print_success "Database setup operation completed"
  echo ""
}

# Run main function with all arguments
main "$@"

