#!/usr/bin/env bash
#
# Environment Configuration Validation Library
#
# Purpose:
#   Check local development environment
#   - Node.js version (18+)
#   - Package manager (pnpm recommended, npm acceptable)
#   - Git (for version control)
#
# Uses global variables from 00_utils.sh:
#   - VALIDATION_WARNINGS
#

# ============================================================================
# Environment Check Function
# ============================================================================

# Check local development environment configuration
# Increments VALIDATION_WARNINGS for environment issues
# Note: These are warnings because deployment can work without local dev setup
check_environment() {
  print_header "Checking Environment Configuration"
  
  # Check Node.js - RECOMMENDED for local development
  if command -v node >/dev/null 2>&1; then
    local node_version
    node_version=$(node --version)
    print_success "Node.js: $node_version"
    
    # Check if version is 18 or higher
    local node_major
    node_major=$(echo "$node_version" | grep -o 'v[0-9]*' | tr -d 'v')
    if [ "$node_major" -ge 18 ]; then
      print_success "Node.js version is 18+ (compatible)"
    else
      print_warning "Node.js version is below 18 (may have compatibility issues)"
      VALIDATION_WARNINGS=$((VALIDATION_WARNINGS + 1))
    fi
  else
    print_warning "Node.js not installed (needed for local development)"
    VALIDATION_WARNINGS=$((VALIDATION_WARNINGS + 1))
  fi
  
  # Check package manager - RECOMMENDED
  if command -v pnpm >/dev/null 2>&1; then
    print_success "pnpm is installed"
  elif command -v npm >/dev/null 2>&1; then
    print_warning "npm is installed (pnpm is recommended)"
  else
    print_warning "No Node.js package manager found"
    VALIDATION_WARNINGS=$((VALIDATION_WARNINGS + 1))
  fi
  
  # Check Git - RECOMMENDED for version control
  if command -v git >/dev/null 2>&1; then
    print_success "Git is installed"
  else
    print_warning "Git is not installed (recommended for version control)"
    VALIDATION_WARNINGS=$((VALIDATION_WARNINGS + 1))
  fi
}


