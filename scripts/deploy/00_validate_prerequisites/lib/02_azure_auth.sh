#!/usr/bin/env bash
#
# Azure Authentication Validation Library
#
# Purpose:
#   Check Azure CLI authentication status and subscription details
#   - Verify user is logged in
#   - Display current account and subscription
#   - Warn about multiple subscriptions
#
# Uses global variables from 00_utils.sh:
#   - VALIDATION_ERRORS
#   - VALIDATION_WARNINGS
#

# ============================================================================
# Azure Authentication Check Function
# ============================================================================

# Check Azure CLI authentication status
# Increments VALIDATION_ERRORS if not logged in
# Increments VALIDATION_WARNINGS if multiple subscriptions found
check_azure_auth() {
  print_header "Checking Azure Authentication"
  
  # Check if Azure CLI is installed first
  if ! command -v az >/dev/null 2>&1; then
    print_error "Azure CLI not installed, skipping authentication check"
    return
  fi
  
  # Check login status
  if az account show >/dev/null 2>&1; then
    print_success "Logged in to Azure CLI"
    
    # Get account info
    local account_name
    local subscription_id
    account_name=$(az account show --query name -o tsv)
    subscription_id=$(az account show --query id -o tsv)
    
    print_info "Account: $account_name"
    print_info "Subscription: $subscription_id"
    
    # Check for multiple subscriptions
    local subscription_count
    subscription_count=$(az account list --query "length([])" -o tsv)
    if [ "$subscription_count" -gt 1 ]; then
      print_warning "You have $subscription_count subscriptions"
      print_info "Make sure you're using the correct one"
      print_info "List subscriptions: az account list"
      print_info "Switch subscription: az account set --subscription <id>"
    fi
  else
    print_error "Not logged in to Azure CLI"
    print_info "Run: az login"
    VALIDATION_ERRORS=$((VALIDATION_ERRORS + 1))
  fi
}


