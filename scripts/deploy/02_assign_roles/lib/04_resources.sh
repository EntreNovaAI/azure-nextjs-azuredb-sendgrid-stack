#!/usr/bin/env bash
#
# Azure Resources Information Library
#
# Purpose:
#   Retrieve information about Azure resources
#   - Resource group
#   - Managed identity and principal ID
#   - ACR resource ID
#   - Key Vault resource ID
#

# Source utilities
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$SCRIPT_DIR/00_utils.sh"

# ============================================================================
# Resource Information Functions
# ============================================================================

# Get resource information from Azure
# Sets global variables:
#   - RESOURCE_GROUP
#   - PRINCIPAL_ID
#   - ACR_ID
#   - KV_ID
# Returns 0 on success, exits with error on failure
get_resource_info() {
  print_header "Retrieving Resource Information"
  
  # Get resource group
  get_resource_group
  
  # Get managed identity principal ID
  get_principal_id
  
  # Get ACR resource ID
  get_acr_resource_id
  
  # Get Key Vault resource ID
  get_keyvault_resource_id
}

# ============================================================================
# Helper Functions
# ============================================================================

# Get resource group name
get_resource_group() {
  # ENV_FILE should be set by calling script
  local env_file="${ENV_FILE:-.env.production}"
  
  # Try to get resource group from .env.production first
  RESOURCE_GROUP=$(grep "^RESOURCE_GROUP=" "$env_file" | cut -d '=' -f2 || true)
  
  if [ -z "$RESOURCE_GROUP" ]; then
    # Fallback: try to get from ACR
    RESOURCE_GROUP=$(az acr show --name "$ACR_NAME" --query resourceGroup -o tsv 2>/dev/null || true)
  fi
  
  if [ -z "$RESOURCE_GROUP" ]; then
    print_error "Could not determine resource group"
    print_info "Make sure you ran 01_deploy_infrastructure.sh successfully"
    exit 1
  fi
  
  export RESOURCE_GROUP
  print_success "Resource Group: $RESOURCE_GROUP"
}

# Get managed identity principal ID
get_principal_id() {
  # Managed identity format: {container-app-name}-identity
  local identity_name="${CONTAINER_APP_NAME}-identity"
  
  print_info "Looking for managed identity: $identity_name"
  
  PRINCIPAL_ID=$(az identity show \
    --name "$identity_name" \
    --resource-group "$RESOURCE_GROUP" \
    --query principalId \
    -o tsv 2>/dev/null || true)
  
  if [ -z "$PRINCIPAL_ID" ] || [ "$PRINCIPAL_ID" = "null" ]; then
    print_error "Managed identity not found: $identity_name"
    print_info "Make sure you ran 01_deploy_infrastructure.sh successfully"
    print_info "The managed identity should have been created in Phase 1"
    exit 1
  fi
  
  export PRINCIPAL_ID
  print_success "Managed Identity Principal ID: $PRINCIPAL_ID"
}

# Get ACR resource ID
get_acr_resource_id() {
  print_info "Retrieving ACR resource ID for: $ACR_NAME (in resource group: $RESOURCE_GROUP)..."
  ACR_ID=$(az acr show --name "$ACR_NAME" --resource-group "$RESOURCE_GROUP" --query id -o tsv 2>&1)
  
  # Check if ACR query failed (e.g., wrong subscription or wrong ACR name)
  if [[ "$ACR_ID" == *"ERROR"* ]] || [[ "$ACR_ID" == *"ResourceGroupNotFound"* ]] || [ -z "$ACR_ID" ]; then
    print_error "Failed to retrieve ACR resource ID"
    print_error "Error: $ACR_ID"
    printf "\n"
    print_warning "Possible causes:"
    printf "\n"
    print_info "1. ACR '$ACR_NAME' doesn't exist in resource group '$RESOURCE_GROUP'"
    print_info "   Check: az acr list --resource-group $RESOURCE_GROUP --query \"[].name\" -o table"
    printf "\n"
    print_info "2. You're in the wrong Azure subscription"
    print_info "   Current subscription:"
    az account show --query "{Name:name, ID:id}" -o table
    printf "\n"
    print_info "   List all subscriptions: az account list -o table"
    print_info "   Switch subscription: az account set --subscription <correct-subscription-id>"
    printf "\n"
    print_info "3. The ACR_NAME in ${ENV_FILE:-.env.production} is from a previous/different deployment"
    print_info "   Check: grep ACR_NAME ${ENV_FILE:-.env.production}"
    print_info "   If incorrect, you may need to re-run 01_deploy_infrastructure.sh"
    printf "\n"
    exit 1
  fi
  
  # Fix common typos in Azure resource IDs (Azure database corruption)
  # These typos appear in Azure's own API responses
  local ORIGINAL_ACR_ID="$ACR_ID"
  
  # Fix: CContainerRegistry -> ContainerRegistry (double C)
  ACR_ID="${ACR_ID//CContainerRegistry/ContainerRegistry}"
  # Fix: ContainerrRegistry -> ContainerRegistry (double r)
  ACR_ID="${ACR_ID//ContainerrRegistry/ContainerRegistry}"
  # Fix: resourceGrooups -> resourceGroups (double o)
  ACR_ID="${ACR_ID//resourceGrooups/resourceGroups}"
  # Fix: resouurceGroups -> resourceGroups (double u)
  ACR_ID="${ACR_ID//resouurceGroups/resourceGroups}"
  
  # If we fixed any typos, log it
  if [ "$ACR_ID" != "$ORIGINAL_ACR_ID" ]; then
    print_warning "Fixed typo in ACR resource ID returned by Azure!"
    print_info "Original: $ORIGINAL_ACR_ID"
    print_info "Fixed:    $ACR_ID"
  fi
  
  # Remove leading slash if present (can cause MissingSubscription error)
  # Azure CLI role assignment fails when scope has a leading slash
  ACR_ID="${ACR_ID#/}"
  
  # Validate the ACR resource ID format before proceeding
  if [[ ! "$ACR_ID" =~ ^subscriptions/.*/resourceGroups/.*/providers/Microsoft\.ContainerRegistry/registries/.* ]]; then
    print_warning "ACR Resource ID has unexpected format!"
    print_warning "Got: $ACR_ID"
    print_warning "Expected pattern: subscriptions/.../resourceGroups/.../providers/Microsoft.ContainerRegistry/registries/..."
    print_info "This may cause role assignment to fail"
  fi
  
  export ACR_ID
  print_success "ACR Resource ID: $ACR_ID"
}

