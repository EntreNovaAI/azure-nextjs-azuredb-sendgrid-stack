#!/usr/bin/env bash
#
# Azure Prerequisites Validation Script - Main Orchestrator
#
# Purpose:
#   Validate all prerequisites before running deployment scripts
#   Check tools, Azure login, permissions, and configurations
#
# Usage:
#   bash scripts/deploy/00_validate_prerequisites/00_validate_prerequisites.sh [OPTIONS]
#
# Options:
#   --check-only    Only validate, don't offer to install (default)
#   --json          Output results in JSON format
#   --help          Show this help message
#
# Exit Codes:
#   0 - All checks passed
#   1 - Critical errors found
#   2 - Only warnings found (can continue)
#
# Note:
#   This script has been refactored into a modular architecture.
#   See README.md in this directory for details about the new structure.
#
# Architecture:
#   This is the main orchestrator that coordinates all validation steps.
#   Individual checks are split into focused library files in lib/:
#   - 00_utils.sh              : Utility functions (printing, tracking)
#   - 01_cli_tools.sh          : Check CLI tools
#   - 02_azure_auth.sh         : Check Azure authentication
#   - 03_azure_permissions.sh  : Check Azure permissions
#   - 04_required_files.sh     : Check required project files
#   - 05_resource_providers.sh : Check Azure resource providers
#   - 06_environment.sh        : Check environment configuration
#   - 07_summary.sh            : Display validation summary
#

set -euo pipefail

# ============================================================================
# Parse Command-Line Arguments
# ============================================================================

CHECK_ONLY=true
JSON_OUTPUT=false
SHOW_HELP=false

while [ $# -gt 0 ]; do
  case "$1" in
    --check-only)
      CHECK_ONLY=true
      shift
      ;;
    --json)
      JSON_OUTPUT=true
      shift
      ;;
    --help|-h)
      SHOW_HELP=true
      shift
      ;;
    *)
      echo "Unknown option: $1"
      echo "Use --help for usage information"
      exit 1
      ;;
  esac
done

# Show help if requested
if [ "$SHOW_HELP" = true ]; then
  cat << 'EOF'
Azure Prerequisites Validation Script

Usage:
  bash scripts/deploy/00_validate_prerequisites/00_validate_prerequisites.sh [OPTIONS]

Options:
  --check-only    Only validate, don't offer to install (default)
  --json          Output results in JSON format
  --help, -h      Show this help message

Exit Codes:
  0 - All checks passed
  1 - Critical errors found
  2 - Only warnings found (can continue)

Examples:
  # Basic validation
  bash scripts/deploy/00_validate_prerequisites/00_validate_prerequisites.sh

  # JSON output for parsing
  bash scripts/deploy/00_validate_prerequisites/00_validate_prerequisites.sh --json

EOF
  exit 0
fi

# ============================================================================
# Change to Project Root Directory
# ============================================================================

# Get the directory where this script is located
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# Change to project root (three levels up from scripts/deploy/00_validate_prerequisites/)
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../../.." && pwd)"
cd "$PROJECT_ROOT"

if [ "$JSON_OUTPUT" = false ]; then
  echo "Working from project root: $PROJECT_ROOT"
fi

# ============================================================================
# Export Configuration Variables
# ============================================================================

# Export variables for use in library scripts
export JSON_OUTPUT
export CHECK_ONLY

# ============================================================================
# Load Library Functions
# ============================================================================

# Get lib directory path
LIB_DIR="$SCRIPT_DIR/lib"

# Source all library files in execution order
source "$LIB_DIR/00_utils.sh"
source "$LIB_DIR/01_cli_tools.sh"
source "$LIB_DIR/02_azure_auth.sh"
source "$LIB_DIR/03_azure_permissions.sh"
source "$LIB_DIR/04_required_files.sh"
source "$LIB_DIR/05_resource_providers.sh"
source "$LIB_DIR/06_environment.sh"
source "$LIB_DIR/07_summary.sh"

# ============================================================================
# Main Orchestration Function
# ============================================================================

main() {
  print_header "Azure Deployment Prerequisites Validation"
  
  # Execute all validation checks in order
  # Each function is defined in its respective library file
  check_cli_tools
  check_azure_auth
  check_azure_permissions
  check_required_files
  check_resource_providers
  check_environment
  
  # Display summary and exit with appropriate code
  show_summary
}

# ============================================================================
# Script Entry Point
# ============================================================================

# Run main function
main


