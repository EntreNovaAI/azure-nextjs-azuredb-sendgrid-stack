#!/usr/bin/env bash
#
# Azure Connection Strings Retrieval Script
#
# Purpose:
#   Retrieve connection strings and credentials from Azure resources
#   Display in copy-paste format for .env files
#
# Usage:
#   bash scripts/deploy/07_get_connection_strings/07_get_connection_strings.sh [--resource-group <rg>]
#

set -euo pipefail

# ============================================================================
# Parse Arguments
# ============================================================================

RESOURCE_GROUP=""

while [ $# -gt 0 ]; do
  case "$1" in
    --resource-group)
      RESOURCE_GROUP="$2"
      shift 2
      ;;
    *)
      printf "Unknown option: %s\n" "$1"
      printf "Usage: %s [--resource-group <rg>]\n" "$0"
      exit 1
      ;;
  esac
done

# ============================================================================
# Utility Functions
# ============================================================================

# Print colored output
print_header() {
  printf "\n"
  printf "============================================================\n"
  printf " %s\n" "$1"
  printf "============================================================\n"
  printf "\n"
}

print_info() {
  printf "ℹ️  %s\n" "$1"
}

print_success() {
  printf "✅ %s\n" "$1"
}

print_error() {
  printf "❌ %s\n" "$1" >&2
}

print_section() {
  printf "\n# %s\n" "$1"
}

# ============================================================================
# Check Prerequisites
# ============================================================================

check_prerequisites() {
  if ! command -v az >/dev/null 2>&1; then
    print_error "Azure CLI is required but not installed."
    exit 1
  fi
  
  if ! az account show >/dev/null 2>&1; then
    print_error "Not logged in to Azure CLI"
    print_info "Run: az login"
    exit 1
  fi
}

# ============================================================================
# Get Resource Group
# ============================================================================

get_resource_group() {
  if [ -z "$RESOURCE_GROUP" ]; then
    # Try to read from .env.production
    if [ -f ".env.production" ]; then
      RESOURCE_GROUP=$(grep "^RESOURCE_GROUP=" ".env.production" 2>/dev/null | cut -d'=' -f2 || echo "")
    fi
    
    # Prompt if still not found
    if [ -z "$RESOURCE_GROUP" ]; then
      printf "Enter resource group name: "
      read -r RESOURCE_GROUP
    fi
  fi
  
  if [ -z "$RESOURCE_GROUP" ]; then
    print_error "Resource group name is required"
    exit 1
  fi
  
  # Verify resource group exists
  if ! az group show --name "$RESOURCE_GROUP" >/dev/null 2>&1; then
    print_error "Resource group not found: $RESOURCE_GROUP"
    exit 1
  fi
  
  print_info "Using resource group: $RESOURCE_GROUP"
}

# ============================================================================
# Get SQL Database Connection
# ============================================================================

get_sql_connection() {
  print_header "SQL Database Connection"
  
  # Find SQL server
  local sql_server
  sql_server=$(az sql server list --resource-group "$RESOURCE_GROUP" --query "[0].name" -o tsv 2>/dev/null || echo "")
  
  if [ -z "$sql_server" ]; then
    print_info "No SQL Server found in this resource group"
    return
  fi
  
  # Get database
  local sql_database
  sql_database=$(az sql db list --resource-group "$RESOURCE_GROUP" --server "$sql_server" --query "[?name!='master'].name" -o tsv | head -1)
  
  if [ -z "$sql_database" ]; then
    print_info "No SQL Database found"
    return
  fi
  
  # Get server FQDN
  local sql_fqdn
  sql_fqdn=$(az sql server show --resource-group "$RESOURCE_GROUP" --name "$sql_server" --query fullyQualifiedDomainName -o tsv)
  
  # Get admin username
  local sql_admin
  sql_admin=$(az sql server show --resource-group "$RESOURCE_GROUP" --name "$sql_server" --query administratorLogin -o tsv)
  
  print_success "SQL Server found: $sql_server"
  printf "\n"
  
  print_section "SQL Database (Kysely Format)"
  printf "MSSQL_SERVER=%s\n" "$sql_fqdn"
  printf "MSSQL_DATABASE=%s\n" "$sql_database"
  printf "MSSQL_USER=%s\n" "$sql_admin"
  printf "MSSQL_PASSWORD=<your-password>\n"
  printf "MSSQL_ENCRYPT=true\n"
  printf "MSSQL_POOL_MIN=0\n"
  printf "MSSQL_POOL_MAX=10\n"
}

