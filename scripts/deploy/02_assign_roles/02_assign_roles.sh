#!/usr/bin/env bash
#
# Azure Role Assignment Script - Main Orchestrator
#
# Purpose:
#   Assign necessary Azure RBAC roles for Container App managed identity
#   This script is separated from infrastructure deployment because role
#   assignments require elevated permissions (Owner or User Access Administrator)
#
# Usage:
#   bash scripts/deploy/02_assign_roles/02_assign_roles.sh [--yes] [--subscription <id>]
#
# Options:
#   --yes             Auto-confirm prompts (non-interactive mode)
#   --subscription    Azure subscription ID (optional)
#
# Note:
#   This script has been refactored into a modular architecture.
#   See README.md in this directory for details about the new structure.
#
# Prerequisites:
#   - Run 01_deploy_infrastructure.sh first
#   - .env.production file must exist
#   - User must have Owner or User Access Administrator role
#
# Architecture:
#   This is the main orchestrator that coordinates all role assignment steps.
#   Individual functionality is split into focused library files in lib/:
#   - 00_utils.sh         : Utility functions (printing, confirmation)
#   - 01_prerequisites.sh : Check prerequisites
#   - 02_config.sh        : Load configuration from .env.production
#   - 03_subscription.sh  : Handle Azure subscription selection
#   - 04_resources.sh     : Get resource information from Azure
#   - 05_permissions.sh   : Check user permissions
#   - 06_roles.sh         : Assign RBAC roles
#   - 07_verify.sh        : Verify role assignments
#

set -euo pipefail

# ============================================================================
# Change to Project Root Directory
# ============================================================================

# Get the directory where this script is located
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# Change to project root (three levels up from scripts/deploy/02_assign_roles/)
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../../.." && pwd)"
cd "$PROJECT_ROOT"

# ============================================================================
# Configuration
# ============================================================================

# Environment file to load configuration from
ENV_FILE=".env.production"
export ENV_FILE

# ============================================================================
# Parse Command Line Arguments
# ============================================================================

# Default values
AUTO_YES=false
SUBSCRIPTION_ID=""

# Parse arguments
while [ $# -gt 0 ]; do
  case "$1" in
    --yes)
      AUTO_YES=true
      shift
      ;;
    --subscription)
      SUBSCRIPTION_ID="$2"
      shift 2
      ;;
    *)
      printf "Unknown option: %s\n" "$1"
      printf "Usage: %s [--yes] [--subscription <id>]\n" "$0"
      exit 1
      ;;
  esac
done

# Export variables for use in library scripts
export AUTO_YES
export SUBSCRIPTION_ID

# ============================================================================
# Load Library Functions
# ============================================================================

# Get lib directory path
LIB_DIR="$SCRIPT_DIR/lib"

# Source all library files in execution order
source "$LIB_DIR/00_utils.sh"
source "$LIB_DIR/01_prerequisites.sh"
source "$LIB_DIR/02_config.sh"
source "$LIB_DIR/03_subscription.sh"
source "$LIB_DIR/04_resources.sh"
source "$LIB_DIR/05_permissions.sh"
source "$LIB_DIR/06_roles.sh"
source "$LIB_DIR/07_verify.sh"

# ============================================================================
# Summary Display
# ============================================================================

# Show summary of what was accomplished
show_summary() {
  print_header "Role Assignment Complete!"
  
  printf "✅ Assigned Roles:\n\n"
  printf "  1. AcrPull on %s\n" "$ACR_NAME"
  printf "     → Container App can pull Docker images\n\n"
  printf "  2. Key Vault Secrets User on %s\n" "$KEY_VAULT_NAME"
  printf "     → Container App can read secrets\n\n"
  
  printf "📝 Next Steps:\n\n"
  printf "  1. Wait 1-2 minutes for role propagation\n"
  printf "  2. Continue with: bash scripts/deploy/03_configure_stripe.sh\n"
  printf "\n"
}

# ============================================================================
# Main Orchestration Function
# ============================================================================

main() {
  print_header "Azure Role Assignment Script"
  
  # Execute all steps in order
  # Each function is defined in its respective library file
  check_prerequisites
  load_config
  set_subscription
  get_resource_info
  check_permissions
  assign_roles
  verify_roles
  show_summary
}

# ============================================================================
# Script Entry Point
# ============================================================================

# Run main function
main
