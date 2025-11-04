#!/usr/bin/env bash
#
# Stripe Production Setup Script
#
# Purpose:
#   Set up live Stripe products for production environment
#   Update .env.production or Azure Key Vault with live credentials
#
# Usage:
#   bash scripts/deploy/03_configure_stripe/03_configure_stripe.sh [OPTIONS]
#
# Options:
#   --yes              Auto-confirm prompts (non-interactive mode)
#   --keyvault         Store secrets directly in Azure Key Vault
#   --update-webhook   Update Stripe webhook endpoint with Container App URL should run this if wanting to use test stripe with live app, run after 05_deploy_container_app.sh
#

set -euo pipefail

# ============================================================================
# Change to Project Root Directory
# ============================================================================

# Get the directory where this script is located
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# Change to project root (three levels up from scripts/deploy/02_assign_roles/)
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../../.." && pwd)"
cd "$PROJECT_ROOT"

# ============================================================================
# Configuration
# ============================================================================

ENV_FILE=".env.production"
BASIC_PRODUCT_NAME="Basic Plan"
PREMIUM_PRODUCT_NAME="Premium Plan"
DEFAULT_BASIC_PRICE="9.99"
DEFAULT_PREMIUM_PRICE="29.99"

# ============================================================================
# Parse Arguments
# ============================================================================

AUTO_YES=false
USE_KEYVAULT=false
UPDATE_WEBHOOK=false

while [ $# -gt 0 ]; do
  case "$1" in
    --yes)
      AUTO_YES=true
      shift
      ;;
    --keyvault)
      USE_KEYVAULT=true
      shift
      ;;
    --update-webhook)
      UPDATE_WEBHOOK=true
      shift
      ;;
    *)
      printf "Unknown option: %s\n" "$1"
      printf "Usage: %s [--yes] [--keyvault] [--update-webhook]\n" "$0"
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
  
  printf "%s [%s]: " "$prompt" "$default"
  read -r response
  
  if [ -z "$response" ]; then
    printf "%s" "$default"
  else
    printf "%s" "$response"
  fi
}

# ============================================================================
# Live Mode Warning
# ============================================================================

show_live_mode_warning() {
  print_header "⚠️  STRIPE PRODUCTION MODE WARNING ⚠️"
  
  printf "This script will configure Stripe in LIVE MODE.\n\n"
  printf "IMPORTANT:\n"
  printf "  • This uses REAL payment processing\n"
  printf "  • Real charges will be made to customers\n"
  printf "  • Your Stripe account must be activated for live mode\n"
  printf "  • You should have completed test mode verification\n\n"
  
  print_warning "Only proceed if you understand the implications!"
  printf "\n"
  
  if ! confirm "Do you want to continue with LIVE MODE setup?"; then
    print_info "Setup cancelled by user"
    exit 0
  fi
  
  printf "\n"
  if ! confirm "Are you absolutely sure? Type 'yes' to confirm"; then
    print_info "Setup cancelled by user"
    exit 0
  fi
}

# ============================================================================
# Check Prerequisites
# ============================================================================

check_prerequisites() {
  print_header "Checking Prerequisites"
  
  # Check for curl
  if ! command -v curl >/dev/null 2>&1; then
    print_error "curl is required but not installed."
    exit 1
  fi
  print_success "curl is installed"
  
  # Check for jq (optional but helpful)
  if ! command -v jq >/dev/null 2>&1; then
    print_warning "jq is not installed (recommended)"
  else
    print_success "jq is installed"
  fi
  
  # If using Key Vault, check for Azure CLI
  if [ "$USE_KEYVAULT" = true ]; then
    if ! command -v az >/dev/null 2>&1; then
      print_error "Azure CLI is required for Key Vault option"
      exit 1
    fi
    
    if ! az account show >/dev/null 2>&1; then
      print_error "Not logged in to Azure CLI"
      print_info "Run: az login"
      exit 1
    fi
    print_success "Azure CLI is available"
  fi
  
  # Check if .env.production exists
  if [ "$USE_KEYVAULT" = false ] && [ ! -f "$ENV_FILE" ]; then
    print_error "$ENV_FILE not found"
    print_info "Run scripts/deploy/01_az_deploy_infra.sh first"
    exit 1
  fi
}

# ============================================================================
# Collect Stripe API Keys
# ============================================================================

