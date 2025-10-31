#!/usr/bin/env bash
#
# Docker Build and Push Script
#
# Purpose:
#   Build Docker image and push to Azure Container Registry
#   Automates the manual Docker commands for deployment
#
# Cross-Platform Support:
#   Works on Windows (Git Bash, WSL), macOS, and Linux
#
# Usage:
#   bash scripts/deploy/02a_build_and_push.sh [--yes] [--tag <version>]
#
# Options:
#   --yes             Auto-confirm prompts (non-interactive mode)
#   --tag             Custom image tag (default: latest)
#
# Prerequisites:
#   - Run 01_deploy_infrastructure.sh first
#   - Docker must be running (Docker Desktop on Windows/Mac)
#   - .env.production file must exist
#

set -euo pipefail

# ============================================================================
# Cross-Platform Compatibility
# ============================================================================

# Detect operating system
detect_os() {
  case "$(uname -s)" in
    Linux*)     OS_TYPE="Linux";;
    Darwin*)    OS_TYPE="Mac";;
    CYGWIN*)    OS_TYPE="Windows";;
    MINGW*)     OS_TYPE="Windows";;
    MSYS*)      OS_TYPE="Windows";;
    *)          OS_TYPE="Unknown";;
  esac
}

detect_os

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
DOCKERFILE="docker/Dockerfile"
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
  
  print_info "Detected OS: $OS_TYPE"
  
  # Check for Docker
  if ! command -v docker >/dev/null 2>&1; then
    print_error "Docker is required but not installed."
    case "$OS_TYPE" in
      "Mac")
        print_info "Install Docker Desktop: https://docs.docker.com/desktop/install/mac-install/"
        ;;
      "Windows")
        print_info "Install Docker Desktop: https://docs.docker.com/desktop/install/windows-install/"
        print_info "Or use WSL2 with Docker: https://docs.docker.com/desktop/wsl/"
        ;;
      "Linux")
        print_info "Install Docker Engine: https://docs.docker.com/engine/install/"
        ;;
      *)
        print_info "Install Docker: https://www.docker.com/products/docker-desktop"
        ;;
    esac
    exit 1
  fi
  print_success "Docker is installed"
  
  # Check if Docker daemon is running
  if ! docker info >/dev/null 2>&1; then
    print_error "Docker daemon is not running"
    case "$OS_TYPE" in
      "Mac"|"Windows")
        print_info "Start Docker Desktop and try again"
        ;;
      "Linux")
        print_info "Start Docker daemon: sudo systemctl start docker"
        ;;
      *)
        print_info "Start Docker and try again"
        ;;
    esac
    exit 1
  fi
  print_success "Docker daemon is running"
  
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
  
  # Check if .env.production exists
  if [ ! -f "$ENV_FILE" ]; then
    print_error "$ENV_FILE not found"
    print_info "Run scripts/deploy/01_deploy_infrastructure.sh first"
    exit 1
  fi
  print_success "$ENV_FILE found"
  
  # Check if Dockerfile exists
  if [ ! -f "$DOCKERFILE" ]; then
    print_error "Dockerfile not found: $DOCKERFILE"
    exit 1
  fi
  print_success "Dockerfile found"
}

# ============================================================================
# Load Configuration from .env.production
# ============================================================================

load_config() {
  print_header "Loading Configuration"
  
  # Read ACR login server
  if ! ACR_LOGIN_SERVER=$(grep "^ACR_LOGIN_SERVER=" "$ENV_FILE" | cut -d '=' -f2); then
    print_error "ACR_LOGIN_SERVER not found in $ENV_FILE"
    exit 1
  fi
  
  # Read ACR name
  if ! ACR_NAME=$(grep "^ACR_NAME=" "$ENV_FILE" | cut -d '=' -f2); then
    print_error "ACR_NAME not found in $ENV_FILE"
    exit 1
  fi
  
  # Read Container App name
  if ! CONTAINER_APP_NAME=$(grep "^CONTAINER_APP_NAME=" "$ENV_FILE" | cut -d '=' -f2); then
    print_error "CONTAINER_APP_NAME not found in $ENV_FILE"
    exit 1
  fi
  
  # Build full image name
  IMAGE_NAME="${ACR_LOGIN_SERVER}/${CONTAINER_APP_NAME}:${IMAGE_TAG}"
  
  print_success "Configuration loaded"
  print_info "ACR: $ACR_LOGIN_SERVER"
  print_info "Image: $IMAGE_NAME"
  
  # Check if Stripe is configured
  STRIPE_SECRET=$(grep "^STRIPE_SECRET_KEY=" "$ENV_FILE" | cut -d '=' -f2 || true)
  if [ -z "$STRIPE_SECRET" ] || [ "$STRIPE_SECRET" = "" ]; then
    printf "\n"
    print_warning "Stripe is not configured in $ENV_FILE"
    print_warning "The Docker image will be built without Stripe configuration"
    printf "\n"
    print_info "⚠️  IMPORTANT: If you need Stripe, run this BEFORE building:"
    print_info "   bash scripts/deploy/03_configure_stripe.sh"
    printf "\n"
    if ! confirm "Continue building without Stripe configuration?"; then
      print_info "Build cancelled. Please configure Stripe first."
      exit 0
    fi
  else
    print_success "Stripe configuration detected in $ENV_FILE"
  fi
}