# ============================================================================
# Get Container App Info
# ============================================================================

get_container_app_info() {
  print_header "Container App Information"
  
  # Find Container App
  local app_name
  app_name=$(az containerapp list --resource-group "$RESOURCE_GROUP" --query "[0].name" -o tsv 2>/dev/null || echo "")
  
  if [ -z "$app_name" ]; then
    print_info "No Container App found in this resource group"
    return
  fi
  
  # Get app details
  local app_fqdn
  local app_url
  app_fqdn=$(az containerapp show --name "$app_name" --resource-group "$RESOURCE_GROUP" --query properties.configuration.ingress.fqdn -o tsv)
  app_url="https://$app_fqdn"
  
  print_success "Container App found: $app_name"
  printf "\n"
  
  print_section "Container App"
  printf "CONTAINER_APP_NAME=%s\n" "$app_name"
  printf "CONTAINER_APP_FQDN=%s\n" "$app_fqdn"
  printf "CONTAINER_APP_URL=%s\n" "$app_url"
  printf "NEXTAUTH_URL=%s\n" "$app_url"
}

# ============================================================================
# Get Key Vault Info
# ============================================================================

get_keyvault_info() {
  print_header "Key Vault Information"
  
  # Find Key Vault
  local kv_name
  kv_name=$(az keyvault list --resource-group "$RESOURCE_GROUP" --query "[0].name" -o tsv 2>/dev/null || echo "")
  
  if [ -z "$kv_name" ]; then
    print_info "No Key Vault found in this resource group"
    return
  fi
  
  # Get vault URI
  local kv_uri
  kv_uri=$(az keyvault show --name "$kv_name" --resource-group "$RESOURCE_GROUP" --query properties.vaultUri -o tsv)
  
  print_success "Key Vault found: $kv_name"
  printf "\n"
  
  print_section "Key Vault"
  printf "KEY_VAULT_NAME=%s\n" "$kv_name"
  printf "KEY_VAULT_URI=%s\n" "$kv_uri"
  
  # List secrets (names only)
  print_info "Available secrets in Key Vault:"
  az keyvault secret list --vault-name "$kv_name" --query "[].name" -o tsv | while read -r secret; do
    printf "  - %s\n" "$secret"
  done
}

# ============================================================================
# Get Container Registry Info
# ============================================================================

get_acr_info() {
  print_header "Container Registry Information"
  
  # Find ACR
  local acr_name
  acr_name=$(az acr list --resource-group "$RESOURCE_GROUP" --query "[0].name" -o tsv 2>/dev/null || echo "")
  
  if [ -z "$acr_name" ]; then
    print_info "No Container Registry found in this resource group"
    return
  fi
  
  # Get login server
  local acr_login_server
  acr_login_server=$(az acr show --name "$acr_name" --resource-group "$RESOURCE_GROUP" --query loginServer -o tsv)
  
  print_success "Container Registry found: $acr_name"
  printf "\n"
  
  print_section "Azure Container Registry"
  printf "ACR_NAME=%s\n" "$acr_name"
  printf "ACR_LOGIN_SERVER=%s\n" "$acr_login_server"
  printf "\n"
  print_info "Login to ACR:"
  printf "  az acr login --name %s\n" "$acr_name"
}

# ============================================================================
# Get Storage Account Info (Optional)
# ============================================================================

get_storage_info() {
  print_header "Storage Account Information (Optional)"
  
  # Find Storage Account
  local storage_name
  storage_name=$(az storage account list --resource-group "$RESOURCE_GROUP" --query "[0].name" -o tsv 2>/dev/null || echo "")
  
  if [ -z "$storage_name" ]; then
    print_info "No Storage Account found in this resource group"
    return
  fi
  
  # Get connection string
  local storage_conn
  storage_conn=$(az storage account show-connection-string --name "$storage_name" --resource-group "$RESOURCE_GROUP" --query connectionString -o tsv)
  
  print_success "Storage Account found: $storage_name"
  printf "\n"
  
  print_section "Azure Storage"
  printf "AZURE_STORAGE_CONNECTION_STRING=%s\n" "$storage_conn"
}

# ============================================================================
# Get OpenAI Info (Optional)
# ============================================================================

