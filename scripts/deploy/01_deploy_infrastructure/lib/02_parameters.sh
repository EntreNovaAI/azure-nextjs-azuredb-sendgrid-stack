#!/usr/bin/env bash
#
# Parameter Collection Library
#
# Purpose:
#   Collect all deployment parameters from user input
#   - Azure subscription selection
#   - Resource group and location
#   - Resource name prefix
#   - SQL Database credentials and SKU
#   - Optional services (Storage, OpenAI, PubSub, Monitoring)
#
# Exports variables:
#   - RESOURCE_GROUP
#   - LOCATION
#   - PREFIX
#   - SQL_ADMIN_USER
#   - SQL_ADMIN_PASSWORD
#   - SQL_SKU
#   - DEPLOY_STORAGE
#   - DEPLOY_OPENAI
#   - DEPLOY_PUBSUB
#   - DEPLOY_MONITORING
#
# Uses variables from calling script:
#   - SUBSCRIPTION_ID (optional)
#   - DEFAULT_RESOURCE_GROUP
#   - DEFAULT_LOCATION
#   - DEFAULT_PREFIX
#   - DEFAULT_SQL_ADMIN_USER
#   - DEFAULT_SQL_SKU
#

# ============================================================================
# Parameter Collection Function
# ============================================================================