# ============================================================================
# Build Docker Image
# ============================================================================

build_image() {
  print_header "Building Docker Image"
  
  print_info "This may take several minutes..."
  printf "\n"
  
  # Show what we're building
  print_info "Image tag: $IMAGE_TAG"
  print_info "Full image name: $IMAGE_NAME"
  printf "\n"
  
  if ! confirm "Start Docker build?"; then
    print_info "Build cancelled by user"
    exit 0
  fi
  
  # Build the image
  # Note: Using --platform linux/amd64 for compatibility with Azure Container Apps
  # This ensures the image works on Azure regardless of host architecture (Intel/ARM)
  print_info "Building for platform: linux/amd64"
  print_info "Running: docker build --platform linux/amd64 -t $IMAGE_NAME -f $DOCKERFILE ."
  printf "\n"
  
  # On Apple Silicon (M1/M2/M3), Docker may show warnings about platform mismatch
  # This is expected and safe - the image will work correctly on Azure
  if [ "$OS_TYPE" = "Mac" ]; then
    if [[ "$(uname -m)" == "arm64" ]]; then
      print_info "Detected Apple Silicon (ARM) - building for x86_64/amd64"
      print_warning "You may see platform mismatch warnings - this is normal"
      printf "\n"
    fi
  fi
  
  if docker build \
    --platform linux/amd64 \
    -t "$IMAGE_NAME" \
    -f "$DOCKERFILE" \
    .; then
    printf "\n"
    print_success "Docker image built successfully!"
  else
    printf "\n"
    print_error "Docker build failed"
    print_info "Common issues:"
    print_info "  - Check Dockerfile syntax"
    print_info "  - Ensure all source files exist"
    print_info "  - Verify Docker has enough memory (Settings > Resources)"
    exit 1
  fi
  
  # Show image details
  print_info "Image details:"
  docker images "$IMAGE_NAME" --format "table {{.Repository}}\t{{.Tag}}\t{{.Size}}\t{{.CreatedAt}}"
}

# ============================================================================
# Login to Azure Container Registry
# ============================================================================

login_to_acr() {
  print_header "Logging in to Azure Container Registry"
  
  print_info "ACR: $ACR_NAME"
  
  # Login using Azure CLI
  # This uses your current Azure CLI credentials
  if az acr login --name "$ACR_NAME" 2>/dev/null; then
    print_success "Successfully logged in to ACR"
  else
    print_error "Failed to login to ACR"
    print_info "Make sure you have access to the Container Registry"
    exit 1
  fi
}

# ============================================================================
# Push Docker Image to ACR
# ============================================================================

push_image() {
  print_header "Pushing Image to Azure Container Registry"
  
  print_info "This may take several minutes depending on image size and network speed..."
  printf "\n"
  
  if ! confirm "Push image to ACR?"; then
    print_info "Push cancelled by user"
    print_warning "Remember to push the image later before deploying"
    exit 0
  fi
  
  # Push the image
  print_info "Running: docker push $IMAGE_NAME"
  printf "\n"
  
  if docker push "$IMAGE_NAME"; then
    printf "\n"
    print_success "Image pushed successfully!"
  else
    printf "\n"
    print_error "Failed to push image"
    print_info "Check your network connection and ACR permissions"
    exit 1
  fi
}

# ============================================================================
# Verify Image in ACR
# ============================================================================

