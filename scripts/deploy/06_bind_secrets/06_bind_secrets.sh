#!/usr/bin/env bash
#
# Azure Secrets Management Script - Step 6 (Final Step)
#
# Purpose:
#   Read secrets from .env file, store in Key Vault, and bind to Container App
#   This is the final step in the deployment workflow
#
# Prerequisites:
#   1. Phase 1 complete (01_deploy_infrastructure.sh)
#   2. RBAC roles assigned (02_assign_roles.sh)
#   3. Docker image pushed (04_build_and_push_image.sh)
#   4. Container App deployed (05_deploy_container_app.sh)
#   5. .env.production file exists with all secrets
#
# Usage:
#   bash scripts/deploy/06_bind_secrets.sh [--yes] [--env-file <path>]
#
# Options:
#   --yes          Auto-confirm prompts (non-interactive mode)
#   --env-file     Path to environment file (default: .env.production)
#

set -euo pipefail

# ============================================================================
# Configuration
# ============================================================================

DEFAULT_ENV_FILE=".env.production"
ENV_FILE=""

# ============================================================================
# Parse Arguments
# ============================================================================

AUTO_YES=false

while [ $# -gt 0 ]; do
  case "$1" in
    --yes)
      AUTO_YES=true
      shift
      ;;
    --env-file)
      ENV_FILE="$2"
      shift 2
      ;;
    *)
      printf "Unknown option: %s\n" "$1"
      printf "Usage: %s [--yes] [--env-file <path>]\n" "$0"
      exit 1
      ;;
  esac
done

# Use default if not specified
if [ -z "$ENV_FILE" ]; then
  ENV_FILE="$DEFAULT_ENV_FILE"
fi

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

print_warning() {
  printf "⚠️  %s\n" "$1"
}

# Confirm action (skip if --yes flag is set)
confirm() {
  if [ "$AUTO_YES" = true ]; then
    return 0
  fi
  
  local prompt="$1"
  local response
  printf "%s (y/n): " "$prompt"
  read -r response
  
  case "$response" in
    [yY]|[yY][eE][sS])
      return 0
      ;;
    *)
      return 1
      ;;
  esac
}

# ============================================================================
# Prerequisites Check
# ============================================================================

check_prerequisites() {
  print_header "Checking Prerequisites"
  
  # Check for Azure CLI
  if ! command -v az >/dev/null 2>&1; then
    print_error "Azure CLI is required but not installed."
    exit 1
  fi
  print_success "Azure CLI is installed"
  
  # Check Azure CLI login
  if ! az account show >/dev/null 2>&1; then
    print_error "Not logged in to Azure CLI"
    print_info "Run: az login"
    exit 1
  fi
  print_success "Logged in to Azure CLI"
  
  # Check if env file exists
  if [ ! -f "$ENV_FILE" ]; then
    print_error "Environment file not found: $ENV_FILE"
    exit 1
  fi
  print_success "Environment file found: $ENV_FILE"
}

# ============================================================================
# Collect Parameters
# ============================================================================

collect_parameters() {
  print_header "Collect Azure Resources"
  
  # Try to read from env file first
  if [ -f "$ENV_FILE" ]; then
    RESOURCE_GROUP=$(grep "^RESOURCE_GROUP=" "$ENV_FILE" 2>/dev/null | cut -d'=' -f2 || echo "")
    CONTAINER_APP_NAME=$(grep "^CONTAINER_APP_NAME=" "$ENV_FILE" 2>/dev/null | cut -d'=' -f2 || echo "")
    KEY_VAULT_NAME=$(grep "^KEY_VAULT_NAME=" "$ENV_FILE" 2>/dev/null | cut -d'=' -f2 || echo "")
  fi
  
  # Prompt for missing values
  if [ -z "$RESOURCE_GROUP" ]; then
    printf "Enter resource group name: "
    read -r RESOURCE_GROUP
  else
    print_info "Resource group: $RESOURCE_GROUP"
  fi
  
  if [ -z "$CONTAINER_APP_NAME" ]; then
    printf "Enter Container App name: "
    read -r CONTAINER_APP_NAME
  else
    print_info "Container App: $CONTAINER_APP_NAME"
  fi
  
  if [ -z "$KEY_VAULT_NAME" ]; then
    printf "Enter Key Vault name: "
    read -r KEY_VAULT_NAME
  else
    print_info "Key Vault: $KEY_VAULT_NAME"
  fi
  
  # Verify resources exist
  printf "\n"
  print_info "Verifying resources exist..."
  
  if ! az group show --name "$RESOURCE_GROUP" >/dev/null 2>&1; then
    print_error "Resource group not found: $RESOURCE_GROUP"
    exit 1
  fi
  print_success "Resource group exists"
  
  if ! az containerapp show --name "$CONTAINER_APP_NAME" --resource-group "$RESOURCE_GROUP" >/dev/null 2>&1; then
    print_error "Container App not found: $CONTAINER_APP_NAME"
    exit 1
  fi
  print_success "Container App exists"
  
  if ! az keyvault show --name "$KEY_VAULT_NAME" >/dev/null 2>&1; then
    print_error "Key Vault not found: $KEY_VAULT_NAME"
    exit 1
  fi
  print_success "Key Vault exists"
}