# Collect all deployment parameters from user
# Sets exported variables for use in deployment
collect_parameters() {
  print_header "Collect Deployment Parameters"
  
  # ========================================================================
  # Azure Subscription Selection
  # ========================================================================
  
  if [ -n "$SUBSCRIPTION_ID" ]; then
    # Subscription provided via command line
    print_info "Using subscription: $SUBSCRIPTION_ID"
    az account set --subscription "$SUBSCRIPTION_ID"
  else
    # Show current subscription and ask if user wants to use it
    CURRENT_SUB=$(az account show --query name -o tsv)
    print_info "Current subscription: $CURRENT_SUB"
    
    # Ask with default to yes (just press Enter to continue)
    printf "Use this subscription? [Y/n]: "
    read -r response
    
    case "$response" in
      [nN]|[nN][oO])
        # User wants to change subscription
        print_info "Available subscriptions:"
        az account list --query "[].{Name:name, ID:id, Default:isDefault}" -o table
        printf "\nEnter subscription ID: "
        read -r SUBSCRIPTION_ID
        az account set --subscription "$SUBSCRIPTION_ID"
        print_success "Switched to subscription: $SUBSCRIPTION_ID"
        ;;
      *)
        # Empty or any other input = yes (default)
        print_success "Using subscription: $CURRENT_SUB"
        ;;
    esac
  fi
  
  # ========================================================================
  # Resource Group and Location
  # ========================================================================
  
  printf "\n"
  print_info "Resource configuration"
  printf "\n"
  printf "📦 Resource Group: A container that holds all your Azure resources\n"
  printf "   (Like a folder name - doesn't affect individual resource names)\n"
  RESOURCE_GROUP=$(read_with_default "Resource group name" "$DEFAULT_RESOURCE_GROUP")
  
  LOCATION=$(read_with_default "Azure region" "$DEFAULT_LOCATION")
  
  # ========================================================================
  # Resource Name Prefix
  # ========================================================================
  
  printf "\n"
  printf "🏷️  Prefix: Used to name individual resources inside the resource group\n"
  printf "   Example: 'enova' creates resources like 'enova-sql-abc12', 'enova-app', etc.\n"
  printf "   (This is separate from the resource group name above)\n"
  printf "   Note: Keep it short (≤15 chars) to fit Azure Key Vault's 24-char limit\n"
  
  while true; do
    PREFIX=$(read_with_default "Resource name prefix (3-15 lowercase alphanumeric)" "$DEFAULT_PREFIX")
    
    # Validate prefix length
    if [[ ${#PREFIX} -lt 3 || ${#PREFIX} -gt 15 ]]; then
      print_error "Prefix must be 3-15 characters"
      continue
    fi
    
    # Validate prefix format (lowercase alphanumeric only)
    if [[ ! "$PREFIX" =~ ^[a-z0-9]+$ ]]; then
      print_error "Prefix must contain only lowercase letters and numbers"
      continue
    fi
    
    # Validate Key Vault naming constraint (24 chars max)
    # Format: {prefix}-kv-{5-char-suffix} = prefix + 4 + 5 = prefix + 9
    # So: prefix length + 9 ≤ 24, meaning prefix ≤ 15 chars
    local kv_name_length=$((${#PREFIX} + 9))
    if [[ $kv_name_length -gt 24 ]]; then
      print_error "Prefix '$PREFIX' is too long (${#PREFIX} chars)"
      print_error "Key Vault name would be $kv_name_length chars (max: 24)"
      print_error "Use a prefix with 15 characters or less"
      continue
    fi
    
    # Warn if prefix is getting close to the limit
    if [[ ${#PREFIX} -gt 12 ]]; then
      print_warning "Prefix '$PREFIX' is ${#PREFIX} characters (close to 15-char limit)"
      print_info "Shorter prefixes (e.g., 'enova') are recommended for clarity"
    fi
    
    break
  done
  
  # ========================================================================
  # SQL Database Configuration
  # ========================================================================
  
  printf "\n"
  print_info "SQL Database admin credentials"
  SQL_ADMIN_USER=$(read_with_default "SQL admin username" "$DEFAULT_SQL_ADMIN_USER")
  
  printf "\n"
  print_info "Enter SQL admin password (minimum 8 characters, input will be hidden)"
  SQL_ADMIN_PASSWORD=$(read_password "SQL admin password")
  
  printf "\n"
  print_info "SQL Database SKU (Basic = ~\$5/month, S0 = ~\$15/month, S1 = ~\$30/month)"
  print_warning "Note: Prices vary by region. DTU-based pricing shown; vCore pricing available."
  SQL_SKU=$(read_with_default "SQL Database SKU [Basic/S0/S1]" "$DEFAULT_SQL_SKU")
  
  # ========================================================================
  # Optional Services
  # ========================================================================
  
  printf "\n"
  print_info "Optional services (all default to 'no' - press Enter to skip)"
  
  # Azure Storage Account
  DEPLOY_STORAGE="false"
  if confirm "Deploy Azure Storage Account? (~\$0.02/GB/month for Hot LRS, varies by tier) [default: no]"; then
    DEPLOY_STORAGE="true"
  fi
  
  # Azure OpenAI
  DEPLOY_OPENAI="false"
  if confirm "Deploy Azure OpenAI? (requires approval) [default: no]"; then
    DEPLOY_OPENAI="true"
  fi
  
  # Azure Web PubSub
  DEPLOY_PUBSUB="false"
  if confirm "Deploy Azure Web PubSub? (~\$1/unit/day Standard tier, varies by region) [default: no]"; then
    DEPLOY_PUBSUB="true"
  fi
  
  # Application Insights Monitoring
  DEPLOY_MONITORING="false"
  if confirm "Deploy Application Insights monitoring? (recommended, free tier: 5GB/month) [default: no]"; then
    DEPLOY_MONITORING="true"
  fi
  
  # Export variables for use in other modules
  export RESOURCE_GROUP
  export LOCATION
  export PREFIX
  export SQL_ADMIN_USER
  export SQL_ADMIN_PASSWORD
  export SQL_SKU
  export DEPLOY_STORAGE
  export DEPLOY_OPENAI
  export DEPLOY_PUBSUB
  export DEPLOY_MONITORING
}

# ============================================================================
# Deployment Summary Display Function
# ============================================================================

# Display summary of collected parameters before deployment
show_deployment_summary() {
  print_header "Deployment Summary"
  
  printf "Resource Group:      %s\n" "$RESOURCE_GROUP"
  printf "Location:            %s\n" "$LOCATION"
  printf "Prefix:              %s\n" "$PREFIX"
  printf "SQL Admin User:      %s\n" "$SQL_ADMIN_USER"
  printf "SQL Database SKU:    %s\n" "$SQL_SKU"
  printf "Deploy Storage:      %s\n" "$DEPLOY_STORAGE"
  printf "Deploy OpenAI:       %s\n" "$DEPLOY_OPENAI"
  printf "Deploy Web PubSub:   %s\n" "$DEPLOY_PUBSUB"
  printf "Deploy Monitoring:   %s\n" "$DEPLOY_MONITORING"
  printf "\n"
  
  print_warning "Estimated monthly cost: \$10-50 depending on usage"
  print_info "Most resources use consumption-based pricing"
  printf "\n"
}


