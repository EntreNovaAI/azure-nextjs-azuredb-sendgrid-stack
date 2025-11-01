#!/usr/bin/env bash
#
# Azure Infrastructure Deployment Script - Phase 1 (Foundation)
#
# Purpose:
#   Deploy foundation Azure infrastructure using Bicep templates
#   This is Phase 1 of a two-phase deployment strategy
#   
#   Phase 1 (this script) deploys:
#   - SQL Database, ACR, Key Vault, Container Apps Environment
#   - Does NOT deploy Container App (no Docker image required yet)
#
#   Phase 2 (05_deploy_container_app.sh) deploys:
#   - Container App (after Docker image is built and pushed)
#
# Why Two Phases?
#   Solves the "chicken and egg" problem where Container App needs a 
#   Docker image, but you need infrastructure to push the image to ACR
#
# Usage:
#   bash scripts/deploy/01_deploy_infrastructure.sh [--yes] [--subscription <id>]
#
# Options:
#   --yes             Auto-confirm prompts (non-interactive mode)
#   --subscription    Azure subscription ID (optional)
#

set -euo pipefail

# ============================================================================
# Change to Project Root Directory
# ============================================================================

# Get the directory where this script is located
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# Change to project root (two levels up from scripts/deploy/)
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
cd "$PROJECT_ROOT"

# ============================================================================
# Configuration
# ============================================================================

ENV_FILE=".env.production"
# Phase 1: Deploy foundation resources only (no Container App yet)
BICEP_TEMPLATE="infrastructure/bicep/main-foundation.bicep"

# Default deployment values (can be changed here for easier customization)
DEFAULT_RESOURCE_GROUP="enova-rg"
DEFAULT_LOCATION="eastus2"
DEFAULT_PREFIX="enova"
DEFAULT_SQL_ADMIN_USER="sqladmin"
DEFAULT_SQL_SKU="Basic"

# ============================================================================
# Parse Arguments
# ============================================================================

AUTO_YES=false
SUBSCRIPTION_ID=""

while [ $# -gt 0 ]; do
  case "$1" in
    --yes)
      AUTO_YES=true
      shift
      ;;
    --subscription)
      SUBSCRIPTION_ID="$2"
      shift 2
      ;;
    *)
      printf "Unknown option: %s\n" "$1"
      printf "Usage: %s [--yes] [--subscription <id>]\n" "$0"
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

# Read input with default value
read_with_default() {
  local prompt="$1"
  local default="$2"
  local response
  
  # Print prompt and flush output buffer to ensure visibility
  printf "%s [%s]: " "$prompt" "$default" >&2
  # Read from stdin (not stderr)
  read -r response
  
  if [ -z "$response" ]; then
    printf "%s" "$default"
  else
    printf "%s" "$response"
  fi
}

