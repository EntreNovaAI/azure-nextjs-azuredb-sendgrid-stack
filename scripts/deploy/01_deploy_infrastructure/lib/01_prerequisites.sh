#!/usr/bin/env bash
#
# Prerequisites Checking Library
#
# Purpose:
#   Check all prerequisites before running infrastructure deployment
#   - Azure CLI installation and login
#   - Bicep CLI installation
#   - Docker installation
#   - jq (optional but recommended)
#   - Bicep template file existence
#
# Uses variables from calling script:
#   - BICEP_TEMPLATE : Path to Bicep template file
#

# ============================================================================
# Prerequisites Check Function
# ============================================================================

# Check all prerequisites for infrastructure deployment
# Exits with error code 1 if any critical prerequisite is missing
check_prerequisites() {
  print_header "Checking Prerequisites"
  
  # Check for Azure CLI - CRITICAL
  if ! command -v az >/dev/null 2>&1; then
    print_error "Azure CLI is required but not installed."
    print_info "Install from: https://docs.microsoft.com/cli/azure/install-azure-cli"
    exit 1
  fi
  print_success "Azure CLI is installed"
  
  # Check Azure CLI login status - CRITICAL
  if ! az account show >/dev/null 2>&1; then
    print_error "Not logged in to Azure CLI"
    print_info "Run: az login"
    exit 1
  fi
  print_success "Logged in to Azure CLI"
  
  # Check for Bicep CLI - CRITICAL (will auto-install if missing)
  if ! az bicep version >/dev/null 2>&1; then
    print_warning "Bicep CLI not found. Installing..."
    az bicep install
    print_success "Bicep CLI installed"
  else
    print_success "Bicep CLI is installed"
  fi
  
  # Check for jq - OPTIONAL but recommended for better JSON parsing
  if ! command -v jq >/dev/null 2>&1; then
    print_warning "jq is not installed (recommended for better JSON parsing)"
    print_info "Install: brew install jq (macOS) or apt install jq (Linux)"
  else
    print_success "jq is installed"
  fi
  
  # Check for Docker - CRITICAL
  if ! command -v docker >/dev/null 2>&1; then
    print_error "Docker is required but not installed."
    print_info "Install Docker Desktop: https://www.docker.com/products/docker-desktop"
    exit 1
  fi
  print_success "Docker is installed"
  
  # Check if Bicep template exists - CRITICAL
  if [ ! -f "$BICEP_TEMPLATE" ]; then
    print_error "Bicep template not found: $BICEP_TEMPLATE"
    exit 1
  fi
  print_success "Bicep template found"
}


