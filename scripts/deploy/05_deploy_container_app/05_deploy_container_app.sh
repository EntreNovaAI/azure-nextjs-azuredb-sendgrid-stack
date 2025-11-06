#!/usr/bin/env bash
#
# Azure Container App Deployment Script - Phase 2
#
# Purpose:
#   Deploy Azure Container App after Docker image has been built and pushed
#   This is Phase 2 of the two-phase deployment strategy
#
# Prerequisites:
#   1. Phase 1 complete (01_deploy_infrastructure.sh)
#   2. RBAC roles assigned (02_assign_roles.sh)
#   3. Docker image built and pushed to ACR (04_build_and_push_image.sh)
#   4. .env.production file exists
#
# What This Script Does:
#   - Deploys Container App using the Docker image in ACR
#   - Updates .env.production with Container App URL
#   - Verifies the deployment
#
# Usage:
#   bash scripts/deploy/05_deploy_container_app.sh [--yes] [--tag <version>]
#
# Options:
#   --yes             Auto-confirm prompts (non-interactive mode)
#   --tag             Docker image tag (default: latest)
#

set -euo pipefail

# Prevent Git Bash from converting Azure resource IDs (which start with /) to Windows paths
# This is critical for Azure CLI commands on Windows
export MSYS_NO_PATHCONV=1

# ============================================================================
# Change to Project Root Directory
# ============================================================================

# Get the directory where this script is located
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# Change to project root (two levels up from scripts/deploy/)
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../../.." && pwd)"
cd "$PROJECT_ROOT"

# ============================================================================
# Configuration
# ============================================================================

ENV_FILE=".env.production"
BICEP_TEMPLATE="infrastructure/bicep/main-app.bicep"
DEFAULT_TAG="latest"

# ============================================================================
# Parse Arguments
# ============================================================================

AUTO_YES=false
IMAGE_TAG="$DEFAULT_TAG"

while [ $# -gt 0 ]; do
  case "$1" in
    --yes)
      AUTO_YES=true
      shift
      ;;
    --tag)
      IMAGE_TAG="$2"
      shift 2
      ;;
    *)
      printf "Unknown option: %s\n" "$1"
      printf "Usage: %s [--yes] [--tag <version>]\n" "$0"
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
# Defaults to YES - user must explicitly type 'n' or 'no' to decline
confirm() {
  if [ "$AUTO_YES" = true ]; then
    return 0
  fi
  
  local prompt="$1"
  local response
  printf "%s [Y/n]: " "$prompt"
  read -r response
  
  case "$response" in
    [nN]|[nN][oO])
      # User explicitly declined
      return 1
      ;;
    *)
      # Empty or any other input = yes (default)
      return 0
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
  
  # Check if .env.production exists
  if [ ! -f "$ENV_FILE" ]; then
    print_error "$ENV_FILE not found"
    print_info "Run scripts/deploy/01_deploy_infrastructure.sh first"
    exit 1
  fi
  print_success "$ENV_FILE found"
  
  # Check if Bicep template exists
  if [ ! -f "$BICEP_TEMPLATE" ]; then
    print_error "Bicep template not found: $BICEP_TEMPLATE"
    exit 1
  fi
  print_success "Bicep template found"
  
  # Check for jq (optional but helpful)
  if ! command -v jq >/dev/null 2>&1; then
    print_warning "jq is not installed (recommended for better JSON parsing)"
    print_info "Install: brew install jq (macOS) or apt install jq (Linux)"
  else
    print_success "jq is installed"
  fi
}

# ============================================================================
# Load Configuration from .env.production
# ============================================================================

