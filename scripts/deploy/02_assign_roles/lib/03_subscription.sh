#!/usr/bin/env bash
#
# Azure Subscription Management Library
#
# Purpose:
#   Handle Azure subscription selection and switching
#   Support both interactive and non-interactive modes
#

# Source utilities
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$SCRIPT_DIR/00_utils.sh"

# ============================================================================
# Subscription Management Function
# ============================================================================

# Set Azure subscription
# Uses SUBSCRIPTION_ID if provided, otherwise prompts user
# Sets global variable: SUBSCRIPTION_ID
# Returns 0 on success, exits with error on failure
set_subscription() {
  print_header "Azure Subscription"
  
  # Check if subscription ID was provided via command line
  if [ -n "${SUBSCRIPTION_ID:-}" ]; then
    print_info "Using subscription provided via --subscription: $SUBSCRIPTION_ID"
    # Set the subscription context explicitly
    if ! az account set --subscription "$SUBSCRIPTION_ID" 2>&1; then
      print_error "Failed to set subscription context to: $SUBSCRIPTION_ID"
      print_info "Please verify the subscription ID is correct"
      exit 1
    fi
    print_success "Subscription context set successfully"
  else
    # Get current subscription ID and name
    SUBSCRIPTION_ID=$(az account show --query id -o tsv 2>&1)
    if [ -z "$SUBSCRIPTION_ID" ] || [[ "$SUBSCRIPTION_ID" == *"ERROR"* ]]; then
      print_error "Failed to get current subscription"
      print_info "Please run: az login"
      exit 1
    fi
    
    CURRENT_SUB=$(az account show --query name -o tsv 2>&1)
    print_info "Current subscription: $CURRENT_SUB"
    print_info "Subscription ID: $SUBSCRIPTION_ID"
    
    # Ask with default to yes (just press Enter to continue)
    printf "Use this subscription? [Y/n]: "
    read -r response || true  # Prevent read from causing script exit
    
    case "$response" in
      [nN]|[nN][oO])
        # User wants to change subscription
        print_info "Available subscriptions:"
        az account list --query "[].{Name:name, ID:id, Default:isDefault}" -o table
        printf "\nEnter subscription ID: "
        read -r SUBSCRIPTION_ID || true  # Prevent read from causing script exit
        
        if ! az account set --subscription "$SUBSCRIPTION_ID" 2>&1; then
          print_error "Failed to set subscription context to: $SUBSCRIPTION_ID"
          exit 1
        fi
        print_success "Switched to subscription: $SUBSCRIPTION_ID"
        ;;
      *)
        # Empty or any other input = yes (default)
        # Still need to explicitly set the subscription context
        # Best practice: Always call az account set to ensure context is properly initialized
        if ! az account set --subscription "$SUBSCRIPTION_ID" 2>&1; then
          print_error "Failed to set subscription context to: $SUBSCRIPTION_ID"
          exit 1
        fi
        print_success "Using subscription: $CURRENT_SUB (ID: $SUBSCRIPTION_ID)"
        ;;
    esac
  fi
  
  # Verify the subscription was set correctly
  VERIFY_SUB=$(az account show --query id -o tsv 2>&1)
  if [ "$VERIFY_SUB" != "$SUBSCRIPTION_ID" ]; then
    print_warning "Subscription verification mismatch!"
    print_info "Expected: $SUBSCRIPTION_ID"
    print_info "Got: $VERIFY_SUB"
  else
    print_info "✓ Subscription context verified: $SUBSCRIPTION_ID"
  fi
  
  # Export for use in other scripts
  export SUBSCRIPTION_ID
}

