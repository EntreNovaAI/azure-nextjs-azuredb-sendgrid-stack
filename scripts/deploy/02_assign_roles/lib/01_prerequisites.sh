#!/usr/bin/env bash
#
# Prerequisites Checking Library
#
# Purpose:
#   Check all prerequisites before running role assignment
#   - Azure CLI installation
#   - Azure CLI login status
#   - .env.production file existence
#

# Source utilities
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$SCRIPT_DIR/00_utils.sh"

# ============================================================================
# Prerequisites Check Function
# ============================================================================

# Check all prerequisites for role assignment
# Returns 0 on success, exits with error on failure
check_prerequisites() {
  print_header "Checking Prerequisites"
  
  # Check for Azure CLI
  if ! command -v az >/dev/null 2>&1; then
    print_error "Azure CLI is required but not installed."
    print_info "Install from: https://docs.microsoft.com/cli/azure/install-azure-cli"
    exit 1
  fi
  print_success "Azure CLI is installed"
  
  # Check Azure CLI login status
  if ! az account show >/dev/null 2>&1; then
    print_error "Not logged in to Azure CLI"
    print_info "Run: az login"
    exit 1
  fi
  print_success "Logged in to Azure CLI"
  
  # Check if .env.production exists
  # ENV_FILE should be set by calling script
  if [ ! -f "${ENV_FILE:-}" ]; then
    print_error "${ENV_FILE:-.env.production} not found"
    print_info "Run scripts/deploy/01_deploy_infrastructure.sh first"
    exit 1
  fi
  print_success "${ENV_FILE} found"
}

