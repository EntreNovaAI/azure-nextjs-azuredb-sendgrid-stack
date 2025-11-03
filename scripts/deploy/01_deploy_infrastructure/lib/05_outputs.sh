#!/usr/bin/env bash
#
# Deployment Outputs Extraction Library
#
# Purpose:
#   Extract outputs from Azure deployment
#   - Parse deployment output JSON
#   - Extract critical resource information
#   - Validate extracted values
#   - Handle optional resource outputs
#
# Uses variables from calling script:
#   - DEPLOYMENT_OUTPUT : JSON output from deployment
#   - RESOURCE_GROUP
#   - DEPLOY_STORAGE
#   - DEPLOY_OPENAI
#   - DEPLOY_PUBSUB
#   - DEPLOY_MONITORING
#
# Exports variables:
#   - SQL_SERVER_FQDN
#   - SQL_DATABASE_NAME
#   - ACR_LOGIN_SERVER
#   - ACR_NAME
#   - CONTAINER_APP_NAME
#   - CONTAINER_APP_ENV_ID
#   - KEY_VAULT_NAME
#   - KEY_VAULT_URI
#   - STORAGE_CONN_STRING (if deployed)
#   - OPENAI_ENDPOINT (if deployed)
#   - OPENAI_API_KEY (if deployed)
#   - PUBSUB_CONN_STRING (if deployed)
#   - APP_INSIGHTS_CONN_STRING (if deployed)
#

# ============================================================================
# Output Extraction Function
# ============================================================================

