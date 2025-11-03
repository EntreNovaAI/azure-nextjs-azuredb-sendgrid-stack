#!/usr/bin/env bash
#
# Bicep Validation Library
#
# Purpose:
#   Validate Bicep template and run what-if analysis
#   - Lint Bicep template
#   - Create resource group if needed
#   - Run what-if analysis to preview changes
#
# Uses variables from calling script:
#   - BICEP_TEMPLATE
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

# ============================================================================
# Bicep Validation Function
# ============================================================================

# Validate Bicep template and run what-if analysis
# Exits with error code 1 if validation fails
validate_bicep() {
  print_header "Validating Bicep Template"
  
  # ========================================================================
  # Lint Bicep Template
  # ========================================================================
  
  print_info "Running bicep lint..."
  if az bicep build --file "$BICEP_TEMPLATE" > /dev/null 2>&1; then
    print_success "Bicep template is valid"
  else
    print_error "Bicep template has errors"
    az bicep build --file "$BICEP_TEMPLATE"
    exit 1
  fi
  
  # ========================================================================
  # Create Resource Group if Needed
  # ========================================================================
  
  if ! az group show --name "$RESOURCE_GROUP" >/dev/null 2>&1; then
    print_info "Creating resource group: $RESOURCE_GROUP"
    az group create --name "$RESOURCE_GROUP" --location "$LOCATION" --output none
    print_success "Resource group created"
  else
    print_info "Resource group already exists: $RESOURCE_GROUP"
  fi
  
  # ========================================================================
  # What-If Analysis
  # ========================================================================
  
  print_info "Running what-if analysis (this may take a minute)..."
  
  # Ask user if they want to run what-if (recommended)
  printf "Run what-if analysis? (recommended to see planned changes) [Y/n]: "
  read -r response
  
  case "$response" in
    [nN]|[nN][oO])
      # User skips what-if
      print_warning "Skipping what-if analysis"
      return 0
      ;;
    *)
      # Empty or any other input = yes (default)
      az deployment group what-if \
        --resource-group "$RESOURCE_GROUP" \
        --template-file "$BICEP_TEMPLATE" \
        --parameters prefix="$PREFIX" \
                     location="$LOCATION" \
                     sqlAdminUsername="$SQL_ADMIN_USER" \
                     sqlAdminPassword="$SQL_ADMIN_PASSWORD" \
                     sqlDatabaseSku="$SQL_SKU" \
                     deployStorage="$DEPLOY_STORAGE" \
                     deployOpenAI="$DEPLOY_OPENAI" \
                     deployWebPubSub="$DEPLOY_PUBSUB" \
                     deployMonitoring="$DEPLOY_MONITORING"
      
      printf "\n"
      ;;
  esac
}