get_openai_info() {
  print_header "OpenAI Service Information (Optional)"
  
  # Find OpenAI account
  local openai_name
  openai_name=$(az cognitiveservices account list --resource-group "$RESOURCE_GROUP" --query "[?kind=='OpenAI'].name | [0]" -o tsv 2>/dev/null || echo "")
  
  if [ -z "$openai_name" ]; then
    print_info "No OpenAI Service found in this resource group"
    return
  fi
  
  # Get endpoint and key
  local openai_endpoint
  local openai_key
  openai_endpoint=$(az cognitiveservices account show --name "$openai_name" --resource-group "$RESOURCE_GROUP" --query properties.endpoint -o tsv)
  openai_key=$(az cognitiveservices account keys list --name "$openai_name" --resource-group "$RESOURCE_GROUP" --query key1 -o tsv)
  
  # Get deployment name
  local deployment_name
  deployment_name=$(az cognitiveservices account deployment list --name "$openai_name" --resource-group "$RESOURCE_GROUP" --query "[0].name" -o tsv 2>/dev/null || echo "gpt-35-turbo")
  
  print_success "OpenAI Service found: $openai_name"
  printf "\n"
  
  print_section "Azure OpenAI"
  printf "AZURE_OPENAI_ENDPOINT=%s\n" "$openai_endpoint"
  printf "AZURE_OPENAI_API_KEY=%s\n" "$openai_key"
  printf "AZURE_OPENAI_DEPLOYMENT=%s\n" "$deployment_name"
}

# ============================================================================
# Get Web PubSub Info (Optional)
# ============================================================================

get_webpubsub_info() {
  print_header "Web PubSub Information (Optional)"
  
  # Find Web PubSub
  local pubsub_name
  pubsub_name=$(az webpubsub list --resource-group "$RESOURCE_GROUP" --query "[0].name" -o tsv 2>/dev/null || echo "")
  
  if [ -z "$pubsub_name" ]; then
    print_info "No Web PubSub found in this resource group"
    return
  fi
  
  # Get connection string
  local pubsub_conn
  pubsub_conn=$(az webpubsub key show --name "$pubsub_name" --resource-group "$RESOURCE_GROUP" --query primaryConnectionString -o tsv)
  
  print_success "Web PubSub found: $pubsub_name"
  printf "\n"
  
  print_section "Azure Web PubSub"
  printf "AZURE_WEB_PUBSUB_CONNECTION_STRING=%s\n" "$pubsub_conn"
}

# ============================================================================
# Get Application Insights Info (Optional)
# ============================================================================

get_app_insights_info() {
  print_header "Application Insights Information (Optional)"
  
  # Find Application Insights
  local insights_name
  insights_name=$(az monitor app-insights component show --resource-group "$RESOURCE_GROUP" --query "[0].name" -o tsv 2>/dev/null || echo "")
  
  if [ -z "$insights_name" ]; then
    print_info "No Application Insights found in this resource group"
    return
  fi
  
  # Get connection string
  local insights_conn
  insights_conn=$(az monitor app-insights component show --app "$insights_name" --resource-group "$RESOURCE_GROUP" --query connectionString -o tsv)
  
  print_success "Application Insights found: $insights_name"
  printf "\n"
  
  print_section "Application Insights"
  printf "APPINSIGHTS_CONNECTION_STRING=%s\n" "$insights_conn"
}

# ============================================================================
# Show Instructions
# ============================================================================

show_instructions() {
  print_header "Next Steps"
  
  print_info "Copy the values above to your .env.production file"
  printf "\n"
  
  print_info "Key Vault References (for Container App):"
  printf "  Secrets in Key Vault are automatically bound to Container App\n"
  printf "  Reference format: @Microsoft.KeyVault(SecretUri=<vault-uri>/secrets/<secret-name>)\n"
  printf "\n"
  
  print_info "To update secrets:"
  printf "  1. Update .env.production\n"
  printf "  2. Run: bash scripts/deploy/06_bind_secrets/06_bind_secrets.sh\n"
  printf "\n"
  
  print_success "Connection strings retrieved! 🎉"
}

# ============================================================================
# Main Script
# ============================================================================

main() {
  print_header "Azure Connection Strings Retrieval"
  
  check_prerequisites
  get_resource_group
  
  # Retrieve all connection information
  get_sql_connection
  get_container_app_info
  get_keyvault_info
  get_acr_info
  get_storage_info
  get_openai_info
  get_webpubsub_info
  get_app_insights_info
  
  show_instructions
}

# Run main function
main