load_config() {
  print_header "Loading Configuration"
  
  # Read required values from .env.production
  if ! RESOURCE_GROUP=$(grep "^RESOURCE_GROUP=" "$ENV_FILE" | cut -d '=' -f2); then
    print_error "RESOURCE_GROUP not found in $ENV_FILE"
    exit 1
  fi
  
  if ! PREFIX=$(grep "^PREFIX=" "$ENV_FILE" 2>/dev/null | cut -d '=' -f2); then
    # Try to infer from ACR_NAME if PREFIX not set
    ACR_NAME=$(grep "^ACR_NAME=" "$ENV_FILE" | cut -d '=' -f2)
    PREFIX=$(echo "$ACR_NAME" | sed 's/acr.*//')
    if [ -z "$PREFIX" ]; then
      print_error "Could not determine PREFIX from $ENV_FILE"
      printf "Enter resource prefix: "
      read -r PREFIX
    fi
  fi
  
  if ! ACR_LOGIN_SERVER=$(grep "^ACR_LOGIN_SERVER=" "$ENV_FILE" | cut -d '=' -f2); then
    print_error "ACR_LOGIN_SERVER not found in $ENV_FILE"
    exit 1
  fi
  
  if ! ACR_NAME=$(grep "^ACR_NAME=" "$ENV_FILE" | cut -d '=' -f2); then
    print_error "ACR_NAME not found in $ENV_FILE"
    exit 1
  fi
  
  if ! CONTAINER_APP_NAME=$(grep "^CONTAINER_APP_NAME=" "$ENV_FILE" | cut -d '=' -f2); then
    print_error "CONTAINER_APP_NAME not found in $ENV_FILE"
    exit 1
  fi
  
  # Read Container App Environment ID (REQUIRED - from Phase 1)
  CONTAINER_APP_ENV_ID=$(grep "^CONTAINER_APP_ENV_ID=" "$ENV_FILE" 2>/dev/null | cut -d '=' -f2 || true)
  
  # Query Managed Identity ID dynamically from resource group
  # This allows the script to work even if .env.production doesn't have it yet
  print_info "Querying managed identity from resource group..."
  MANAGED_IDENTITY_ID=$(az identity list \
    --resource-group "$RESOURCE_GROUP" \
    --query "[?contains(name, '${CONTAINER_APP_NAME}-identity')].id | [0]" \
    -o tsv)
  
  # Read App Insights name (OPTIONAL - from Phase 1)
  APP_INSIGHTS_NAME=$(grep "^APP_INSIGHTS_NAME=" "$ENV_FILE" 2>/dev/null | cut -d '=' -f2 || true)
  
  # Get location from managed identity (ensures consistent regional deployment)
  LOCATION=$(az identity show --ids "$MANAGED_IDENTITY_ID" --query location -o tsv)
  
  # Build full image name
  IMAGE_NAME="${ACR_LOGIN_SERVER}/${CONTAINER_APP_NAME}:${IMAGE_TAG}"
  
  print_success "Configuration loaded"
  print_info "Resource Group: $RESOURCE_GROUP"
  print_info "Location: $LOCATION"
  print_info "Prefix: $PREFIX"
  print_info "ACR Name: $ACR_NAME"
  print_info "Container App: $CONTAINER_APP_NAME"
  print_info "Image: $IMAGE_NAME"
}

# ============================================================================
# Verify Docker Image Exists in ACR
# ============================================================================

verify_image_exists() {
  print_header "Verifying Docker Image in ACR"
  
  print_info "Checking if image exists: $IMAGE_NAME"
  
  # Check if the repository exists and has the specified tag
  if az acr repository show-tags \
    --name "$ACR_NAME" \
    --repository "$CONTAINER_APP_NAME" \
    --output table 2>/dev/null | grep -q "$IMAGE_TAG"; then
    print_success "Docker image found in ACR"
  else
    print_error "Docker image not found in ACR"
    print_info "Available tags for $CONTAINER_APP_NAME:"
    az acr repository show-tags \
      --name "$ACR_NAME" \
      --repository "$CONTAINER_APP_NAME" \
      --output table 2>/dev/null || print_warning "No tags found"
    printf "\n"
    print_info "Build and push the Docker image first:"
    print_info "  bash scripts/deploy/04_build_and_push_image.sh"
    exit 1
  fi
}

# ============================================================================
# Verify RBAC Roles
# ============================================================================

verify_rbac_roles() {
  print_header "Verifying RBAC Roles"
  
  print_info "Checking if managed identity has AcrPull permission..."
  
  # Get the managed identity principal ID
  IDENTITY_NAME="${CONTAINER_APP_NAME}-identity"
  
  if ! az identity show \
    --resource-group "$RESOURCE_GROUP" \
    --name "$IDENTITY_NAME" >/dev/null 2>&1; then
    print_error "Managed identity not found: $IDENTITY_NAME"
    print_info "Phase 1 deployment may have failed"
    exit 1
  fi
  
  print_success "Managed identity exists"
  print_warning "Note: RBAC role verification may require additional permissions"
  print_info "If deployment fails with ACR access errors, run:"
  print_info "  bash scripts/deploy/02_assign_roles.sh"
}

# ============================================================================
# Show Deployment Summary
# ============================================================================