collect_stripe_keys() {
  print_header "Collect Stripe Live API Keys"
  
  print_warning "You need Stripe LIVE mode API keys"
  print_info "Get them from: https://dashboard.stripe.com/apikeys"
  print_info "Make sure you're viewing LIVE keys (not test keys)"
  printf "\n"
  
  # Collect Secret Key
  local secret_key
  while true; do
    printf "Enter your Stripe LIVE secret key (sk_live_...): "
    read -rs secret_key
    printf "\n"
    
    # Validate format
    if [[ "$secret_key" =~ ^sk_live_ ]]; then
      break
    else
      print_error "Invalid key format. Must start with 'sk_live_'"
      print_error "Make sure you're using LIVE mode keys, not test keys!"
    fi
  done
  
  # Explicit confirmation for live key
  printf "\n"
  print_warning "You entered a LIVE mode secret key"
  if ! confirm "Is this correct?"; then
    print_info "Setup cancelled by user"
    exit 0
  fi
  
  # Collect Publishable Key
  local publishable_key
  while true; do
    printf "\nEnter your Stripe LIVE publishable key (pk_live_...): "
    read -r publishable_key
    
    # Validate format
    if [[ "$publishable_key" =~ ^pk_live_ ]]; then
      break
    else
      print_error "Invalid key format. Must start with 'pk_live_'"
    fi
  done
  
  # Export for use in product creation
  STRIPE_SECRET_KEY="$secret_key"
  STRIPE_PUBLISHABLE_KEY="$publishable_key"
  
  print_success "API keys collected"
}

# ============================================================================
# Create Stripe Products
# ============================================================================

create_stripe_product() {
  local product_name="$1"
  local price="$2"
  
  print_info "Creating product: $product_name"
  
  # Create product
  local product_response
  product_response=$(curl -s -X POST https://api.stripe.com/v1/products \
    -u "${STRIPE_SECRET_KEY}:" \
    -d "name=${product_name}" \
    -d "type=service")
  
  # Extract product ID
  local product_id
  if command -v jq >/dev/null 2>&1; then
    product_id=$(printf "%s" "$product_response" | jq -r '.id')
  else
    # Fallback parsing without jq
    product_id=$(printf "%s" "$product_response" | grep -o '"id":"prod_[^"]*"' | head -1 | cut -d'"' -f4)
  fi
  
  if [ -z "$product_id" ] || [ "$product_id" = "null" ]; then
    print_error "Failed to create product: $product_name"
    print_error "Response: $product_response"
    exit 1
  fi
  
  print_success "Created product: $product_id"
  
  # Create price for the product
  print_info "Creating monthly price: \$$price"
  
  local price_amount
  # Convert dollars to cents
  price_amount=$(printf "%.0f" "$(echo "$price * 100" | bc 2>/dev/null || echo "${price}00")")
  
  local price_response
  price_response=$(curl -s -X POST https://api.stripe.com/v1/prices \
    -u "${STRIPE_SECRET_KEY}:" \
    -d "product=${product_id}" \
    -d "unit_amount=${price_amount}" \
    -d "currency=usd" \
    -d "recurring[interval]=month")
  
  # Extract price ID
  local price_id
  if command -v jq >/dev/null 2>&1; then
    price_id=$(printf "%s" "$price_response" | jq -r '.id')
  else
    # Fallback parsing without jq
    price_id=$(printf "%s" "$price_response" | grep -o '"id":"price_[^"]*"' | head -1 | cut -d'"' -f4)
  fi
  
  if [ -z "$price_id" ] || [ "$price_id" = "null" ]; then
    print_error "Failed to create price for product: $product_id"
    print_error "Response: $price_response"
    exit 1
  fi
  
  print_success "Created price: $price_id"
  print_info "Price ID (for reference): $price_id"
  
  # Return product ID
  printf "%s" "$product_id"
}

create_subscription_products() {
  print_header "Create Subscription Products"
  
  print_info "This will create two monthly subscription products in Stripe LIVE mode:"
  print_info "1. Basic Plan"
  print_info "2. Premium Plan"
  printf "\n"
  
  # Get pricing from user
  BASIC_PRICE=$(read_with_default "Basic Plan monthly price (USD)" "$DEFAULT_BASIC_PRICE")
  PREMIUM_PRICE=$(read_with_default "Premium Plan monthly price (USD)" "$DEFAULT_PREMIUM_PRICE")
  
  printf "\n"
  print_warning "These are LIVE products. Real customers will see these prices."
  
  if ! confirm "Create products with these prices?"; then
    print_info "Cancelled by user"
    exit 0
  fi
  
  # Create Basic product
  printf "\n"
  BASIC_PRODUCT_ID=$(create_stripe_product "$BASIC_PRODUCT_NAME" "$BASIC_PRICE")
  
  # Create Premium product
  printf "\n"
  PREMIUM_PRODUCT_ID=$(create_stripe_product "$PREMIUM_PRODUCT_NAME" "$PREMIUM_PRICE")
  
  printf "\n"
  print_success "All products created successfully!"
}