# ============================================================================
# Parse Environment File
# ============================================================================

parse_env_file() {
  print_header "Parse Environment File"
  
  # Arrays to store secrets and public env vars
  declare -g -a SECRET_KEYS=()
  declare -g -a SECRET_VALUES=()
  declare -g -a PUBLIC_KEYS=()
  declare -g -a PUBLIC_VALUES=()
  
  # Read env file line by line
  while IFS= read -r line || [ -n "$line" ]; do
    # Skip empty lines and comments
    if [ -z "$line" ] || [[ "$line" =~ ^[[:space:]]*# ]]; then
      continue
    fi
    
    # Skip lines that don't contain =
    if [[ ! "$line" =~ = ]]; then
      continue
    fi
    
    # Extract key and value
    local key="${line%%=*}"
    local value="${line#*=}"
    
    # Trim whitespace
    key=$(printf "%s" "$key" | xargs)
    
    # Skip if key or value is empty
    if [ -z "$key" ] || [ -z "$value" ]; then
      continue
    fi
    
    # Skip metadata keys (used for script configuration)
    if [[ "$key" =~ ^(RESOURCE_GROUP|ACR_NAME|ACR_LOGIN_SERVER|CONTAINER_APP_NAME|CONTAINER_APP_FQDN|CONTAINER_APP_URL|KEY_VAULT_NAME|KEY_VAULT_URI)$ ]]; then
      continue
    fi
    
    # Classify as public or secret
    if [[ "$key" =~ ^NEXT_PUBLIC_ ]]; then
      PUBLIC_KEYS+=("$key")
      PUBLIC_VALUES+=("$value")
    else
      SECRET_KEYS+=("$key")
      SECRET_VALUES+=("$value")
    fi
  done < "$ENV_FILE"
  
  print_info "Found ${#SECRET_KEYS[@]} secrets and ${#PUBLIC_KEYS[@]} public variables"
  
  if [ ${#SECRET_KEYS[@]} -eq 0 ]; then
    print_error "No secrets found in $ENV_FILE"
    exit 1
  fi
}

# ============================================================================
# Store Secrets in Key Vault
# ============================================================================

store_secrets_in_keyvault() {
  print_header "Store Secrets in Key Vault"
  
  print_info "Storing ${#SECRET_KEYS[@]} secrets in Key Vault..."
  printf "\n"
  
  local stored_count=0
  local skipped_count=0
  
  # Iterate through secrets
  for i in "${!SECRET_KEYS[@]}"; do
    local key="${SECRET_KEYS[$i]}"
    local value="${SECRET_VALUES[$i]}"
    
    # Convert key to Key Vault compatible name (replace _ with -)
    local kv_secret_name="${key//_/-}"
    
    # Check if secret already exists
    if az keyvault secret show --vault-name "$KEY_VAULT_NAME" --name "$kv_secret_name" >/dev/null 2>&1; then
      if [ "$AUTO_YES" = false ]; then
        if ! confirm "Secret '$kv_secret_name' exists. Update?"; then
          print_info "Skipped: $kv_secret_name"
          skipped_count=$((skipped_count + 1))
          continue
        fi
      fi
    fi
    
    # Store secret (suppress output for security)
    if az keyvault secret set --vault-name "$KEY_VAULT_NAME" --name "$kv_secret_name" --value "$value" --output none 2>/dev/null; then
      print_success "Stored: $kv_secret_name"
      stored_count=$((stored_count + 1))
    else
      print_error "Failed to store: $kv_secret_name"
    fi
  done
  
  printf "\n"
  print_success "Stored $stored_count secrets (skipped $skipped_count)"
}

# ============================================================================
# Bind Secrets to Container App
# ============================================================================

bind_secrets_to_container_app() {
  print_header "Bind Secrets to Container App"
  
  print_info "Creating secret references for Container App..."
  
  # Get Key Vault resource ID
  local kv_resource_id
  kv_resource_id=$(az keyvault show --name "$KEY_VAULT_NAME" --query id -o tsv)
  
  # Build secrets configuration for Container App
  local secrets_json="["
  local first=true
  
  for i in "${!SECRET_KEYS[@]}"; do
    local key="${SECRET_KEYS[$i]}"
    local kv_secret_name="${key//_/-}"
    
    if [ "$first" = true ]; then
      first=false
    else
      secrets_json+=","
    fi
    
    # Create Key Vault reference
    secrets_json+="{\"name\":\"${kv_secret_name}\",\"keyVaultUrl\":\"https://${KEY_VAULT_NAME}.vault.azure.net/secrets/${kv_secret_name}\"}"
  done
  
  secrets_json+="]"
  
  # Update Container App secrets
  print_info "Updating Container App secrets..."
  
  # Create temp file for secrets
  local secrets_file
  secrets_file=$(mktemp -t secrets.XXXXXX)
  printf "%s" "$secrets_json" > "$secrets_file"
  
  if az containerapp update \
    --name "$CONTAINER_APP_NAME" \
    --resource-group "$RESOURCE_GROUP" \
    --set-env-vars-from-secrets "@$secrets_file" \
    --output none 2>/dev/null; then
    print_success "Container App secrets updated"
  else
    print_error "Failed to update Container App secrets"
    rm -f "$secrets_file"
    exit 1
  fi
  
  rm -f "$secrets_file"
  
  # Build environment variables configuration
  print_info "Setting environment variables..."
  
  local env_vars=""
  
  # Add secret references
  for i in "${!SECRET_KEYS[@]}"; do
    local key="${SECRET_KEYS[$i]}"
    local kv_secret_name="${key//_/-}"
    env_vars+=" ${key}=secretref:${kv_secret_name}"
  done
  
  # Add public environment variables
  for i in "${!PUBLIC_KEYS[@]}"; do
    local key="${PUBLIC_KEYS[$i]}"
    local value="${PUBLIC_VALUES[$i]}"
    env_vars+=" ${key}=${value}"
  done
  
  # Update Container App environment variables
  if az containerapp update \
    --name "$CONTAINER_APP_NAME" \
    --resource-group "$RESOURCE_GROUP" \
    --set-env-vars $env_vars \
    --output none 2>/dev/null; then
    print_success "Container App environment variables updated"
  else
    print_error "Failed to update Container App environment variables"
    exit 1
  fi
}

# ============================================================================
# Verify Configuration
# ============================================================================

verify_configuration() {
  print_header "Verify Configuration"
  
  print_info "Checking Container App configuration..."
  
  # Get Container App URL
  local app_url
  app_url=$(az containerapp show \
    --name "$CONTAINER_APP_NAME" \
    --resource-group "$RESOURCE_GROUP" \
    --query properties.configuration.ingress.fqdn -o tsv)
  
  if [ -n "$app_url" ]; then
    print_success "Container App URL: https://$app_url"
  fi
  
  printf "\n"
  print_info "Secret binding complete!"
  print_info "Secrets are stored in Key Vault and referenced by Container App"
  print_warning "Never log or expose secret values in your application"
}

# ============================================================================
# Post-Binding Instructions
# ============================================================================

show_post_binding_instructions() {
  print_header "Next Steps"
  
  printf "📝 Secrets have been bound to your Container App\n\n"
  
  print_info "To deploy your application:"
  printf "  1. Build Docker image:\n"
  printf "     docker build -t <acr-name>.azurecr.io/%s:latest -f docker/Dockerfile .\n" "$CONTAINER_APP_NAME"
  printf "\n"
  printf "  2. Push to Azure Container Registry:\n"
  printf "     az acr login --name <acr-name>\n"
  printf "     docker push <acr-name>.azurecr.io/%s:latest\n" "$CONTAINER_APP_NAME"
  printf "\n"
  printf "  3. Container App will automatically deploy the new image\n"
  printf "\n"
  
  print_info "To verify secrets are loaded:"
  printf "  • Check Container App logs in Azure Portal\n"
  printf "  • Test your application endpoints\n"
  printf "  • Monitor for any missing environment variables\n"
  printf "\n"
  
  print_success "Secrets management complete! 🚀"
}

# ============================================================================
# Main Script
# ============================================================================

main() {
  print_header "Azure Secrets Management"
  
  # Run binding steps
  check_prerequisites
  collect_parameters
  parse_env_file
  store_secrets_in_keyvault
  bind_secrets_to_container_app
  verify_configuration
  show_post_binding_instructions
}

# Run main function
main