show_deployment_summary() {
  print_header "Deployment Summary"
  
  printf "Resource Group:      %s\n" "$RESOURCE_GROUP"
  printf "Location:            %s\n" "$LOCATION"
  printf "Prefix:              %s\n" "$PREFIX"
  printf "Container App:       %s\n" "$CONTAINER_APP_NAME"
  printf "Docker Image:        %s\n" "$IMAGE_NAME"
  printf "\n"
  
  print_info "This will deploy the Container App to Azure"
  printf "\n"
}

# ============================================================================
# Deploy Container App
# ============================================================================

deploy_container_app() {
  print_header "Deploying Container App (Phase 2)"
  
  if ! confirm "Proceed with Container App deployment?"; then
    print_info "Deployment cancelled by user"
    exit 0
  fi
  
  print_info "Starting deployment (this may take 3-5 minutes)..."
  printf "\n"
  
  # Validate required parameters from Phase 1 are available
  # These MUST match the exact resource IDs from Phase 1 deployment
  if [ -z "$CONTAINER_APP_ENV_ID" ]; then
    print_error "CONTAINER_APP_ENV_ID not found in .env.production"
    print_info "This parameter is REQUIRED and must match Phase 1 deployment"
    print_info "Run: bash scripts/deploy/01_deploy_foundation.sh first"
    exit 1
  fi
  print_info "Using Container App Environment: $CONTAINER_APP_ENV_ID"
  
  # Validate that managed identity was found in the resource group
  if [ -z "$MANAGED_IDENTITY_ID" ] || [ "$MANAGED_IDENTITY_ID" = "null" ]; then
    print_error "Managed Identity not found in resource group: $RESOURCE_GROUP"
    print_info "Expected identity name: ${CONTAINER_APP_NAME}-identity"
    print_info "This resource should have been created in Phase 1"
    print_info "Run: bash scripts/deploy/01_deploy_foundation.sh first"
    exit 1
  fi
  print_info "Using Managed Identity: $MANAGED_IDENTITY_ID"
  
  # App Insights is optional - only warn if not found
  if [ -z "$APP_INSIGHTS_NAME" ]; then
    print_warning "APP_INSIGHTS_NAME not found in .env.production"
    print_info "App Insights integration will be disabled"
    print_info "To enable monitoring, run: bash scripts/deploy/01_deploy_foundation.sh"
    APP_INSIGHTS_NAME=""  # Set to empty string for Bicep parameter
  else
    print_info "Using App Insights: $APP_INSIGHTS_NAME"
  fi
  
  # Build parameters for Bicep deployment
  # Pass actual resource IDs/names from .env.production to avoid naming mismatches
  # Note: Location is derived from ACR in Bicep template to ensure consistency
  
  print_info "Bicep deployment parameters:"
  print_info "  - prefix: $PREFIX"
  print_info "  - containerImageTag: $IMAGE_TAG"
  print_info "  - acrName: $ACR_NAME"
  print_info "  - containerAppEnvId: $CONTAINER_APP_ENV_ID"
  print_info "  - managedIdentityId: $MANAGED_IDENTITY_ID"
  print_info "  - appInsightsName: ${APP_INSIGHTS_NAME:-<not set>}"
  printf "\n"
  
  BICEP_PARAMS=(
    --resource-group "$RESOURCE_GROUP"
    --template-file "$BICEP_TEMPLATE"
    --parameters prefix="$PREFIX"
                 containerImageTag="$IMAGE_TAG"
                 acrName="$ACR_NAME"
                 containerAppEnvId="$CONTAINER_APP_ENV_ID"
                 managedIdentityId="$MANAGED_IDENTITY_ID"
                 appInsightsName="$APP_INSIGHTS_NAME"
  )
  
  # Deploy Bicep template with actual resource names
  # Note: Error output is shown automatically by az CLI
  print_info "Running Bicep deployment..."
  print_info "Template: $BICEP_TEMPLATE"
  printf "\n"
  
  if ! DEPLOYMENT_OUTPUT=$(az deployment group create "${BICEP_PARAMS[@]}" --output json 2>&1); then
    print_error "Container App deployment failed"
    printf "\n"
    print_error "Deployment output:"
    echo "$DEPLOYMENT_OUTPUT"
    printf "\n"
    print_info "Common issues:"
    print_info "  1. Docker image doesn't exist in ACR"
    print_info "  2. Managed identity doesn't have AcrPull permission"
    print_info "  3. Parameter mismatch with Phase 1 resources"
    print_info "  4. Resource naming conflicts"
    printf "\n"
    print_info "To fix:"
    print_info "  1. Verify image: az acr repository show-tags --name $ACR_NAME --repository $CONTAINER_APP_NAME"
    print_info "  2. Assign roles: bash scripts/deploy/02_assign_roles.sh"
    print_info "  3. Check deployment details in Azure Portal"
    exit 1
  fi
  
  print_success "Container App deployed successfully!"
}