# ============================================================================
# Update .env.production File
# ============================================================================

update_env_file() {
  print_header "Update $ENV_FILE"
  
  # Check if .env.production exists, if not and .env.local exists, copy it
  if [ ! -f "$ENV_FILE" ] && [ -f ".env.local" ]; then
    print_info "Creating $ENV_FILE from .env.local..."
    cp .env.local "$ENV_FILE"
    print_success "Copied .env.local to $ENV_FILE"
  elif [ ! -f "$ENV_FILE" ]; then
    print_error "$ENV_FILE not found and .env.local not available"
    print_info "Run scripts/deploy/01_deploy_infrastructure.sh first"
    exit 1
  fi
  
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
  
  print_info "Updating Stripe configuration variables..."
  
  # Update variables (DO NOT echo values to console for security)
  update_or_add_var "STRIPE_SECRET_KEY" "$STRIPE_SECRET_KEY" "$temp_file"
  update_or_add_var "NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY" "$STRIPE_PUBLISHABLE_KEY" "$temp_file"
  update_or_add_var "STRIPE_SUBSCRIPTION_ID_BASIC" "$BASIC_PRODUCT_ID" "$temp_file"
  update_or_add_var "STRIPE_SUBSCRIPTION_ID_PREMIUM" "$PREMIUM_PRODUCT_ID" "$temp_file"
  
  # Move temp file to original
  mv "$temp_file" "$ENV_FILE"
  
  print_success "$ENV_FILE updated with Stripe credentials"
  print_info "✓ Updated Stripe variables (existing vars like Google Auth preserved)"
  print_info "✓ Updated: STRIPE_SECRET_KEY, NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY"
  print_info "✓ Updated: STRIPE_SUBSCRIPTION_ID_BASIC, STRIPE_SUBSCRIPTION_ID_PREMIUM"
  print_warning "Secret values are NOT displayed for security"
}

# ============================================================================
# Store Secrets in Azure Key Vault
# ============================================================================

store_in_keyvault() {
  print_header "Store Secrets in Azure Key Vault"
  
  # Get Key Vault name from .env.production or prompt
  if [ -f "$ENV_FILE" ]; then
    KEY_VAULT_NAME=$(grep "^KEY_VAULT_NAME=" "$ENV_FILE" | cut -d'=' -f2)
  fi
  
  if [ -z "$KEY_VAULT_NAME" ]; then
    printf "Enter Key Vault name: "
    read -r KEY_VAULT_NAME
  fi
  
  if [ -z "$KEY_VAULT_NAME" ]; then
    print_error "Key Vault name is required"
    exit 1
  fi
  
  print_info "Using Key Vault: $KEY_VAULT_NAME"
  
  # Verify Key Vault exists
  if ! az keyvault show --name "$KEY_VAULT_NAME" >/dev/null 2>&1; then
    print_error "Key Vault not found: $KEY_VAULT_NAME"
    exit 1
  fi
  
  print_info "Storing secrets in Key Vault..."
  
  # Store secrets (suppress output for security)
  # Note: NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY is NOT stored in Key Vault
  # because it's a public value needed at Docker build time, not runtime
  az keyvault secret set --vault-name "$KEY_VAULT_NAME" --name "STRIPE-SECRET-KEY" --value "$STRIPE_SECRET_KEY" --output none
  az keyvault secret set --vault-name "$KEY_VAULT_NAME" --name "STRIPE-SUBSCRIPTION-ID-BASIC" --value "$BASIC_PRODUCT_ID" --output none
  az keyvault secret set --vault-name "$KEY_VAULT_NAME" --name "STRIPE-SUBSCRIPTION-ID-PREMIUM" --value "$PREMIUM_PRODUCT_ID" --output none
  
  print_success "Secrets stored in Key Vault"
  print_info "Secret names (dashes replace underscores for Key Vault compatibility):"
  print_info "  - STRIPE-SECRET-KEY"
  print_info "  - STRIPE-SUBSCRIPTION-ID-BASIC"
  print_info "  - STRIPE-SUBSCRIPTION-ID-PREMIUM"
  printf "\n"
  print_info "Note: NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY is stored in .env.production"
  print_info "      (not in Key Vault) because it's needed at Docker build time"
}

