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
  
  # Get location from resource group
  LOCATION=$(az group show --name "$RESOURCE_GROUP" --query location -o tsv)
  
  # Build full image name
  IMAGE_NAME="${ACR_LOGIN_SERVER}/${CONTAINER_APP_NAME}:${IMAGE_TAG}"
  
  print_success "Configuration loaded"
  print_info "Resource Group: $RESOURCE_GROUP"
  print_info "Location: $LOCATION"
  print_info "Prefix: $PREFIX"
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
  
  # Deploy Bicep template
  DEPLOYMENT_OUTPUT=$(az deployment group create \
    --resource-group "$RESOURCE_GROUP" \
    --template-file "$BICEP_TEMPLATE" \
    --parameters prefix="$PREFIX" \
                 location="$LOCATION" \
                 containerImageTag="$IMAGE_TAG" \
    --output json)
  
  if [ $? -ne 0 ]; then
    print_error "Container App deployment failed"
    printf "\n"
    print_info "Common issues:"
    print_info "  1. Docker image doesn't exist in ACR"
    print_info "  2. Managed identity doesn't have AcrPull permission"
    print_info "  3. Health check endpoint (/api/health) not responding"
    printf "\n"
    print_info "To fix:"
    print_info "  1. Verify image: az acr repository show-tags --name $ACR_NAME --repository $CONTAINER_APP_NAME"
    print_info "  2. Assign roles: bash scripts/deploy/02_assign_roles.sh"
    print_info "  3. Check app logs in Azure Portal"
    exit 1
  fi
  
  print_success "Container App deployed successfully!"
}

# ============================================================================
# Extract Container App Outputs
# ============================================================================

extract_outputs() {
  print_header "Extracting Container App Information"
  
  # Parse outputs with jq if available, otherwise use az query
  if command -v jq >/dev/null 2>&1; then
    CONTAINER_APP_FQDN=$(printf "%s" "$DEPLOYMENT_OUTPUT" | jq -r '.properties.outputs.containerAppFqdn.value')
    CONTAINER_APP_URL=$(printf "%s" "$DEPLOYMENT_OUTPUT" | jq -r '.properties.outputs.containerAppUrl.value')
  else
    # Fallback: query the Container App directly
    print_warning "Using fallback output extraction (install jq for better results)"
    CONTAINER_APP_FQDN=$(az containerapp show \
      --name "$CONTAINER_APP_NAME" \
      --resource-group "$RESOURCE_GROUP" \
      --query "properties.configuration.ingress.fqdn" -o tsv)
    CONTAINER_APP_URL="https://${CONTAINER_APP_FQDN}"
  fi
  
  if [ -z "$CONTAINER_APP_FQDN" ]; then
    print_error "Could not extract Container App FQDN"
    exit 1
  fi
  
  print_success "Container App URL: $CONTAINER_APP_URL"
}

# ============================================================================
# Update .env.production File
# ============================================================================

update_env_file() {
  print_header "Updating $ENV_FILE"
  
  # Update CONTAINER_APP_FQDN
  if grep -q "^CONTAINER_APP_FQDN=" "$ENV_FILE"; then
    # Use different delimiter for sed since URL contains /
    sed -i.bak "s|^CONTAINER_APP_FQDN=.*|CONTAINER_APP_FQDN=${CONTAINER_APP_FQDN}|" "$ENV_FILE"
  else
    printf "CONTAINER_APP_FQDN=%s\n" "$CONTAINER_APP_FQDN" >> "$ENV_FILE"
  fi
  
  # Update CONTAINER_APP_URL
  if grep -q "^CONTAINER_APP_URL=" "$ENV_FILE"; then
    sed -i.bak "s|^CONTAINER_APP_URL=.*|CONTAINER_APP_URL=${CONTAINER_APP_URL}|" "$ENV_FILE"
  else
    printf "CONTAINER_APP_URL=%s\n" "$CONTAINER_APP_URL" >> "$ENV_FILE"
  fi
  
  # Update NEXTAUTH_URL if it's empty
  if grep -q "^NEXTAUTH_URL=$" "$ENV_FILE" || grep -q "^NEXTAUTH_URL=\"\"$" "$ENV_FILE"; then
    sed -i.bak "s|^NEXTAUTH_URL=.*|NEXTAUTH_URL=${CONTAINER_APP_URL}|" "$ENV_FILE"
    print_info "Updated NEXTAUTH_URL to: $CONTAINER_APP_URL"
  fi
  
  # Add PREFIX if not already there (for future scripts)
  if ! grep -q "^PREFIX=" "$ENV_FILE"; then
    printf "PREFIX=%s\n" "$PREFIX" >> "$ENV_FILE"
  fi
  
  # Clean up backup file
  rm -f "${ENV_FILE}.bak"
  
  print_success "$ENV_FILE updated with Container App URL"
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