# ============================================================================
# Extract Container App Outputs
# ============================================================================

extract_outputs() {
  print_header "Extracting Container App Information"
  
  # Try to parse outputs with jq if available, otherwise query directly
  if command -v jq >/dev/null 2>&1; then
    # Check if DEPLOYMENT_OUTPUT is valid JSON before parsing
    if printf "%s" "$DEPLOYMENT_OUTPUT" | jq empty 2>/dev/null; then
      CONTAINER_APP_FQDN=$(printf "%s" "$DEPLOYMENT_OUTPUT" | jq -r '.properties.outputs.containerAppFqdn.value' 2>/dev/null || echo "")
      CONTAINER_APP_URL=$(printf "%s" "$DEPLOYMENT_OUTPUT" | jq -r '.properties.outputs.containerAppUrl.value' 2>/dev/null || echo "")
    else
      print_warning "Deployment output is not valid JSON, querying Container App directly..."
      CONTAINER_APP_FQDN=""
      CONTAINER_APP_URL=""
    fi
  else
    print_warning "jq not installed, querying Container App directly..."
    CONTAINER_APP_FQDN=""
    CONTAINER_APP_URL=""
  fi
  
  # Fallback: query the Container App directly if parsing failed
  if [ -z "$CONTAINER_APP_FQDN" ] || [ "$CONTAINER_APP_FQDN" = "null" ]; then
    print_info "Querying Container App for FQDN..."
    CONTAINER_APP_FQDN=$(az containerapp show \
      --name "$CONTAINER_APP_NAME" \
      --resource-group "$RESOURCE_GROUP" \
      --query "properties.configuration.ingress.fqdn" -o tsv 2>/dev/null || echo "")
    
    if [ -n "$CONTAINER_APP_FQDN" ] && [ "$CONTAINER_APP_FQDN" != "null" ]; then
      CONTAINER_APP_URL="https://${CONTAINER_APP_FQDN}"
    fi
  fi
  
  # Final validation
  if [ -z "$CONTAINER_APP_FQDN" ] || [ "$CONTAINER_APP_FQDN" = "null" ]; then
    print_error "Could not extract Container App FQDN"
    print_info "The deployment may have succeeded but the Container App is not ready yet"
    print_info "Check Azure Portal or run: az containerapp show --name $CONTAINER_APP_NAME --resource-group $RESOURCE_GROUP"
    exit 1
  fi
  
  print_success "Container App URL: $CONTAINER_APP_URL"
}

# ============================================================================
# Update .env.production File
# ============================================================================

update_env_file() {
  print_header "Updating $ENV_FILE"
  
  # Create a temporary file for updates
  local temp_file
  temp_file=$(mktemp -t env.XXXXXX)
  
  # Copy existing file to temp
  cp "$ENV_FILE" "$temp_file"
  
  # Function to update or add a variable
  # This preserves all other variables in the file
  update_or_add_var() {
    local key="$1"
    local value="$2"
    local temp_file="${3:-$temp_file}"  # Use parameter or fall back to outer scope
    
    # Escape special characters for sed (/, &, \, newlines)
    local escaped_value=$(printf '%s' "$value" | sed 's/[&/\]/\\&/g')
    
    # Check if variable exists
    if grep -q "^${key}=" "$temp_file"; then
      # Update existing variable (portable sed)
      local sed_temp
      sed_temp=$(mktemp -t sed.XXXXXX)
      sed "s|^${key}=.*|${key}=${escaped_value}|" "$temp_file" > "$sed_temp"
      mv "$sed_temp" "$temp_file"
    elif grep -q "^#${key}=" "$temp_file"; then
      # Variable exists but is commented out - uncomment and update
      local sed_temp
      sed_temp=$(mktemp -t sed.XXXXXX)
      sed "s|^#${key}=.*|${key}=${escaped_value}|" "$temp_file" > "$sed_temp"
      mv "$sed_temp" "$temp_file"
    else
      # Add new variable at the end
      printf "\n%s=%s\n" "$key" "$value" >> "$temp_file"
    fi
  }
  
  print_info "Updating Container App URLs..."
  
  # Update Container App variables
  update_or_add_var "CONTAINER_APP_FQDN" "$CONTAINER_APP_FQDN" "$temp_file"
  update_or_add_var "CONTAINER_APP_URL" "$CONTAINER_APP_URL" "$temp_file"
  
  # Update NEXTAUTH_URL (set to Container App URL for production)
  update_or_add_var "NEXTAUTH_URL" "$CONTAINER_APP_URL" "$temp_file"
  print_info "Updated NEXTAUTH_URL to: $CONTAINER_APP_URL"
  
  # Add PREFIX if not already there (for future scripts)
  if ! grep -q "^PREFIX=" "$temp_file"; then
    printf "\n# Resource prefix for Azure resources\nPREFIX=%s\n" "$PREFIX" >> "$temp_file"
  fi
  
  # Move temp file to original
  mv "$temp_file" "$ENV_FILE"
  
  print_success "$ENV_FILE updated with Container App URLs"
  print_info "✓ Updated: CONTAINER_APP_FQDN, CONTAINER_APP_URL, NEXTAUTH_URL"
  print_info "✓ All other variables preserved (Google Auth, MailerSend, Stripe, etc.)"
}

