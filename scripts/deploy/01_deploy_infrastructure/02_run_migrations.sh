#!/usr/bin/env bash
#
# Database Migrations Script - Run Kysely Migrations Against Azure SQL
#
# Purpose:
#   Run database migrations to create all necessary tables in Azure SQL Database
#   This script should be run AFTER whitelisting your IP address in Azure Portal
#
# Prerequisites:
#   1. Infrastructure deployed (01_deploy_infrastructure.sh completed)
#   2. .env.production file exists with database credentials
#   3. IP address whitelisted in Azure SQL Server firewall
#   4. Node.js and pnpm installed
#
# Usage:
#   bash scripts/deploy/01_deploy_infrastructure/02_run_migrations.sh
#
# Why Separate Script?
#   Database migrations require network access to Azure SQL Database.
#   Azure SQL requires IP whitelisting in the firewall, which must be done
#   manually in the Azure Portal. This script runs AFTER that setup.
#

set -euo pipefail

# ============================================================================
# Change to Project Root Directory
# ============================================================================

# Get the directory where this script is located
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# Change to project root (three levels up from scripts/deploy/01_deploy_infrastructure/)
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../../.." && pwd)"
cd "$PROJECT_ROOT"

# ============================================================================
# Load Library Functions
# ============================================================================

# Get lib directory path
LIB_DIR="$SCRIPT_DIR/lib"

# Source utility and migration library files
source "$LIB_DIR/00_utils.sh"
source "$LIB_DIR/08_migrations.sh"

# ============================================================================
# Main Function
# ============================================================================

main() {
  print_header "Database Migrations"
  
  # ========================================================================
  # Pre-Migration Instructions
  # ========================================================================
  
  print_info "This script will create database tables using Kysely migrations"
  printf "\n"
  
  print_info "⚠️  PREREQUISITE: IP Address Whitelisting"
  print_info "Before running migrations, you must whitelist your IP address:"
  printf "\n"
  printf "  1. Open Azure Portal: https://portal.azure.com\n"
  printf "  2. Navigate to your SQL Server\n"
  printf "  3. Go to 'Networking' (or 'Firewalls and virtual networks')\n"
  printf "  4. Click 'Add your client IPv4 address'\n"
  printf "  5. Save the firewall rule\n"
  printf "\n"
  
  # Ask user to confirm they've whitelisted their IP
  print_warning "Have you whitelisted your IP address in Azure Portal?"
  printf "Press Enter to continue or Ctrl+C to exit: "
  read -r
  printf "\n"
  
  # ========================================================================
  # Run Migrations
  # ========================================================================
  
  # Run the migration function from 08_migrations.sh library
  # This handles all the migration logic including:
  # - Checking prerequisites (pnpm, Node.js, .env.production)
  # - Loading database credentials
  # - Testing database connection
  # - Running Kysely migrations
  # - Verifying migration status
  if run_database_migrations; then
    printf "\n"
    print_success "✅ Database migrations completed successfully!"
    printf "\n"
    print_info "Database tables created:"
    print_info "  ✓ User"
    print_info "  ✓ Account"
    print_info "  ✓ Session"
    print_info "  ✓ VerificationToken"
    print_info "  ✓ PasswordResetToken"
    printf "\n"
    print_info "Next Steps:"
    print_info "  Continue with: bash scripts/deploy/02_assign_roles/02_assign_roles.sh"
  else
    printf "\n"
    print_error "❌ Database migrations failed"
    printf "\n"
    print_info "Common issues:"
    print_info "  • IP address not whitelisted in Azure SQL Server firewall"
    print_info "  • Incorrect database credentials in .env.production"
    print_info "  • SQL Server not accessible from your network"
    printf "\n"
    print_info "Troubleshooting:"
    print_info "  1. Verify IP whitelisting in Azure Portal"
    print_info "  2. Check .env.production for correct credentials"
    print_info "  3. Ensure MSSQL_ENCRYPT=true for Azure SQL"
    print_info "  4. Try running manually: pnpm dlx tsx kysely/migration-script.ts"
    exit 1
  fi
}

# ============================================================================
# Script Entry Point
# ============================================================================

# Run main function
main

