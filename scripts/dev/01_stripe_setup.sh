#!/usr/bin/env bash
#
# Stripe Test/Sandbox Setup Script (Using Stripe CLI)
# 
# Purpose:
#   - Authenticate with Stripe using browser-based login
#   - Create two recurring subscription products (Basic, Premium) in Stripe test mode
#   - Retrieve API keys automatically from authenticated session
#   - Update .env.local with test credentials
#
# Requirements:
#   - Stripe CLI must be installed: https://docs.stripe.com/stripe-cli
#   - On Windows: Install via scoop or download from GitHub
#   - On macOS: brew install stripe/stripe-cli/stripe
#   - On Linux: Download from GitHub releases
#
# Usage:
#   bash scripts/dev/01_stripe_setup.sh [--yes]
#
# Options:
#   --yes    Auto-confirm prompts (non-interactive mode)
#

set -euo pipefail

# ============================================================================
# Change to Project Root Directory
# ============================================================================

# Get the directory where this script is located
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# Change to project root (two levels up from scripts/dev/)
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
cd "$PROJECT_ROOT"

echo "Working from project root: $PROJECT_ROOT"

# ============================================================================
# Configuration
# ============================================================================

ENV_FILE=".env.local"
BASIC_PRODUCT_NAME="Basic Plan"
PREMIUM_PRODUCT_NAME="Premium Plan"
DEFAULT_BASIC_PRICE="9.99"
DEFAULT_PREMIUM_PRICE="29.99"

# ============================================================================
# Parse Arguments
# ============================================================================

AUTO_YES=false
for arg in "$@"; do
  case $arg in
    --yes)
      AUTO_YES=true
      shift
      ;;
    *)
      printf "Unknown option: %s\n" "$arg"
      printf "Usage: %s [--yes]\n" "$0"
      exit 1
      ;;
  esac
done

# ============================================================================
# Utility Functions
# ============================================================================

# Print colored output with emojis
print_header() {
  printf "\n=== %s ===\n\n" "$1"
}

print_info() {
  printf "ℹ️  %s\n" "$1"
}

print_success() {
  printf "✅ %s\n" "$1"
}