# ============================================================================
# Update Stripe Webhook
# ============================================================================

update_stripe_webhook() {
  print_header "Update Stripe Webhook"
  
  # Check if .env.production exists
  if [ ! -f "$ENV_FILE" ]; then
    print_error "$ENV_FILE not found"
    print_info "Run scripts/deploy/01_deploy_infrastructure/01_deploy_infrastructure.sh first"
    exit 1
  fi
  
  # Get Container App URL from .env.production
  CONTAINER_APP_URL=$(grep "^CONTAINER_APP_URL=" "$ENV_FILE" | cut -d'=' -f2)
  
  if [ -z "$CONTAINER_APP_URL" ]; then
    print_error "CONTAINER_APP_URL not found in $ENV_FILE"
    print_info "Run scripts/deploy/05_deploy_container_app/05_deploy_container_app.sh first"
    exit 1
  fi
  
  # Get Stripe secret key
  STRIPE_SECRET_KEY=$(grep "^STRIPE_SECRET_KEY=" "$ENV_FILE" | cut -d'=' -f2)
  
  if [ -z "$STRIPE_SECRET_KEY" ]; then
    print_error "STRIPE_SECRET_KEY not found in $ENV_FILE"
    print_info "Configure Stripe first (run without --update-webhook flag)"
    exit 1
  fi
  
  # Construct webhook URL
  WEBHOOK_URL="${CONTAINER_APP_URL}/api/stripe/webhooks"
  
  print_info "Container App URL: $CONTAINER_APP_URL"
  print_info "Webhook URL: $WEBHOOK_URL"
  printf "\n"
  
  # List existing webhooks
  print_info "Fetching existing webhooks..."
  local webhooks_response
  webhooks_response=$(curl -s -X GET https://api.stripe.com/v1/webhook_endpoints \
    -u "${STRIPE_SECRET_KEY}:")
  
  # Check if webhook already exists
  local existing_webhook_id=""
  if command -v jq >/dev/null 2>&1; then
    existing_webhook_id=$(printf "%s" "$webhooks_response" | jq -r ".data[] | select(.url==\"$WEBHOOK_URL\") | .id" | head -1)
  fi
  
  if [ -n "$existing_webhook_id" ] && [ "$existing_webhook_id" != "null" ]; then
    print_warning "Webhook already exists with ID: $existing_webhook_id"
    
    if ! confirm "Update existing webhook?"; then
      print_info "Keeping existing webhook"
      return 0
    fi
    
    # Update existing webhook
    print_info "Updating webhook..."
    local update_response
    update_response=$(curl -s -X POST "https://api.stripe.com/v1/webhook_endpoints/${existing_webhook_id}" \
      -u "${STRIPE_SECRET_KEY}:" \
      -d "enabled_events[]=checkout.session.completed" \
      -d "enabled_events[]=customer.subscription.created" \
      -d "enabled_events[]=customer.subscription.updated" \
      -d "enabled_events[]=customer.subscription.deleted")
    
    print_success "Webhook updated: $existing_webhook_id"
  else
    # Create new webhook
    print_info "Creating new webhook..."
    
    if ! confirm "Create webhook endpoint at: $WEBHOOK_URL?"; then
      print_info "Webhook creation cancelled"
      exit 0
    fi
    
    local create_response
    create_response=$(curl -s -X POST https://api.stripe.com/v1/webhook_endpoints \
      -u "${STRIPE_SECRET_KEY}:" \
      -d "url=${WEBHOOK_URL}" \
      -d "enabled_events[]=checkout.session.completed" \
      -d "enabled_events[]=customer.subscription.created" \
      -d "enabled_events[]=customer.subscription.updated" \
      -d "enabled_events[]=customer.subscription.deleted")
    
    # Extract webhook ID and secret
    local webhook_id
    local webhook_secret
    
    if command -v jq >/dev/null 2>&1; then
      webhook_id=$(printf "%s" "$create_response" | jq -r '.id')
      webhook_secret=$(printf "%s" "$create_response" | jq -r '.secret')
    else
      webhook_id=$(printf "%s" "$create_response" | grep -o '"id":"we_[^"]*"' | head -1 | cut -d'"' -f4)
      webhook_secret=$(printf "%s" "$create_response" | grep -o '"secret":"whsec_[^"]*"' | head -1 | cut -d'"' -f4)
    fi
    
    if [ -z "$webhook_id" ] || [ "$webhook_id" = "null" ]; then
      print_error "Failed to create webhook"
      print_error "Response: $create_response"
      exit 1
    fi
    
    print_success "Webhook created: $webhook_id"
    printf "\n"
    
    # Store webhook secret in .env.production
    print_info "Storing webhook secret in $ENV_FILE..."
    
    local temp_file
    temp_file=$(mktemp -t env.XXXXXX)
    cp "$ENV_FILE" "$temp_file"
    
    # Update or add webhook secret
    if grep -q "^STRIPE_WEBHOOK_SECRET=" "$temp_file"; then
      local sed_temp
      sed_temp=$(mktemp -t sed.XXXXXX)
      sed "s|^STRIPE_WEBHOOK_SECRET=.*|STRIPE_WEBHOOK_SECRET=${webhook_secret}|" "$temp_file" > "$sed_temp"
      mv "$sed_temp" "$temp_file"
    elif grep -q "^#STRIPE_WEBHOOK_SECRET=" "$temp_file"; then
      local sed_temp
      sed_temp=$(mktemp -t sed.XXXXXX)
      sed "s|^#STRIPE_WEBHOOK_SECRET=.*|STRIPE_WEBHOOK_SECRET=${webhook_secret}|" "$temp_file" > "$sed_temp"
      mv "$sed_temp" "$temp_file"
    else
      printf "\n# Stripe Webhook Secret\nSTRIPE_WEBHOOK_SECRET=%s\n" "$webhook_secret" >> "$temp_file"
    fi
    
    mv "$temp_file" "$ENV_FILE"
    print_success "Webhook secret saved to $ENV_FILE"
    
    # Store in Key Vault if requested
    if [ "$USE_KEYVAULT" = true ]; then
      KEY_VAULT_NAME=$(grep "^KEY_VAULT_NAME=" "$ENV_FILE" | cut -d'=' -f2)
      
      if [ -n "$KEY_VAULT_NAME" ]; then
        print_info "Storing webhook secret in Key Vault..."
        az keyvault secret set --vault-name "$KEY_VAULT_NAME" --name "STRIPE-WEBHOOK-SECRET" --value "$webhook_secret" --output none
        print_success "Webhook secret stored in Key Vault"
      fi
    fi
  fi
  
  printf "\n"
  print_success "Webhook configuration complete!"
  print_info "Webhook URL: $WEBHOOK_URL"
  print_warning "Remember to redeploy your Container App to use the updated webhook secret"
}

