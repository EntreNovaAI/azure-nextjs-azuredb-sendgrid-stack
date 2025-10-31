#!/usr/bin/env bash
#
# Stripe Test/Sandbox Setup Script
# 
# Purpose:
#   Guide users to create two recurring subscription products (Basic, Premium) 
#   in Stripe test mode and update .env.local with test credentials.
#
# Usage:
#   bash scripts/dev/01_stripe_setup.sh [--yes]
#
# Options:
#   --yes    Auto-confirm prompts (non-interactive mode)
#

set -euo pipefail

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

# Print colored output
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
# Prerequisites Check
# ============================================================================

check_prerequisites() {
  print_header "Checking Prerequisites"
  
  # Check for curl
  if ! command -v curl >/dev/null 2>&1; then
    print_error "curl is required but not installed."
    print_info "Install curl and try again."
    exit 1
  fi
  print_success "curl is installed"
  
  # Check for jq (optional but helpful)
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
# Collect Stripe API Keys
# ============================================================================

collect_stripe_keys() {
  print_header "Collect Stripe Test API Keys"
  
  print_info "You need Stripe test mode API keys."
  print_info "Get them from: https://dashboard.stripe.com/test/apikeys"
  printf "\n"
  
  # Collect Secret Key
  local secret_key
  while true; do
    printf "Enter your Stripe test secret key (sk_test_...): "
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
    printf "Enter your Stripe test publishable key (pk_test_...): "
    read -r publishable_key
    
    # Validate format
    if [[ "$publishable_key" =~ ^pk_test_ ]]; then
      break
    else
      print_error "Invalid key format. Must start with 'pk_test_'"
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
    print_info "Response: $product_response"
    exit 1
  fi
  
  print_success "Created product: $product_id"
  
  # Create price for the product
  print_info "Creating monthly price: \$$price"
  
  local price_amount
  # Convert dollars to cents (remove decimal point)
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
    print_info "Response: $price_response"
    exit 1
  fi
  
  print_success "Created price: $price_id"
  print_info "Price ID (for reference): $price_id"
  
  # Return product ID
  printf "%s" "$product_id"
}

create_subscription_products() {
  print_header "Create Subscription Products"
  
  print_info "This will create two monthly subscription products in Stripe test mode:"
  print_info "1. Basic Plan"
  print_info "2. Premium Plan"
  printf "\n"
  
  # Get pricing from user
  BASIC_PRICE=$(read_with_default "Basic Plan monthly price (USD)" "$DEFAULT_BASIC_PRICE")
  PREMIUM_PRICE=$(read_with_default "Premium Plan monthly price (USD)" "$DEFAULT_PREMIUM_PRICE")
  
  printf "\n"
  
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
# Update .env.local File
# ============================================================================

update_env_file() {
  print_header "Update $ENV_FILE"
  
  # Create a temporary file
  local temp_file
  temp_file=$(mktemp -t env.XXXXXX)
  
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
      sed_temp=$(mktemp -t sed.XXXXXX)
      sed "s|^${key}=.*|${key}=${value}|" "$temp_file" > "$sed_temp"
      mv "$sed_temp" "$temp_file"
    else
      # Add new variable
      printf "\n%s=%s" "$key" "$value" >> "$temp_file"
    fi
  }
  
  # Update variables
  update_or_add_var "STRIPE_SECRET_KEY" "$STRIPE_SECRET_KEY" "$temp_file"
  update_or_add_var "NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY" "$STRIPE_PUBLISHABLE_KEY" "$temp_file"
  update_or_add_var "STRIPE_SUBSCRIPTION_ID_BASIC" "$BASIC_PRODUCT_ID" "$temp_file"
  update_or_add_var "STRIPE_SUBSCRIPTION_ID_PREMIUM" "$PREMIUM_PRODUCT_ID" "$temp_file"
  
  # Move temp file to original
  mv "$temp_file" "$ENV_FILE"
  
  print_success "$ENV_FILE updated with Stripe credentials"
  print_info "Updated variables:"
  print_info "  - STRIPE_SECRET_KEY"
  print_info "  - NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY"
  print_info "  - STRIPE_SUBSCRIPTION_ID_BASIC"
  print_info "  - STRIPE_SUBSCRIPTION_ID_PREMIUM"
}

# ============================================================================
# Next Steps Instructions
# ============================================================================

show_next_steps() {
  print_header "Next Steps"
  
  print_info "Your Stripe test environment is configured!"
  printf "\n"
  
  print_info "1. Set up webhook for local testing:"
  printf "   URL: http://localhost:3000/api/stripe/webhooks\n"
  printf "   Required events:\n"
  printf "     - checkout.session.completed\n"
  printf "     - customer.subscription.created\n"
  printf "     - customer.subscription.updated\n"
  printf "     - customer.subscription.deleted\n"
  printf "\n"
  
  print_info "2. Add STRIPE_WEBHOOK_SECRET to $ENV_FILE:"
  printf "   Get it from: https://dashboard.stripe.com/test/webhooks\n"
  printf "\n"
  
  print_info "3. Test with these card numbers:"
  printf "   Success: 4242 4242 4242 4242\n"
  printf "   Decline: 4000 0000 0000 0002\n"
  printf "   Use any future expiry date and any CVC\n"
  printf "\n"
  
  print_info "4. Start your development server:"
  printf "   bash scripts/dev/dev_with_tunnel.sh\n"
  printf "\n"
  
  print_success "Setup complete! Happy coding! 🚀"
}

# ============================================================================
# Main Script
# ============================================================================

main() {
  print_header "Stripe Test/Sandbox Setup"
  
  # Run setup steps
  check_prerequisites
  collect_stripe_keys
  create_subscription_products
  update_env_file
  show_next_steps
}

# Run main function
main