# Get Key Vault resource ID
get_keyvault_resource_id() {
  print_info "Retrieving Key Vault resource ID for: $KEY_VAULT_NAME (in resource group: $RESOURCE_GROUP)..."
  KV_ID=$(az keyvault show --name "$KEY_VAULT_NAME" --resource-group "$RESOURCE_GROUP" --query id -o tsv 2>&1)
  
  # Check if Key Vault query failed
  if [[ "$KV_ID" == *"ERROR"* ]] || [[ "$KV_ID" == *"ResourceGroupNotFound"* ]] || [ -z "$KV_ID" ]; then
    print_error "Failed to retrieve Key Vault resource ID"
    print_error "Error: $KV_ID"
    printf "\n"
    print_warning "Possible causes:"
    printf "\n"
    print_info "1. Key Vault '$KEY_VAULT_NAME' doesn't exist in resource group '$RESOURCE_GROUP'"
    print_info "   Check: az keyvault list --resource-group $RESOURCE_GROUP --query \"[].name\" -o table"
    printf "\n"
    print_info "2. You're in the wrong Azure subscription"
    print_info "   Make sure you're in the same subscription where you ran 01_deploy_infrastructure.sh"
    printf "\n"
    print_info "3. The KEY_VAULT_NAME in ${ENV_FILE:-.env.production} is from a previous/different deployment"
    print_info "   Check: grep KEY_VAULT_NAME ${ENV_FILE:-.env.production}"
    print_info "   If incorrect, you may need to re-run 01_deploy_infrastructure.sh"
    printf "\n"
    exit 1
  fi
  
  # Fix common typos in Azure resource IDs (Azure database corruption)
  # These typos appear in Azure's own API responses
  local ORIGINAL_KV_ID="$KV_ID"
  
  # Fix: Microosoft -> Microsoft (extra o)
  KV_ID="${KV_ID//Microosoft/Microsoft}"
  # Fix: Microssoft -> Microsoft (double s)
  KV_ID="${KV_ID//Microssoft/Microsoft}"
  # Fix: KeyyVault -> KeyVault (double y)
  KV_ID="${KV_ID//KeyyVault/KeyVault}"
  # Fix: resourceGrooups -> resourceGroups (double o)
  KV_ID="${KV_ID//resourceGrooups/resourceGroups}"
  # Fix: resouurceGroups -> resourceGroups (double u)
  KV_ID="${KV_ID//resouurceGroups/resourceGroups}"
  
  # If we fixed any typos, log it
  if [ "$KV_ID" != "$ORIGINAL_KV_ID" ]; then
    print_warning "Fixed typo in Key Vault resource ID returned by Azure!"
    print_info "Original: $ORIGINAL_KV_ID"
    print_info "Fixed:    $KV_ID"
  fi
  
  # Remove leading slash if present (can cause MissingSubscription error)
  # Azure CLI role assignment fails when scope has a leading slash
  KV_ID="${KV_ID#/}"
  
  # Validate the Key Vault resource ID format before proceeding
  if [[ ! "$KV_ID" =~ ^subscriptions/.*/resourceGroups/.*/providers/Microsoft\.KeyVault/vaults/.* ]]; then
    print_warning "Key Vault Resource ID has unexpected format!"
    print_warning "Got: $KV_ID"
    print_warning "Expected pattern: subscriptions/.../resourceGroups/.../providers/Microsoft.KeyVault/vaults/..."
    print_info "This may cause role assignment to fail"
  fi
  
  export KV_ID
  print_success "Key Vault Resource ID: $KV_ID"
}