# Extract deployment outputs from JSON
# Exits with error code 1 if critical outputs are missing
extract_outputs() {
  print_header "Extracting Deployment Outputs"
  
  # ========================================================================
  # Parse Outputs
  # ========================================================================
  
  # Parse outputs with jq if available, otherwise use fallback
  if command -v jq >/dev/null 2>&1; then
    # Use jq for robust JSON parsing
    SQL_SERVER_FQDN=$(printf "%s" "$DEPLOYMENT_OUTPUT" | jq -r '.properties.outputs.sqlServerFqdn.value')
    SQL_DATABASE_NAME=$(printf "%s" "$DEPLOYMENT_OUTPUT" | jq -r '.properties.outputs.sqlDatabaseName.value')
    ACR_LOGIN_SERVER=$(printf "%s" "$DEPLOYMENT_OUTPUT" | jq -r '.properties.outputs.acrLoginServer.value')
    ACR_NAME=$(printf "%s" "$DEPLOYMENT_OUTPUT" | jq -r '.properties.outputs.acrName.value')
    CONTAINER_APP_NAME=$(printf "%s" "$DEPLOYMENT_OUTPUT" | jq -r '.properties.outputs.containerAppName.value')
    CONTAINER_APP_ENV_ID=$(printf "%s" "$DEPLOYMENT_OUTPUT" | jq -r '.properties.outputs.containerAppEnvId.value')
    MANAGED_IDENTITY_ID=$(printf "%s" "$DEPLOYMENT_OUTPUT" | jq -r '.properties.outputs.containerAppIdentityId.value')
    KEY_VAULT_NAME=$(printf "%s" "$DEPLOYMENT_OUTPUT" | jq -r '.properties.outputs.keyVaultName.value')
    KEY_VAULT_URI=$(printf "%s" "$DEPLOYMENT_OUTPUT" | jq -r '.properties.outputs.keyVaultUri.value')
    
    # Optional outputs (may be null if not deployed)
    STORAGE_CONN_STRING=$(printf "%s" "$DEPLOYMENT_OUTPUT" | jq -r '.properties.outputs.storageConnectionString.value // ""')
    OPENAI_ENDPOINT=$(printf "%s" "$DEPLOYMENT_OUTPUT" | jq -r '.properties.outputs.openAIEndpoint.value // ""')
    OPENAI_API_KEY=$(printf "%s" "$DEPLOYMENT_OUTPUT" | jq -r '.properties.outputs.openAIApiKey.value // ""')
    PUBSUB_CONN_STRING=$(printf "%s" "$DEPLOYMENT_OUTPUT" | jq -r '.properties.outputs.webPubSubConnectionString.value // ""')
    APP_INSIGHTS_CONN_STRING=$(printf "%s" "$DEPLOYMENT_OUTPUT" | jq -r '.properties.outputs.appInsightsConnectionString.value // ""')
  else
    # Fallback: query deployments directly (slower but works without jq)
    print_warning "Using fallback output extraction (install jq for better results)"
    SQL_SERVER_FQDN=$(az deployment group show --resource-group "$RESOURCE_GROUP" --name "sqlDatabaseDeployment" --query properties.outputs.sqlServerFqdn.value -o tsv)
    SQL_DATABASE_NAME=$(az deployment group show --resource-group "$RESOURCE_GROUP" --name "sqlDatabaseDeployment" --query properties.outputs.sqlDatabaseName.value -o tsv)
    ACR_LOGIN_SERVER=$(az deployment group show --resource-group "$RESOURCE_GROUP" --name "containerRegistryDeployment" --query properties.outputs.loginServer.value -o tsv)
    ACR_NAME=$(az deployment group show --resource-group "$RESOURCE_GROUP" --name "containerRegistryDeployment" --query properties.outputs.acrName.value -o tsv)
    CONTAINER_APP_NAME=$(az deployment group show --resource-group "$RESOURCE_GROUP" --name "main" --query properties.outputs.containerAppName.value -o tsv)
    CONTAINER_APP_ENV_ID=$(az deployment group show --resource-group "$RESOURCE_GROUP" --name "containerAppsEnvDeployment" --query properties.outputs.environmentId.value -o tsv)
    MANAGED_IDENTITY_ID=$(az deployment group show --resource-group "$RESOURCE_GROUP" --name "main" --query properties.outputs.containerAppIdentityId.value -o tsv)
    KEY_VAULT_NAME=$(az deployment group show --resource-group "$RESOURCE_GROUP" --name "keyVaultDeployment" --query properties.outputs.keyVaultName.value -o tsv)
    KEY_VAULT_URI=$(az deployment group show --resource-group "$RESOURCE_GROUP" --name "keyVaultDeployment" --query properties.outputs.keyVaultUri.value -o tsv)
  fi
  
  # ========================================================================
  # Validate Critical Outputs
  # ========================================================================
  
  print_info "Validating extracted outputs..."
  
  local validation_failed=false
  
  # Check required outputs are not null or empty
  if [ -z "$SQL_SERVER_FQDN" ] || [ "$SQL_SERVER_FQDN" = "null" ]; then
    print_error "Failed to extract SQL_SERVER_FQDN from deployment"
    validation_failed=true
  fi
  
  if [ -z "$ACR_NAME" ] || [ "$ACR_NAME" = "null" ]; then
    print_error "Failed to extract ACR_NAME from deployment"
    validation_failed=true
  fi
  
  if [ -z "$ACR_LOGIN_SERVER" ] || [ "$ACR_LOGIN_SERVER" = "null" ]; then
    print_error "Failed to extract ACR_LOGIN_SERVER from deployment"
    validation_failed=true
  fi
  
  if [ -z "$KEY_VAULT_NAME" ] || [ "$KEY_VAULT_NAME" = "null" ]; then
    print_error "Failed to extract KEY_VAULT_NAME from deployment"
    validation_failed=true
  fi
  
  if [ -z "$CONTAINER_APP_NAME" ] || [ "$CONTAINER_APP_NAME" = "null" ]; then
    print_error "Failed to extract CONTAINER_APP_NAME from deployment"
    validation_failed=true
  fi
  
  # Exit if validation failed
  if [ "$validation_failed" = true ]; then
    print_error "Output validation failed!"
    print_info "This usually means the Bicep deployment didn't complete successfully"
    print_info "Check the deployment outputs above for errors"
    exit 1
  fi
  
  # ========================================================================
  # Display Extracted Outputs
  # ========================================================================
  
  print_success "Outputs extracted and validated"
  print_info "ACR Name: $ACR_NAME"
  print_info "Key Vault: $KEY_VAULT_NAME"
  print_info "Container App: $CONTAINER_APP_NAME"
  
  # Export variables for use in other modules
  export SQL_SERVER_FQDN
  export SQL_DATABASE_NAME
  export ACR_LOGIN_SERVER
  export ACR_NAME
  export CONTAINER_APP_NAME
  export CONTAINER_APP_ENV_ID
  export MANAGED_IDENTITY_ID
  export KEY_VAULT_NAME
  export KEY_VAULT_URI
  export STORAGE_CONN_STRING
  export OPENAI_ENDPOINT
  export OPENAI_API_KEY
  export PUBSUB_CONN_STRING
  export APP_INSIGHTS_CONN_STRING
}