# ============================================================================
# Verify Deployment
# ============================================================================

verify_deployment() {
  print_header "Verifying Deployment"
  
  print_info "Checking Container App status..."
  
  # Get Container App status
  STATUS=$(az containerapp show \
    --name "$CONTAINER_APP_NAME" \
    --resource-group "$RESOURCE_GROUP" \
    --query "properties.runningStatus" -o tsv 2>/dev/null || echo "Unknown")
  
  if [ "$STATUS" = "Running" ]; then
    print_success "Container App is running!"
  else
    print_warning "Container App status: $STATUS"
    print_info "The app may still be starting up. Check status in Azure Portal."
  fi
  
  printf "\n"
  print_info "Testing health endpoint (this may take 30-60 seconds)..."
  
  # Wait a moment for the app to start
  sleep 10
  
  # Try to access health endpoint
  HEALTH_URL="${CONTAINER_APP_URL}/api/health"
  if curl -f -s -o /dev/null -w "%{http_code}" "$HEALTH_URL" --max-time 30 | grep -q "200"; then
    print_success "Health check passed!"
  else
    print_warning "Health check endpoint not responding yet"
    print_info "This is normal if the app is still starting"
    print_info "Check logs: az containerapp logs show --name $CONTAINER_APP_NAME --resource-group $RESOURCE_GROUP"
  fi
}

# ============================================================================
# Post-Deployment Summary
# ============================================================================

show_post_deployment_summary() {
  print_header "Phase 2 Deployment Complete!"
  
  printf "📦 Container App Deployed:\n\n"
  printf "  Name:            %s\n" "$CONTAINER_APP_NAME"
  printf "  URL:             %s\n" "$CONTAINER_APP_URL"
  printf "  Image:           %s\n" "$IMAGE_NAME"
  printf "  Resource Group:  %s\n" "$RESOURCE_GROUP"
  printf "\n"
  
  printf "📝 Next Steps:\n\n"
  printf "  1. Bind environment variables and secrets:\n"
  printf "     bash scripts/deploy/06_bind_secrets.sh\n\n"
  printf "  2. Test your application:\n"
  printf "     Visit: %s\n\n" "$CONTAINER_APP_URL"
  printf "  3. View logs (if needed):\n"
  printf "     az containerapp logs show \\\n"
  printf "       --name %s \\\n" "$CONTAINER_APP_NAME"
  printf "       --resource-group %s \\\n" "$RESOURCE_GROUP"
  printf "       --follow\n"
  printf "\n"
  printf "⚠️  Important:\n"
  printf "   • App may take 1-2 minutes to fully start\n"
  printf "   • Configure secrets (step 1) for full functionality\n"
  printf "   • Check Azure Portal for detailed deployment status\n"
  printf "\n"
  
  print_success "Container App deployment complete! 🚀"
  print_info "Your app is now live at: $CONTAINER_APP_URL"
}

# ============================================================================
# Main Script
# ============================================================================

main() {
  print_header "Azure Container App Deployment - Phase 2"
  
  # Run deployment steps
  check_prerequisites
  load_config
  verify_image_exists
  verify_rbac_roles
  show_deployment_summary
  deploy_container_app
  extract_outputs
  update_env_file
  verify_deployment
  show_post_deployment_summary
}

# Run main function
main

