#!/usr/bin/env bash
#
# Azure Permissions Validation Library
#
# Purpose:
#   Check Azure permissions for deployment
#   - Verify can list resource groups (Reader role)
#   - Note about Contributor/Owner requirement for deployment
#
# Uses global variables from 00_utils.sh:
#   - VALIDATION_ERRORS
#

# ============================================================================
# Azure Permissions Check Function
# ============================================================================

# Check Azure permissions for deployment
# Increments VALIDATION_ERRORS if cannot list resource groups
check_azure_permissions() {
  print_header "Checking Azure Permissions"
  
  # Check if Azure CLI is installed and logged in
  if ! command -v az >/dev/null 2>&1 || ! az account show >/dev/null 2>&1; then
    print_warning "Skipping permissions check (not logged in)"
    return
  fi
  
  print_info "Checking required permissions..."
  
  # Try to list resource groups (basic permission check)
  # This tests if user has at least Reader role
  if az group list --output none 2>/dev/null; then
    print_success "Can list resource groups"
  else
    print_error "Cannot list resource groups"
    print_info "You need at least Reader role on the subscription"
    VALIDATION_ERRORS=$((VALIDATION_ERRORS + 1))
  fi
  
  # Inform about deployment requirements
  # We can't easily check for Contributor/Owner without attempting to create resources
  print_info "Note: Deployment requires Contributor or Owner role"
  print_info "Verify permissions in Azure Portal: Subscriptions > Access Control (IAM)"
}


