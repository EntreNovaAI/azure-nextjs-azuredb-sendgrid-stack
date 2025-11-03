#!/usr/bin/env bash
#
# Configuration Loading Library
#
# Purpose:
#   Load configuration from .env.production file
#   Extract resource names needed for role assignment
#

# Source utilities
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$SCRIPT_DIR/00_utils.sh"

# ============================================================================
# Configuration Loading Function
# ============================================================================

# Load configuration from .env.production
# Sets global variables:
#   - ACR_NAME
#   - KEY_VAULT_NAME
#   - CONTAINER_APP_NAME
# Returns 0 on success, exits with error on failure
load_config() {
  print_header "Loading Configuration"
  
  # ENV_FILE should be set by calling script
  local env_file="${ENV_FILE:-.env.production}"
  
  # Read ACR name
  if ! ACR_NAME=$(grep "^ACR_NAME=" "$env_file" | cut -d '=' -f2); then
    print_error "ACR_NAME not found in $env_file"
    exit 1
  fi
  
  # Read Key Vault name
  if ! KEY_VAULT_NAME=$(grep "^KEY_VAULT_NAME=" "$env_file" | cut -d '=' -f2); then
    print_error "KEY_VAULT_NAME not found in $env_file"
    exit 1
  fi
  
  # Read Container App name
  if ! CONTAINER_APP_NAME=$(grep "^CONTAINER_APP_NAME=" "$env_file" | cut -d '=' -f2); then
    print_error "CONTAINER_APP_NAME not found in $env_file"
    exit 1
  fi
  
  # Export variables for use in other scripts
  export ACR_NAME
  export KEY_VAULT_NAME
  export CONTAINER_APP_NAME
  
  print_success "Configuration loaded"
  print_info "ACR Name: $ACR_NAME"
  print_info "Key Vault Name: $KEY_VAULT_NAME"
  print_info "Container App Name: $CONTAINER_APP_NAME"
}