verify_image() {
  print_header "Verifying Image in ACR"
  
  # List tags for the repository
  print_info "Checking ACR repository: $CONTAINER_APP_NAME"
  
  if az acr repository show-tags \
    --name "$ACR_NAME" \
    --repository "$CONTAINER_APP_NAME" \
    --output table 2>/dev/null; then
    printf "\n"
    print_success "Image verified in ACR"
  else
    print_warning "Could not verify image in ACR (this is usually fine)"
  fi
}

# ============================================================================
# Update Container App (Optional)
# ============================================================================

update_container_app() {
  print_header "Update Container App (Optional)"
  
  print_info "You can update the Container App to use the new image now"
  print_info "or wait until you run the bind secrets script."
  printf "\n"
  
  if ! confirm "Update Container App now?"; then
    print_info "Skipping Container App update"
    print_info "The app will use the new image on next deployment"
    return 0
  fi
  
  # Get resource group
  RESOURCE_GROUP=$(az containerapp show \
    --name "$CONTAINER_APP_NAME" \
    --query resourceGroup \
    -o tsv 2>/dev/null || true)
  
  if [ -z "$RESOURCE_GROUP" ]; then
    print_error "Could not find Container App: $CONTAINER_APP_NAME"
    return 1
  fi
  
  print_info "Updating Container App..."
  printf "\n"
  
  # Update the container app with the new image
  if az containerapp update \
    --name "$CONTAINER_APP_NAME" \
    --resource-group "$RESOURCE_GROUP" \
    --image "$IMAGE_NAME" \
    --output none; then
    print_success "Container App updated successfully!"
    
    # Get the app URL
    APP_URL=$(az containerapp show \
      --name "$CONTAINER_APP_NAME" \
      --resource-group "$RESOURCE_GROUP" \
      --query "properties.configuration.ingress.fqdn" \
      -o tsv)
    
    if [ -n "$APP_URL" ]; then
      print_info "App URL: https://${APP_URL}"
      print_info "Note: App may take 1-2 minutes to start"
    fi
  else
    print_error "Failed to update Container App"
    print_info "You can update it manually later"
  fi
}

# ============================================================================
# Clean Up Old Images (Optional)
# ============================================================================

cleanup_local_images() {
  print_header "Clean Up Local Images (Optional)"
  
  print_info "Docker images can take up significant disk space"
  
  if ! confirm "Remove local Docker image?"; then
    print_info "Keeping local image"
    return 0
  fi
  
  # Remove the local image
  if docker rmi "$IMAGE_NAME" 2>/dev/null; then
    print_success "Local image removed"
  else
    print_warning "Could not remove local image (may not exist)"
  fi
  
  # Offer to prune dangling images
  if confirm "Remove dangling/unused Docker images?"; then
    print_info "Running: docker image prune -f"
    docker image prune -f
    print_success "Dangling images removed"
  fi
}

# ============================================================================
# Summary
# ============================================================================

show_summary() {
  print_header "Build and Push Complete!"
  
  printf "📦 Image Details:\n\n"
  printf "  Registry:     %s\n" "$ACR_LOGIN_SERVER"
  printf "  Repository:   %s\n" "$CONTAINER_APP_NAME"
  printf "  Tag:          %s\n" "$IMAGE_TAG"
  printf "  Full name:    %s\n" "$IMAGE_NAME"
  printf "\n"
  
  printf "📝 Next Steps:\n\n"
  printf "  1. Bind secrets to Container App:\n"
  printf "     bash scripts/deploy/05_bind_secrets.sh\n\n"
  printf "  2. Validate deployment:\n"
  printf "     bash scripts/deploy/00_validate_prerequisites.sh\n\n"
  printf "  3. Test your application:\n"
  printf "     Visit: https://%s\n" "$(grep '^CONTAINER_APP_FQDN=' "$ENV_FILE" 2>/dev/null | cut -d '=' -f2 || echo '<your-app-url>')"
  printf "\n"
  printf "💡 If you need to update Stripe config or other env vars:\n"
  printf "   1. Update %s\n" "$ENV_FILE"
  printf "   2. Rebuild image: bash scripts/deploy/04_build_and_push_image.sh\n"
  printf "   3. Rebind secrets: bash scripts/deploy/05_bind_secrets.sh\n"
  printf "\n"
  
  print_success "Build and push complete! 🚀"
}

# ============================================================================
# Main Script
# ============================================================================

main() {
  print_header "Docker Build and Push to ACR"
  
  # Run steps
  check_prerequisites
  load_config
  build_image
  login_to_acr
  push_image
  verify_image
  update_container_app
  cleanup_local_images
  show_summary
}

# Run main function
main

