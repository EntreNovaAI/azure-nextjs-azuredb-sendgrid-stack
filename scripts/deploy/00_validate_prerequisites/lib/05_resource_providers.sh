#!/usr/bin/env bash
#
# Azure Resource Providers Validation Library
#
# Purpose:
#   Check Azure resource provider registration status
#   - Microsoft.Sql
#   - Microsoft.ContainerRegistry
#   - Microsoft.App
#   - Microsoft.KeyVault
#   - Microsoft.OperationalInsights
#   - Microsoft.Insights
#
# Uses global variables from 00_utils.sh:
#   - VALIDATION_WARNINGS
#

# ============================================================================
# Resource Providers Check Function
# ============================================================================

# Check Azure resource provider registration
# Increments VALIDATION_WARNINGS for unregistered providers
# Note: This is a warning because providers can be auto-registered during deployment
check_resource_providers() {
  print_header "Checking Azure Resource Providers"
  
  # Check if Azure CLI is installed and logged in
  if ! command -v az >/dev/null 2>&1 || ! az account show >/dev/null 2>&1; then
    print_warning "Skipping resource provider check (not logged in)"
    return
  fi
  
  print_info "Checking required resource providers..."
  
  # List of required resource providers for this deployment
  local required_providers=(
    "Microsoft.Sql"
    "Microsoft.ContainerRegistry"
    "Microsoft.App"
    "Microsoft.KeyVault"
    "Microsoft.OperationalInsights"
    "Microsoft.Insights"
  )
  
  local unregistered=()
  
  # Check each provider's registration status
  for provider in "${required_providers[@]}"; do
    local state
    state=$(az provider show --namespace "$provider" --query registrationState -o tsv 2>/dev/null || echo "Unknown")
    
    if [ "$state" = "Registered" ]; then
      print_success "$provider: Registered"
    else
      print_warning "$provider: $state"
      unregistered+=("$provider")
    fi
  done
  
  # Show registration commands if any providers are unregistered
  if [ ${#unregistered[@]} -gt 0 ]; then
    printf "\n"
    print_warning "Some resource providers are not registered"
    print_info "Register them with:"
    for provider in "${unregistered[@]}"; do
      printf "  az provider register --namespace %s\n" "$provider"
    done
    print_info "Note: Registration may take a few minutes"
    VALIDATION_WARNINGS=$((VALIDATION_WARNINGS + 1))
  fi
}


