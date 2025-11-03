#!/usr/bin/env bash
#
# CLI Tools Validation Library
#
# Purpose:
#   Check for required command-line tools
#   - Azure CLI
#   - Bicep CLI
#   - Stripe CLI (optional)
#   - Docker
#   - jq (optional)
#   - curl
#   - openssl
#
# Uses global variables from 00_utils.sh:
#   - VALIDATION_ERRORS
#   - VALIDATION_WARNINGS
#

# ============================================================================
# CLI Tools Check Function
# ============================================================================

# Check all required command-line tools
# Increments VALIDATION_ERRORS for missing critical tools
# Increments VALIDATION_WARNINGS for missing optional tools
check_cli_tools() {
  print_header "Checking Command-Line Tools"
  
  # Azure CLI - CRITICAL
  if command -v az >/dev/null 2>&1; then
    local az_version
    az_version=$(az version --query '"azure-cli"' -o tsv)
    print_success "Azure CLI: $az_version"
  else
    print_error "Azure CLI is not installed"
    print_info "Install from: https://docs.microsoft.com/cli/azure/install-azure-cli"
    VALIDATION_ERRORS=$((VALIDATION_ERRORS + 1))
  fi
  
  # Bicep CLI - CRITICAL
  if command -v az >/dev/null 2>&1 && az bicep version >/dev/null 2>&1; then
    local bicep_version
    bicep_version=$(az bicep version | grep -o 'version [0-9.]*' | cut -d' ' -f2)
    print_success "Bicep CLI: $bicep_version"
  else
    print_error "Bicep CLI is not installed"
    print_info "Run: az bicep install"
    VALIDATION_ERRORS=$((VALIDATION_ERRORS + 1))
  fi
  
  # Stripe CLI - OPTIONAL but recommended
  if command -v stripe >/dev/null 2>&1; then
    local stripe_version
    stripe_version=$(stripe version | head -1)
    print_success "Stripe CLI: $stripe_version"
  else
    print_warning "Stripe CLI is not installed (optional)"
    print_info "Install from: https://stripe.com/docs/stripe-cli"
    VALIDATION_WARNINGS=$((VALIDATION_WARNINGS + 1))
  fi
  
  # Docker - CRITICAL
  if command -v docker >/dev/null 2>&1; then
    local docker_version
    docker_version=$(docker --version | cut -d' ' -f3 | tr -d ',')
    print_success "Docker: $docker_version"
    
    # Check if Docker daemon is running
    if docker info >/dev/null 2>&1; then
      print_success "Docker daemon is running"
    else
      print_error "Docker daemon is not running"
      print_info "Start Docker Desktop or Docker service"
      VALIDATION_ERRORS=$((VALIDATION_ERRORS + 1))
    fi
  else
    print_error "Docker is not installed"
    print_info "Install Docker Desktop: https://www.docker.com/products/docker-desktop"
    VALIDATION_ERRORS=$((VALIDATION_ERRORS + 1))
  fi
  
  # jq - OPTIONAL but helpful for JSON parsing
  if command -v jq >/dev/null 2>&1; then
    local jq_version
    jq_version=$(jq --version)
    print_success "jq: $jq_version"
  else
    print_warning "jq is not installed (recommended for better JSON parsing)"
    print_info "macOS: brew install jq | Linux: apt install jq | Windows: choco install jq"
    VALIDATION_WARNINGS=$((VALIDATION_WARNINGS + 1))
  fi
  
  # curl - CRITICAL (usually pre-installed on most systems)
  if command -v curl >/dev/null 2>&1; then
    print_success "curl is installed"
  else
    print_error "curl is not installed"
    VALIDATION_ERRORS=$((VALIDATION_ERRORS + 1))
  fi
  
  # openssl - OPTIONAL but needed for generating secrets
  if command -v openssl >/dev/null 2>&1; then
    print_success "openssl is installed"
  else
    print_warning "openssl is not installed (needed for generating secrets)"
    VALIDATION_WARNINGS=$((VALIDATION_WARNINGS + 1))
  fi
}