# Read sensitive input (password)
read_password() {
  local prompt="$1"
  local password
  local password_confirm
  
  while true; do
    # Print prompt to stderr so it's always visible, even if output is captured
    printf "%s (input will be hidden): " "$prompt" >&2
    read -rs password
    printf "\n" >&2
    
    if [ ${#password} -lt 8 ]; then
      print_error "Password must be at least 8 characters"
      continue
    fi
    
    printf "Confirm password (input will be hidden): " >&2
    read -rs password_confirm
    printf "\n" >&2
    
    if [ "$password" = "$password_confirm" ]; then
      printf "%s" "$password"
      return 0
    else
      print_error "Passwords do not match. Try again."
    fi
  done
}

# ============================================================================
# Prerequisites Check
# ============================================================================

check_prerequisites() {
  print_header "Checking Prerequisites"
  
  # Check for Azure CLI
  if ! command -v az >/dev/null 2>&1; then
    print_error "Azure CLI is required but not installed."
    print_info "Install from: https://docs.microsoft.com/cli/azure/install-azure-cli"
    exit 1
  fi
  print_success "Azure CLI is installed"
  
  # Check Azure CLI login status
  if ! az account show >/dev/null 2>&1; then
    print_error "Not logged in to Azure CLI"
    print_info "Run: az login"
    exit 1
  fi
  print_success "Logged in to Azure CLI"
  
  # Check for Bicep CLI
  if ! az bicep version >/dev/null 2>&1; then
    print_warning "Bicep CLI not found. Installing..."
    az bicep install
    print_success "Bicep CLI installed"
  else
    print_success "Bicep CLI is installed"
  fi
  
  # Check for jq
  if ! command -v jq >/dev/null 2>&1; then
    print_warning "jq is not installed (recommended for better JSON parsing)"
    print_info "Install: brew install jq (macOS) or apt install jq (Linux)"
  else
    print_success "jq is installed"
  fi
  
  # Check for Docker
  if ! command -v docker >/dev/null 2>&1; then
    print_error "Docker is required but not installed."
    print_info "Install Docker Desktop: https://www.docker.com/products/docker-desktop"
    exit 1
  fi
  print_success "Docker is installed"
  
  # Check if Bicep template exists
  if [ ! -f "$BICEP_TEMPLATE" ]; then
    print_error "Bicep template not found: $BICEP_TEMPLATE"
    exit 1
  fi
  print_success "Bicep template found"
}

# ============================================================================
# Collect Deployment Parameters
# ============================================================================

collect_parameters() {
  print_header "Collect Deployment Parameters"
  
  # Set subscription if provided
  if [ -n "$SUBSCRIPTION_ID" ]; then
    print_info "Using subscription: $SUBSCRIPTION_ID"
    az account set --subscription "$SUBSCRIPTION_ID"
  else
    # Show current subscription
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
  
  # Resource Group
  printf "\n"
  print_info "Resource configuration"
  printf "\n"
  printf "📦 Resource Group: A container that holds all your Azure resources\n"
  printf "   (Like a folder name - doesn't affect individual resource names)\n"
  RESOURCE_GROUP=$(read_with_default "Resource group name" "$DEFAULT_RESOURCE_GROUP")
  
  # Region
  LOCATION=$(read_with_default "Azure region" "$DEFAULT_LOCATION")
  
  # Prefix (validate: 3-15 lowercase alphanumeric, must fit within Azure naming limits)
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
    
    # Validate prefix format
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
  
  # SQL Database admin credentials
  printf "\n"
  print_info "SQL Database admin credentials"
  SQL_ADMIN_USER=$(read_with_default "SQL admin username" "$DEFAULT_SQL_ADMIN_USER")
  printf "\n"
  print_info "Enter SQL admin password (minimum 8 characters, input will be hidden)"
  SQL_ADMIN_PASSWORD=$(read_password "SQL admin password")
  
  # SQL Database SKU
  printf "\n"
  print_info "SQL Database SKU (Basic = ~\$5/month, S0 = ~\$15/month, S1 = ~\$30/month)"
  print_warning "Note: Prices vary by region. DTU-based pricing shown; vCore pricing available."
  SQL_SKU=$(read_with_default "SQL Database SKU [Basic/S0/S1]" "$DEFAULT_SQL_SKU")
  
  # Optional services
  printf "\n"
  print_info "Optional services (all default to 'no' - press Enter to skip)"
  
  DEPLOY_STORAGE="false"
  if confirm "Deploy Azure Storage Account? (~\$0.02/GB/month for Hot LRS, varies by tier) [default: no]"; then
    DEPLOY_STORAGE="true"
  fi
  
  DEPLOY_OPENAI="false"
  if confirm "Deploy Azure OpenAI? (requires approval) [default: no]"; then
    DEPLOY_OPENAI="true"
  fi
  
  DEPLOY_PUBSUB="false"
  if confirm "Deploy Azure Web PubSub? (~\$1/unit/day Standard tier, varies by region) [default: no]"; then
    DEPLOY_PUBSUB="true"
  fi
  
  DEPLOY_MONITORING="false"
  if confirm "Deploy Application Insights monitoring? (recommended, free tier: 5GB/month) [default: no]"; then
    DEPLOY_MONITORING="true"
  fi
}

# ============================================================================
# Pre-Deployment Summary
# ============================================================================

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

# ============================================================================
# Validate Bicep Template
# ============================================================================

validate_bicep() {
  print_header "Validating Bicep Template"
  
  # Lint Bicep template
  print_info "Running bicep lint..."
  if az bicep build --file "$BICEP_TEMPLATE" > /dev/null 2>&1; then
    print_success "Bicep template is valid"
  else
    print_error "Bicep template has errors"
    az bicep build --file "$BICEP_TEMPLATE"
    exit 1
  fi
  
  # Create resource group if it doesn't exist
  if ! az group show --name "$RESOURCE_GROUP" >/dev/null 2>&1; then
    print_info "Creating resource group: $RESOURCE_GROUP"
    az group create --name "$RESOURCE_GROUP" --location "$LOCATION" --output none
    print_success "Resource group created"
  else
    print_info "Resource group already exists: $RESOURCE_GROUP"
  fi
  
  # Run what-if analysis (recommended to see planned changes)
  print_info "Running what-if analysis (this may take a minute)..."
  
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

# ============================================================================
# Deploy Infrastructure
# ============================================================================

deploy_infrastructure() {
  print_header "Deploying Infrastructure"
  
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
  
  print_info "Starting deployment (this may take 5-10 minutes)..."
  printf "\n"
  
  # Deploy Bicep template
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
  
  if [ $? -ne 0 ]; then
    print_error "Deployment failed"
    exit 1
  fi
  
  print_success "Infrastructure deployed successfully!"
}

# ============================================================================
# Extract Outputs
# ============================================================================

extract_outputs() {
  print_header "Extracting Deployment Outputs"
  
  # Parse outputs with jq if available, otherwise use grep
  if command -v jq >/dev/null 2>&1; then
    SQL_SERVER_FQDN=$(printf "%s" "$DEPLOYMENT_OUTPUT" | jq -r '.properties.outputs.sqlServerFqdn.value')
    SQL_DATABASE_NAME=$(printf "%s" "$DEPLOYMENT_OUTPUT" | jq -r '.properties.outputs.sqlDatabaseName.value')
    ACR_LOGIN_SERVER=$(printf "%s" "$DEPLOYMENT_OUTPUT" | jq -r '.properties.outputs.acrLoginServer.value')
    ACR_NAME=$(printf "%s" "$DEPLOYMENT_OUTPUT" | jq -r '.properties.outputs.acrName.value')
    # Note: Container App name is available but FQDN/URL won't be until Phase 2
    CONTAINER_APP_NAME=$(printf "%s" "$DEPLOYMENT_OUTPUT" | jq -r '.properties.outputs.containerAppName.value')
    CONTAINER_APP_ENV_ID=$(printf "%s" "$DEPLOYMENT_OUTPUT" | jq -r '.properties.outputs.containerAppEnvId.value')
    KEY_VAULT_NAME=$(printf "%s" "$DEPLOYMENT_OUTPUT" | jq -r '.properties.outputs.keyVaultName.value')
    KEY_VAULT_URI=$(printf "%s" "$DEPLOYMENT_OUTPUT" | jq -r '.properties.outputs.keyVaultUri.value')
    
    # Optional outputs
    STORAGE_CONN_STRING=$(printf "%s" "$DEPLOYMENT_OUTPUT" | jq -r '.properties.outputs.storageConnectionString.value // ""')
    OPENAI_ENDPOINT=$(printf "%s" "$DEPLOYMENT_OUTPUT" | jq -r '.properties.outputs.openAIEndpoint.value // ""')
    OPENAI_API_KEY=$(printf "%s" "$DEPLOYMENT_OUTPUT" | jq -r '.properties.outputs.openAIApiKey.value // ""')
    PUBSUB_CONN_STRING=$(printf "%s" "$DEPLOYMENT_OUTPUT" | jq -r '.properties.outputs.webPubSubConnectionString.value // ""')
    APP_INSIGHTS_CONN_STRING=$(printf "%s" "$DEPLOYMENT_OUTPUT" | jq -r '.properties.outputs.appInsightsConnectionString.value // ""')
  else
    # Fallback: query deployments
    print_warning "Using fallback output extraction (install jq for better results)"
    SQL_SERVER_FQDN=$(az deployment group show --resource-group "$RESOURCE_GROUP" --name "sqlDatabaseDeployment" --query properties.outputs.sqlServerFqdn.value -o tsv)
    SQL_DATABASE_NAME=$(az deployment group show --resource-group "$RESOURCE_GROUP" --name "sqlDatabaseDeployment" --query properties.outputs.sqlDatabaseName.value -o tsv)
    ACR_LOGIN_SERVER=$(az deployment group show --resource-group "$RESOURCE_GROUP" --name "containerRegistryDeployment" --query properties.outputs.loginServer.value -o tsv)
    ACR_NAME=$(az deployment group show --resource-group "$RESOURCE_GROUP" --name "containerRegistryDeployment" --query properties.outputs.acrName.value -o tsv)
    # Get from main deployment since Container App not deployed yet
    CONTAINER_APP_NAME=$(az deployment group show --resource-group "$RESOURCE_GROUP" --name "main" --query properties.outputs.containerAppName.value -o tsv)
    CONTAINER_APP_ENV_ID=$(az deployment group show --resource-group "$RESOURCE_GROUP" --name "containerAppsEnvDeployment" --query properties.outputs.environmentId.value -o tsv)
    KEY_VAULT_NAME=$(az deployment group show --resource-group "$RESOURCE_GROUP" --name "keyVaultDeployment" --query properties.outputs.keyVaultName.value -o tsv)
    KEY_VAULT_URI=$(az deployment group show --resource-group "$RESOURCE_GROUP" --name "keyVaultDeployment" --query properties.outputs.keyVaultUri.value -o tsv)
  fi
  
  print_success "Outputs extracted"
}

# ============================================================================
# Generate .env.production File
# ============================================================================

generate_env_file() {
  print_header "Generating $ENV_FILE"
  
  # Check if .env.local exists to copy from
  if [ ! -f ".env.local" ]; then
    print_error ".env.local not found!"
    print_info "Please create .env.local first with your development configuration"
    print_info "This should include Google Auth credentials and other settings"
    exit 1
  fi
  
  # Copy .env.local to .env.production (preserves Google Auth, MailerSend, etc.)
  print_info "Copying .env.local to $ENV_FILE..."
  cp .env.local "$ENV_FILE"
  print_success "Base configuration copied from .env.local"
  
  # Create temporary file for updates
  TEMP_FILE="${ENV_FILE}.tmp"
  
  # Add deployment header at the top
  cat > "$TEMP_FILE" << EOF
# ============================================================================
# Azure Production Configuration
# Generated by: scripts/deploy/01_deploy_infrastructure.sh (Phase 1)
# Date: $(date)
# ============================================================================
#
# NOTE: This file was created by copying .env.local and updating deployment-specific variables
# Phase 1 (Foundation) deployment complete
# Container App URL will be added after Phase 2 (05_deploy_container_app.sh)
#

EOF
  
  # Append original .env.local content
  cat .env.local >> "$TEMP_FILE"
  
  # Function to update or add environment variable
  update_or_add_var() {
    local var_name="$1"
    local var_value="$2"
    local comment="${3:-}"  # Optional comment parameter with default empty string
    
    # Escape special characters for sed (/, &, \, newlines)
    local escaped_value=$(printf '%s' "$var_value" | sed 's/[&/\]/\\&/g')
    
    # Check if variable exists in file
    if grep -q "^${var_name}=" "$TEMP_FILE"; then
      # Update existing variable
      sed -i "s|^${var_name}=.*|${var_name}=${escaped_value}|g" "$TEMP_FILE"
    elif grep -q "^#${var_name}=" "$TEMP_FILE"; then
      # Variable exists but is commented out - uncomment and update
      sed -i "s|^#${var_name}=.*|${var_name}=${escaped_value}|g" "$TEMP_FILE"
    else
      # Variable doesn't exist - add it with comment if provided
      if [ -n "$comment" ]; then
        printf "\n# %s\n" "$comment" >> "$TEMP_FILE"
      fi
      printf "%s=%s\n" "$var_name" "$var_value" >> "$TEMP_FILE"
    fi
  }
  
  print_info "Updating deployment-specific variables..."
  
  # Update Azure SQL Database variables
  update_or_add_var "MSSQL_SERVER" "$SQL_SERVER_FQDN" "Azure SQL Database (Kysely-compatible format)"
  update_or_add_var "MSSQL_DATABASE" "$SQL_DATABASE_NAME"
  update_or_add_var "MSSQL_USER" "$SQL_ADMIN_USER"
  update_or_add_var "MSSQL_PASSWORD" "$SQL_ADMIN_PASSWORD"
  update_or_add_var "MSSQL_ENCRYPT" "true"
  update_or_add_var "MSSQL_POOL_MIN" "0"
  update_or_add_var "MSSQL_POOL_MAX" "10"
  
  # Generate NextAuth secret if not already set
  NEXTAUTH_SECRET_VALUE=$(openssl rand -base64 32 2>/dev/null || echo "GENERATE_SECURE_SECRET_$(date +%s)")
  update_or_add_var "NEXTAUTH_SECRET" "$NEXTAUTH_SECRET_VALUE" "NextAuth Configuration"
  
  # NEXTAUTH_URL will be set after Container App deployment (Phase 2)
  update_or_add_var "NEXTAUTH_URL" "" "Will be set in Phase 2 after Container App deployment"
  
  # Update Azure Container Registry variables
  update_or_add_var "ACR_LOGIN_SERVER" "$ACR_LOGIN_SERVER" "Azure Container Registry"
  update_or_add_var "ACR_NAME" "$ACR_NAME"
  
  # Update Azure Key Vault variables
  update_or_add_var "KEY_VAULT_NAME" "$KEY_VAULT_NAME" "Azure Key Vault"
  update_or_add_var "KEY_VAULT_URI" "$KEY_VAULT_URI"
  
  # Update Azure Container App variables (Phase 2 will complete these)
  update_or_add_var "CONTAINER_APP_NAME" "$CONTAINER_APP_NAME" "Azure Container App (URLs will be set in Phase 2)"
  update_or_add_var "CONTAINER_APP_ENV_ID" "$CONTAINER_APP_ENV_ID"
  update_or_add_var "CONTAINER_APP_FQDN" "" "Will be populated by 05_deploy_container_app.sh"
  update_or_add_var "CONTAINER_APP_URL" "" "Will be populated by 05_deploy_container_app.sh"
  
  # Update Resource Group and Prefix for subsequent scripts
  update_or_add_var "RESOURCE_GROUP" "$RESOURCE_GROUP" "Azure Resource Group"
  update_or_add_var "PREFIX" "$PREFIX" "Resource prefix for Azure resources"
  
  # Add optional services if deployed
  if [ "$DEPLOY_STORAGE" = "true" ] && [ -n "$STORAGE_CONN_STRING" ]; then
    update_or_add_var "AZURE_STORAGE_CONNECTION_STRING" "$STORAGE_CONN_STRING" "Azure Storage"
    update_or_add_var "AZURE_STORAGE_CONTAINER" "uploads" "Default storage container"
  fi
  
  if [ "$DEPLOY_OPENAI" = "true" ] && [ -n "$OPENAI_ENDPOINT" ]; then
    update_or_add_var "AZURE_OPENAI_ENDPOINT" "$OPENAI_ENDPOINT" "Azure OpenAI"
    update_or_add_var "AZURE_OPENAI_API_KEY" "$OPENAI_API_KEY"
    # Note: AZURE_OPENAI_DEPLOYMENT should be set manually based on your deployment name
  fi
  
  if [ "$DEPLOY_PUBSUB" = "true" ] && [ -n "$PUBSUB_CONN_STRING" ]; then
    update_or_add_var "AZURE_WEB_PUBSUB_CONNECTION_STRING" "$PUBSUB_CONN_STRING" "Azure Web PubSub"
  fi
  
  if [ "$DEPLOY_MONITORING" = "true" ] && [ -n "$APP_INSIGHTS_CONN_STRING" ]; then
    update_or_add_var "APPINSIGHTS_CONNECTION_STRING" "$APP_INSIGHTS_CONN_STRING" "Application Insights"
  fi
  
  # Replace original file with updated version
  mv "$TEMP_FILE" "$ENV_FILE"
  
  print_success "$ENV_FILE generated successfully!"
  print_info "✓ Copied all settings from .env.local (Google Auth, MailerSend, etc.)"
  print_info "✓ Updated Azure infrastructure variables"
  print_info "✓ Stripe variables preserved (configure with 03_configure_stripe.sh if needed)"
  print_warning "Review $ENV_FILE before proceeding to next steps"
}

# ============================================================================
# Post-Deployment Summary
# ============================================================================

show_post_deployment_summary() {
  print_header "Phase 1 Deployment Complete!"
  
  printf "📦 Foundation Resources Deployed:\n\n"
  printf "  SQL Server:      %s\n" "$SQL_SERVER_FQDN"
  printf "  Database:        %s\n" "$SQL_DATABASE_NAME"
  printf "  ACR:             %s\n" "$ACR_LOGIN_SERVER"
  printf "  Key Vault:       %s\n" "$KEY_VAULT_NAME"
  printf "  Container Env:   Ready (Container App will be deployed in Phase 2)\n"
  printf "\n"
  
  printf "📝 Next Steps (Two-Phase Deployment):\n\n"
  printf "  ✓ PHASE 1 COMPLETE - Foundation Deployed\n"
  printf "  -----------------------------------------\n\n"
  printf "  NEXT: Prepare for Phase 2\n"
  printf "  -------------------------\n"
  printf "  1. Review %s\n" "$ENV_FILE"
  printf "  2. Assign RBAC roles (REQUIRED for Container App to pull images):\n"
  printf "     bash scripts/deploy/02_assign_roles.sh\n\n"
  printf "  3. Configure Stripe (BEFORE building Docker image):\n"
  printf "     bash scripts/deploy/03_configure_stripe.sh\n\n"
  printf "  4. Build and push Docker image to ACR:\n"
  printf "     bash scripts/deploy/04_build_and_push_image.sh\n\n"
  printf "  PHASE 2 - Deploy Container App\n"
  printf "  -------------------------------\n"
  printf "  5. Deploy Container App (now that image exists):\n"
  printf "     bash scripts/deploy/05_deploy_container_app.sh\n\n"
  printf "  6. Bind secrets to Container App:\n"
  printf "     bash scripts/deploy/06_bind_secrets.sh\n"
  printf "\n"
  printf "⚠️  IMPORTANT:\n"
  printf "   • Complete RBAC assignment (step 2) BEFORE building image\n"
  printf "   • Configure Stripe (step 3) BEFORE building Docker image\n"
  printf "   • Container App cannot be deployed until image exists in ACR\n"
  printf "\n"
  printf "💡 Why Two Phases?\n"
  printf "   Phase 1 creates infrastructure without requiring a Docker image\n"
  printf "   Phase 2 deploys the Container App once the image is ready\n"
  printf "   This solves the 'chicken and egg' problem!\n"
  printf "\n"
  
  print_success "Foundation infrastructure deployed! 🚀"
  print_info "Continue with step 2 above (assign RBAC roles)"
}

# ============================================================================
# Main Script
# ============================================================================

main() {
  print_header "Azure Infrastructure Deployment"
  
  # Run deployment steps
  check_prerequisites
  collect_parameters
  show_deployment_summary
  validate_bicep
  deploy_infrastructure
  extract_outputs
  generate_env_file
  show_post_deployment_summary
}

# Run main function
main