# ============================================================================
# Next Steps Instructions
# ============================================================================

show_next_steps() {
  print_header "Next Steps"
  
  print_success "Stripe production environment is configured!"
  printf "\n"
  
  print_warning "IMPORTANT: Set up production webhook"
  printf "  Run: bash scripts/deploy/03_configure_stripe/03_configure_stripe.sh --update-webhook\n"
  printf "  Or manually:\n"
  printf "  1. Go to: https://dashboard.stripe.com/webhooks\n"
  printf "  2. Click 'Add endpoint'\n"
  printf "  3. URL: <your-container-app-url>/api/stripe/webhooks\n"
  printf "  4. Select events:\n"
  printf "     - checkout.session.completed\n"
  printf "     - customer.subscription.created\n"
  printf "     - customer.subscription.updated\n"
  printf "     - customer.subscription.deleted\n"
  printf "  5. Copy the webhook signing secret\n"
  printf "  6. Add STRIPE_WEBHOOK_SECRET to %s\n" "$ENV_FILE"
  printf "\n"
  
  print_info "Security best practices:"
  printf "  • Never commit live API keys to version control\n"
  printf "  • Use different keys for staging/production\n"
  printf "  • Monitor webhook events in Stripe Dashboard\n"
  printf "  • Set up fraud detection rules\n"
  printf "\n"
  
  print_info "Next: Run deployment script"
  printf "  bash scripts/deploy/06_bind_secrets/06_bind_secrets.sh\n"
  printf "\n"
  
  print_success "Production setup complete! 🚀"
}

# ============================================================================
# Main Script
# ============================================================================

main() {
  # Check if running in webhook update mode
  if [ "$UPDATE_WEBHOOK" = true ]; then
    print_header "Stripe Webhook Update"
    update_stripe_webhook
    return 0
  fi
  
  # Normal production setup flow
  print_header "Stripe Production Setup"
  
  # Run setup steps
  show_live_mode_warning
  check_prerequisites
  collect_stripe_keys
  create_subscription_products
  
  # Store credentials
  if [ "$USE_KEYVAULT" = true ]; then
    store_in_keyvault
  else
    update_env_file
  fi
  
  show_next_steps
}

# Run main function
main