print_error() {
  printf "❌ %s\n" "$1"
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
# The prompt is printed to stderr, so only the value is captured in command substitution
read_with_default() {
  local prompt="$1"
  local default="$2"
  local response
  
  # Print prompt to stderr (file descriptor 2) so it doesn't get captured
  printf "%s [%s]: " "$prompt" "$default" >&2
  read -r response
  
  # Return the value to stdout (file descriptor 1) so it gets captured
  if [ -z "$response" ]; then
    printf "%s" "$default"
  else
    printf "%s" "$response"
  fi
}

# ============================================================================
# Prerequisites Check
# ============================================================================

check_prerequisites() {
  print_header "Checking Prerequisites"
  
  # Check for Stripe CLI - this is now REQUIRED
  if ! command -v stripe >/dev/null 2>&1; then
    print_error "Stripe CLI is required but not installed."
    printf "\n"
    print_info "Installation instructions:"
    printf "  macOS:   brew install stripe/stripe-cli/stripe\n"
    printf "  Windows: scoop bucket add stripe https://github.com/stripe/scoop-stripe-cli.git\n"
    printf "           scoop install stripe\n"
    printf "  Linux:   Download from https://github.com/stripe/stripe-cli/releases\n"
    printf "\n"
    print_info "Or visit: https://docs.stripe.com/stripe-cli"
    exit 1
  fi
  print_success "Stripe CLI is installed"
  
  # Check Stripe CLI version
  local stripe_version
  stripe_version=$(stripe --version 2>&1 || echo "unknown")
  print_info "Stripe CLI version: $stripe_version"
  
  # Check for jq (optional but helpful for JSON parsing)
  if ! command -v jq >/dev/null 2>&1; then
    print_warning "jq is not installed. Install jq for better JSON handling."
    print_info "You can continue without it, but some outputs may be less readable."
  else
    print_success "jq is installed"
  fi
  
  # Check if .env.local exists
  if [ ! -f "$ENV_FILE" ]; then
    print_warning "$ENV_FILE not found."
    
    # Check if .env.example exists
    if [ -f ".env.example" ]; then
      if confirm "Create $ENV_FILE from .env.example?"; then
        cp .env.example "$ENV_FILE"
        print_success "Created $ENV_FILE from .env.example"
      else
        print_error "Cannot proceed without $ENV_FILE"
        exit 1
      fi
    else
      print_error "Neither $ENV_FILE nor .env.example found."
      print_info "Please create $ENV_FILE before running this script."
      exit 1
    fi
  else
    print_success "$ENV_FILE exists"
  fi
}

# ============================================================================
# Stripe CLI Authentication
# ============================================================================

authenticate_stripe() {
  print_header "Authenticate with Stripe"
  
  # Check if already logged in by trying a simple API call
  if stripe config --list >/dev/null 2>&1; then
    print_info "Checking existing Stripe CLI session..."
    
    # Try to verify the session is valid
    if stripe config --list 2>&1 | grep -q "test_mode_api_key"; then
      print_success "Already authenticated with Stripe"
      
      if [ "$AUTO_YES" = false ]; then
        if ! confirm "Do you want to re-authenticate (login again)?"; then
          print_info "Using existing session"
          return 0
        fi
      else
        print_info "Using existing session (--yes mode)"
        return 0
      fi
    fi
  fi
  
  print_info "👉 Action: Authenticate with Stripe via browser"
  printf "\n"
  print_info "What will happen:"
  print_info "  1. Your browser will open automatically"
  print_info "  2. Log in to your Stripe account"
  print_info "  3. Click 'Allow access' to authorize the CLI"
  print_info "  4. Return to this terminal"
  printf "\n"
  
  if [ "$AUTO_YES" = false ]; then
    if ! confirm "Ready to open browser and authenticate?"; then
      print_error "Authentication cancelled by user"
      exit 1
    fi
  fi
  
  printf "\n"
  print_info "Opening browser for authentication..."
  printf "\n"
  
  # Run stripe login
  # This will open a browser window for the user to authenticate
  if stripe login; then
    printf "\n"
    print_success "Successfully authenticated with Stripe!"
    printf "\n"
  else
    printf "\n"
    print_error "Failed to authenticate with Stripe"
    print_info "Please make sure you completed the authentication in your browser"
    exit 1
  fi
}

# ============================================================================
# Retrieve Stripe API Keys
# ============================================================================

retrieve_api_keys() {
  print_header "Retrieve API Keys"
  
  print_info "Fetching your Stripe test API keys..."
  
  # The Stripe CLI stores keys in the config after login
  # We can retrieve them using the Stripe CLI
  
  # Get the test mode API key (secret key)
  local secret_key
  secret_key=$(stripe config --list 2>/dev/null | grep "test_mode_api_key" | awk '{print $3}' || echo "")
  
  if [ -z "$secret_key" ] || [ "$secret_key" = "null" ]; then
    print_warning "Could not automatically retrieve secret key from CLI config"
    printf "\n"
    print_info "👉 Action: Get your API keys from Stripe Dashboard"
    print_info "   Open: https://dashboard.stripe.com/test/apikeys"
    printf "\n"
    
    # Collect Secret Key
    while true; do
      printf "📋 Enter your Stripe test secret key (sk_test_...): "
      read -r secret_key
      
      # Validate format
      if [[ "$secret_key" =~ ^sk_test_ ]]; then
        break
      else
        print_error "Invalid key format. Must start with 'sk_test_'"
      fi
    done
    
    # Collect Publishable Key
    local publishable_key
    while true; do
      printf "📋 Enter your Stripe test publishable key (pk_test_...): "
      read -r publishable_key
      
      # Validate format
      if [[ "$publishable_key" =~ ^pk_test_ ]]; then
        break
      else
        print_error "Invalid key format. Must start with 'pk_test_'"
      fi
    done
    
    STRIPE_SECRET_KEY="$secret_key"
    STRIPE_PUBLISHABLE_KEY="$publishable_key"
  else
    # We have the secret key from config
    STRIPE_SECRET_KEY="$secret_key"
    print_success "Retrieved secret key from Stripe CLI"
    
    # Get publishable key - API doesn't expose this directly
    printf "\n"
    print_info "👉 Action: Get your publishable key"
    print_info "   The Stripe API doesn't provide publishable keys via CLI."
    print_info "   Open: https://dashboard.stripe.com/test/apikeys"
    print_info "   Look for: 'Publishable key' section"
    printf "\n"
    
    local publishable_key
    while true; do
      printf "📋 Enter your Stripe test publishable key (pk_test_...): "
      read -r publishable_key
      
      # Validate format
      if [[ "$publishable_key" =~ ^pk_test_ ]]; then
        STRIPE_PUBLISHABLE_KEY="$publishable_key"
        break
      else
        print_error "Invalid key format. Must start with 'pk_test_'"
      fi
    done
  fi
  
  print_success "API keys collected"
}

# ============================================================================
# Create Stripe Products (Using CLI)
# ============================================================================

create_stripe_product_cli() {
  local product_name="$1"
  local price="$2"
  
  # Send user-facing messages to stderr so they appear while the function return value
  # (product ID) goes to stdout for capture by command substitution
  print_info "Creating product: $product_name" >&2
  
  # Convert price to cents (Stripe uses cents/smallest currency unit)
  local price_amount
  price_amount=$(printf "%.0f" "$(echo "$price * 100" | bc 2>/dev/null || awk "BEGIN {print $price * 100}")")
  
  # Step 1: Create the product first (without price)
  # The Stripe CLI doesn't support --default-price-data flag
  # We need to create product and price separately
  local product_response
  product_response=$(stripe products create \
    --name="$product_name" \
    2>&1)
  
  # Check if product creation was successful
  if [ $? -ne 0 ]; then
    print_error "Failed to create product: $product_name" >&2
    print_info "Error: $product_response" >&2
    exit 1
  fi
  
  # Extract product ID from response
  local product_id
  if command -v jq >/dev/null 2>&1; then
    product_id=$(echo "$product_response" | jq -r '.id')
  else
    # Fallback parsing without jq
    product_id=$(echo "$product_response" | grep -o '"id": *"prod_[^"]*"' | head -1 | sed 's/"id": *"\(.*\)"/\1/')
  fi
  
  if [ -z "$product_id" ] || [ "$product_id" = "null" ]; then
    print_error "Failed to extract product ID for: $product_name" >&2
    print_info "Response: $product_response" >&2
    exit 1
  fi
  
  print_success "Created product: $product_id" >&2
  
  # Step 2: Create the recurring price for this product
  # The Stripe CLI mirrors the API's bracket notation for nested parameters
  # Based on: https://docs.stripe.com/api/prices/create
  print_info "Creating recurring monthly price..." >&2
  local price_response
  price_response=$(stripe prices create \
    --unit-amount="$price_amount" \
    --currency=usd \
    --product="$product_id" \
    -d "recurring[interval]"=month \
    2>&1)
  
  # Check if price creation was successful
  if [ $? -ne 0 ]; then
    print_error "Failed to create price for product: $product_name" >&2
    print_info "Error: $price_response" >&2
    exit 1
  fi
  
  # Extract price ID from response
  local price_id
  if command -v jq >/dev/null 2>&1; then
    price_id=$(echo "$price_response" | jq -r '.id')
  else
    price_id=$(echo "$price_response" | grep -o '"id": *"price_[^"]*"' | head -1 | sed 's/"id": *"\(.*\)"/\1/')
  fi
  
  print_success "Created price: $price_id" >&2
  print_info "Monthly price: \$$price" >&2
  
  # Return product ID to stdout (this is what gets captured by command substitution)
  printf "%s" "$product_id"
}

create_subscription_products() {
  print_header "Create Subscription Products"
  
  print_info "We'll now create two monthly subscription products in Stripe test mode:"
  print_info "  • Basic Plan"
  print_info "  • Premium Plan"
  printf "\n"
  
  # Get Basic Plan pricing from user
  print_info "What do you want to price the Basic Plan at (in USD per month)?"
  print_info "Leave blank to accept default of \$$DEFAULT_BASIC_PRICE/month"
  BASIC_PRICE=$(read_with_default "Basic Plan monthly price" "$DEFAULT_BASIC_PRICE")
  printf "\n"
  
  # Get Premium Plan pricing from user
  print_info "What do you want to price the Premium Plan at (in USD per month)?"
  print_info "Leave blank to accept default of \$$DEFAULT_PREMIUM_PRICE/month"
  PREMIUM_PRICE=$(read_with_default "Premium Plan monthly price" "$DEFAULT_PREMIUM_PRICE")
  
  printf "\n"
  
  if ! confirm "Create products with these prices?"; then
    print_info "Cancelled by user"
    exit 0
  fi
  
  # Create Basic product
  printf "\n"
  BASIC_PRODUCT_ID=$(create_stripe_product_cli "$BASIC_PRODUCT_NAME" "$BASIC_PRICE")
  
  # Create Premium product
  printf "\n"
  PREMIUM_PRODUCT_ID=$(create_stripe_product_cli "$PREMIUM_PRODUCT_NAME" "$PREMIUM_PRICE")
  
  printf "\n"
  print_success "All products created successfully!"
}

# ============================================================================
# Update .env.local File
# ============================================================================

update_env_file() {
  print_header "Update $ENV_FILE"
  
  # Create a temporary file
  local temp_file
  temp_file=$(mktemp)
  
  # Copy existing file to temp
  cp "$ENV_FILE" "$temp_file"
  
  # Function to update or add a variable
  update_or_add_var() {
    local key="$1"
    local value="$2"
    local temp_file="$3"
    
    # Check if variable exists
    if grep -q "^${key}=" "$temp_file"; then
      # Update existing variable (portable sed)
      local sed_temp
      sed_temp=$(mktemp)
      sed "s|^${key}=.*|${key}=${value}|" "$temp_file" > "$sed_temp"
      mv "$sed_temp" "$temp_file"
    else
      # Check if it exists as a comment
      if grep -q "^#${key}=" "$temp_file"; then
        # Uncomment and update
        local sed_temp
        sed_temp=$(mktemp)
        sed "s|^#${key}=.*|${key}=${value}|" "$temp_file" > "$sed_temp"
        mv "$sed_temp" "$temp_file"
      else
        # Add new variable
        printf "\n%s=%s" "$key" "$value" >> "$temp_file"
      fi
    fi
  }
  
  # Update variables
  update_or_add_var "STRIPE_SECRET_KEY" "$STRIPE_SECRET_KEY" "$temp_file"
  update_or_add_var "NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY" "$STRIPE_PUBLISHABLE_KEY" "$temp_file"
  update_or_add_var "STRIPE_SUBSCRIPTION_ID_BASIC" "$BASIC_PRODUCT_ID" "$temp_file"
  update_or_add_var "STRIPE_SUBSCRIPTION_ID_PREMIUM" "$PREMIUM_PRODUCT_ID" "$temp_file"
  
  # Add placeholder for webhook secret if it doesn't exist
  # The webhook secret will be set later by either:
  # 1. stripe listen command (for local dev)
  # 2. dev_with_tunnel.sh --stripe (auto-configures webhooks)
  # 3. Manual webhook setup in Stripe Dashboard
  if ! grep -q "^STRIPE_WEBHOOK_SECRET=" "$temp_file"; then
    if ! grep -q "^#STRIPE_WEBHOOK_SECRET=" "$temp_file"; then
      printf "\n# Stripe Webhook Secret - Set this after configuring webhooks\n" >> "$temp_file"
      printf "# Option 1: Run 'stripe listen --forward-to localhost:3000/api/stripe/webhooks'\n" >> "$temp_file"
      printf "# Option 2: Run 'bash scripts/dev/dev_with_tunnel.sh --stripe'\n" >> "$temp_file"
      printf "# Option 3: Create webhook at https://dashboard.stripe.com/test/webhooks\n" >> "$temp_file"
      printf "STRIPE_WEBHOOK_SECRET=whsec_your-webhook-secret\n" >> "$temp_file"
    fi
  fi
  
  # Move temp file to original
  mv "$temp_file" "$ENV_FILE"
  
  print_success "$ENV_FILE updated with Stripe credentials"
  print_info "Updated variables:"
  print_info "  ✓ STRIPE_SECRET_KEY"
  print_info "  ✓ NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY"
  print_info "  ✓ STRIPE_SUBSCRIPTION_ID_BASIC"
  print_info "  ✓ STRIPE_SUBSCRIPTION_ID_PREMIUM"
  print_info "  ⚠ STRIPE_WEBHOOK_SECRET (placeholder added - see next steps)"
}

# ============================================================================
# Next Steps Instructions
# ============================================================================

show_next_steps() {
  print_header "Next Steps"
  
  print_success "Stripe test environment configured successfully!"
  printf "\n"
  print_info "✅ Created: Basic Plan ($BASIC_PRICE/month)"
  print_info "✅ Created: Premium Plan ($PREMIUM_PRICE/month)"
  print_info "✅ Updated: $ENV_FILE with API keys and product IDs"
  printf "\n"
  printf "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n"
  printf "\n"
  
  print_info "👉 IMPORTANT: Set up webhooks (choose ONE method below)"
  printf "\n"
  
  print_info "Option A: Stripe CLI Forwarding (Recommended for quick testing)"
  printf "   Run this command in a separate terminal:\n"
  printf "\n"
  printf "   \033[1;36mstripe listen --forward-to localhost:3000/api/stripe/webhooks\033[0m\n"
  printf "\n"
  printf "   Then copy the webhook secret it displays (starts with whsec_)\n"
  printf "   and update STRIPE_WEBHOOK_SECRET in your .env.local\n"
  printf "\n"
  
  print_info "Option B: Auto-configured tunnel (Easiest - does everything)"
  printf "   Run this command:\n"
  printf "\n"
  printf "   \033[1;36mbash scripts/dev/dev_with_tunnel.sh --stripe\033[0m\n"
  printf "\n"
  printf "   This will automatically configure webhooks and start your dev server\n"
  printf "\n"
  
  print_info "Option C: Manual webhook setup"
  printf "   1. Go to: https://dashboard.stripe.com/test/webhooks\n"
  printf "   2. Click '+ Add endpoint'\n"
  printf "   3. Enter your endpoint URL\n"
  printf "   4. Select these events:\n"
  printf "      • checkout.session.completed\n"
  printf "      • customer.created\n"
  printf "      • customer.deleted\n"
  printf "      • customer.updated\n"
  printf "      • customer.subscription.created\n"
  printf "      • customer.subscription.updated\n"
  printf "      • customer.subscription.deleted\n"
  printf "   5. Copy the signing secret and add to .env.local\n"
  printf "\n"
  
  printf "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n"
  printf "\n"
  
  print_info "📝 After setting up webhooks, start development:"
  printf "\n"
  printf "   \033[1;36mpnpm run dev\033[0m\n"
  printf "\n"
  
  print_info "🧪 Test with these card numbers:"
  printf "   Success:  4242 4242 4242 4242\n"
  printf "   Decline:  4000 0000 0000 0002\n"
  printf "   (Use any future date and any 3-digit CVC)\n"
  printf "\n"
  
  print_info "📊 View your products:"
  printf "   https://dashboard.stripe.com/test/products\n"
  printf "\n"
  
  print_success "Setup complete! Happy coding! 🚀"
}

# ============================================================================
# Main Script
# ============================================================================

main() {
  print_header "Stripe Test/Sandbox Setup (with CLI)"
  
  # Run setup steps
  check_prerequisites
  authenticate_stripe
  retrieve_api_keys
  create_subscription_products
  update_env_file
  show_next_steps
}

# Run main function
main

