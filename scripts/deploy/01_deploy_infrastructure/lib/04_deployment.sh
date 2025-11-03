#!/usr/bin/env bash
#
# Infrastructure Deployment Library
#
# Purpose:
#   Deploy Azure infrastructure using Bicep template
#   - Confirm deployment with user
#   - Execute Bicep deployment
#   - Handle deployment errors
#
# Uses variables from calling script:
#   - BICEP_TEMPLATE
#   - RESOURCE_GROUP
#   - PREFIX
#   - LOCATION
#   - SQL_ADMIN_USER
#   - SQL_ADMIN_PASSWORD
#   - SQL_SKU
#   - DEPLOY_STORAGE
#   - DEPLOY_OPENAI
#   - DEPLOY_PUBSUB
#   - DEPLOY_MONITORING
#
# Exports variables:
#   - DEPLOYMENT_OUTPUT : JSON output from deployment
#

# ============================================================================
# Infrastructure Deployment Function
# ============================================================================

# Deploy Azure infrastructure using Bicep
# Exits with error code 1 if deployment fails
deploy_infrastructure() {
  print_header "Deploying Infrastructure"
  
  # ========================================================================
  # Confirm Deployment
  # ========================================================================
  
  # Ask with default to yes (just press Enter to continue)
  printf "Proceed with deployment? [Y/n]: "
  read -r response
  
  case "$response" in
    [nN]|[nN][oO])
      # User explicitly said no
      print_info "Deployment cancelled by user"
      exit 0
      ;;
    *)
      # Empty or any other input = yes (default)
      ;;
  esac
  
  # ========================================================================
  # Execute Deployment
  # ========================================================================
  
  print_info "Starting deployment (this may take 5-10 minutes)..."
  printf "\n"
  
  # Deploy Bicep template and capture output
  DEPLOYMENT_OUTPUT=$(az deployment group create \
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
                 deployMonitoring="$DEPLOY_MONITORING" \
    --output json)
  
  # Check deployment status
  if [ $? -ne 0 ]; then
    print_error "Deployment failed"
    exit 1
  fi
  
  print_success "Infrastructure deployed successfully!"
  
  # Export deployment output for use in other modules
  export DEPLOYMENT_OUTPUT
}


