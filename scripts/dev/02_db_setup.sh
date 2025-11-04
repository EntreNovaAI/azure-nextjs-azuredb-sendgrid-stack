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
#   (no args)       - Check migration status, then run migrations to latest
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

# Check migration status
run_check_status() {
  print_header "Checking Migration Status"
  
  print_info "Running migration status check..."
  pnpm dlx tsx kysely/check-migration-status.ts
  
  print_success "Status check completed"
}

# Run migrations to latest
run_migrations() {
  print_header "Running Database Migrations"
  
  print_info "Migrating to latest version..."
  pnpm dlx tsx kysely/migration-script.ts
  
  print_success "Migrations completed successfully"
}

# Migrate down one step
run_migrate_down() {
  print_header "Rolling Back Last Migration"
  
  print_warning "This will revert the last applied migration"
  print_info "Running migrate:down..."
  pnpm dlx tsx kysely/migration-script.ts migrate:down
  
  print_success "Migration rolled back successfully"
}

# Migrate to specific version
run_migrate_to() {
  local migration_name="$1"
  print_header "Migrating to Specific Version"
  
  print_info "Migrating to: $migration_name"
  pnpm dlx tsx kysely/migration-script.ts migrate:to "$migration_name"
  
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
      # Default: check status then migrate
      run_check_status
      echo ""  # Add spacing between operations
      run_migrations
      ;;
    
    *)
      print_error "Unknown command: $command"
      print_info "Available commands:"
      print_info "  (no args)       - Check status then migrate"
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

