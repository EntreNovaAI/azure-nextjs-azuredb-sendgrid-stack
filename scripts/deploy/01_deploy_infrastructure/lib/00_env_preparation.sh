#!/usr/bin/env bash
#
# Environment Preparation Library
#
# Purpose:
#   Prepare the production environment file from the local development environment
#   This ensures we start with all the necessary base configuration before deployment
#
# Functions:
#   - prepare_production_env() : Copy .env.local to .env.production and set NODE_ENV=production
#

# ============================================================================
# Environment File Preparation
# ============================================================================

# Prepare production environment file
# Copies .env.local to .env.production and updates NODE_ENV to production
# This ensures the production environment starts with the same base configuration
# as the development environment, with only the NODE_ENV changed
prepare_production_env() {
  print_header "Preparing Production Environment"
  
  local env_local=".env.local"
  local env_production=".env.production"
  
  # Check if .env.local exists
  if [ ! -f "$env_local" ]; then
    print_error "File $env_local not found!"
    print_info "Please create $env_local first with your base configuration"
    exit 1
  fi
  
  print_info "Copying $env_local to $env_production..."
  
  # Copy the file
  cp "$env_local" "$env_production"
  
  # Update or add NODE_ENV=production
  # Using a more robust approach that works across all platforms (Windows Git Bash, Linux, macOS)
  if grep -q "^NODE_ENV=" "$env_production"; then
    # NODE_ENV exists - update it to production
    # Use a temporary file approach which is more reliable than sed -i across platforms
    print_info "Updating NODE_ENV to production..."
    grep -v "^NODE_ENV=" "$env_production" > "${env_production}.tmp"
    {
      echo "NODE_ENV=production"
      cat "${env_production}.tmp"
    } > "$env_production"
    rm "${env_production}.tmp"
    print_success "Updated NODE_ENV=production in $env_production"
  else
    # NODE_ENV doesn't exist - add it at the beginning
    print_info "Adding NODE_ENV=production..."
    # Create temporary file with NODE_ENV at the top
    {
      echo "NODE_ENV=production"
      echo ""
      cat "$env_production"
    } > "${env_production}.tmp"
    mv "${env_production}.tmp" "$env_production"
    print_success "Added NODE_ENV=production to $env_production"
  fi
  
  # Verify the change was applied
  if grep -q "^NODE_ENV=production" "$env_production"; then
    print_success "Verified: NODE_ENV=production is set correctly"
  else
    print_warning "Warning: NODE_ENV may not have been set correctly"
    print_info "Please verify $env_production contains NODE_ENV=production"
  fi
  
  print_success "Production environment file prepared successfully"
  print_info "Note: Infrastructure deployment will add Azure-specific values to this file"
}

