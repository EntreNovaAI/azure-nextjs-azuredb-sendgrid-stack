#!/usr/bin/env bash
#
# Azure Prerequisites Validation Script
#
# Purpose:
#   Validate all prerequisites before running deployment scripts
#   Check tools, Azure login, permissions, and configurations
#
# Usage:
#   bash scripts/deploy/00_validate_prerequisites.sh [OPTIONS]
#
# Options:
#   --check-only    Only validate, don't offer to install (default)
#   --json          Output results in JSON format
#   --help          Show this help message
#
# Exit Codes:
#   0 - All checks passed
#   1 - Critical errors found
#   2 - Only warnings found (can continue)
#

set -euo pipefail

# ============================================================================
# Parse Command-Line Arguments
# ============================================================================

CHECK_ONLY=true
JSON_OUTPUT=false
SHOW_HELP=false

while [ $# -gt 0 ]; do
  case "$1" in
    --check-only)
      CHECK_ONLY=true
      shift
      ;;
    --json)
      JSON_OUTPUT=true
      shift
      ;;
    --help|-h)
      SHOW_HELP=true
      shift
      ;;
    *)
      echo "Unknown option: $1"
      echo "Use --help for usage information"
      exit 1
      ;;
  esac
done

# Show help if requested
if [ "$SHOW_HELP" = true ]; then
  cat << 'EOF'
Azure Prerequisites Validation Script

Usage:
  bash scripts/deploy/00_validate_prerequisites.sh [OPTIONS]

Options:
  --check-only    Only validate, don't offer to install (default)
  --json          Output results in JSON format
  --help, -h      Show this help message

Exit Codes:
  0 - All checks passed
  1 - Critical errors found
  2 - Only warnings found (can continue)

Examples:
  # Basic validation
  bash scripts/deploy/00_validate_prerequisites.sh

  # JSON output for parsing
  bash scripts/deploy/00_validate_prerequisites.sh --json

EOF
  exit 0
fi

# ============================================================================
# Change to Project Root Directory
# ============================================================================

# Get the directory where this script is located
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# Change to project root (two levels up from scripts/deploy/)
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
cd "$PROJECT_ROOT"

if [ "$JSON_OUTPUT" = false ]; then
  echo "Working from project root: $PROJECT_ROOT"
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
  printf "❌ %s\n" "$1"
}

print_warning() {
  printf "⚠️  %s\n" "$1"
}

# Track validation results
VALIDATION_ERRORS=0
VALIDATION_WARNINGS=0

# ============================================================================
# Check Command-Line Tools
# ============================================================================

check_cli_tools() {
  print_header "Checking Command-Line Tools"
  
  # Azure CLI
  if command -v az >/dev/null 2>&1; then
    local az_version
    az_version=$(az version --query '"azure-cli"' -o tsv)
    print_success "Azure CLI: $az_version"
  else
    print_error "Azure CLI is not installed"
    print_info "Install from: https://docs.microsoft.com/cli/azure/install-azure-cli"
    VALIDATION_ERRORS=$((VALIDATION_ERRORS + 1))
  fi
  
  # Bicep CLI
  if command -v az >/dev/null 2>&1 && az bicep version >/dev/null 2>&1; then
    local bicep_version
    bicep_version=$(az bicep version | grep -o 'version [0-9.]*' | cut -d' ' -f2)
    print_success "Bicep CLI: $bicep_version"
  else
    print_error "Bicep CLI is not installed"
    print_info "Run: az bicep install"
    VALIDATION_ERRORS=$((VALIDATION_ERRORS + 1))
  fi
  
  # Stripe CLI (optional but recommended)
  if command -v stripe >/dev/null 2>&1; then
    local stripe_version
    stripe_version=$(stripe version | head -1)
    print_success "Stripe CLI: $stripe_version"
  else
    print_warning "Stripe CLI is not installed (optional)"
    print_info "Install from: https://stripe.com/docs/stripe-cli"
    VALIDATION_WARNINGS=$((VALIDATION_WARNINGS + 1))
  fi
  
  # Docker
  if command -v docker >/dev/null 2>&1; then
    local docker_version
    docker_version=$(docker --version | cut -d' ' -f3 | tr -d ',')
    print_success "Docker: $docker_version"
    
    # Check if Docker daemon is running
    if docker info >/dev/null 2>&1; then
      print_success "Docker daemon is running"
    else
      print_error "Docker daemon is not running"
      print_info "Start Docker Desktop or Docker service"
      VALIDATION_ERRORS=$((VALIDATION_ERRORS + 1))
    fi
  else
    print_error "Docker is not installed"
    print_info "Install Docker Desktop: https://www.docker.com/products/docker-desktop"
    VALIDATION_ERRORS=$((VALIDATION_ERRORS + 1))
  fi
  
  # jq (optional but helpful)
  if command -v jq >/dev/null 2>&1; then
    local jq_version
    jq_version=$(jq --version)
    print_success "jq: $jq_version"
  else
    print_warning "jq is not installed (recommended for better JSON parsing)"
    print_info "macOS: brew install jq | Linux: apt install jq | Windows: choco install jq"
    VALIDATION_WARNINGS=$((VALIDATION_WARNINGS + 1))
  fi
  
  # curl
  if command -v curl >/dev/null 2>&1; then
    print_success "curl is installed"
  else
    print_error "curl is not installed"
    VALIDATION_ERRORS=$((VALIDATION_ERRORS + 1))
  fi
  
  # openssl
  if command -v openssl >/dev/null 2>&1; then
    print_success "openssl is installed"
  else
    print_warning "openssl is not installed (needed for generating secrets)"
    VALIDATION_WARNINGS=$((VALIDATION_WARNINGS + 1))
  fi
}

# ============================================================================
# Check Azure Authentication
# ============================================================================

check_azure_auth() {
  print_header "Checking Azure Authentication"
  
  if ! command -v az >/dev/null 2>&1; then
    print_error "Azure CLI not installed, skipping authentication check"
    return
  fi
  
  # Check login status
  if az account show >/dev/null 2>&1; then
    print_success "Logged in to Azure CLI"
    
    # Get account info
    local account_name
    local subscription_id
    account_name=$(az account show --query name -o tsv)
    subscription_id=$(az account show --query id -o tsv)
    
    print_info "Account: $account_name"
    print_info "Subscription: $subscription_id"
    
    # Check for multiple subscriptions
    local subscription_count
    subscription_count=$(az account list --query "length([])" -o tsv)
    if [ "$subscription_count" -gt 1 ]; then
      print_warning "You have $subscription_count subscriptions"
      print_info "Make sure you're using the correct one"
      print_info "List subscriptions: az account list"
      print_info "Switch subscription: az account set --subscription <id>"
    fi
  else
    print_error "Not logged in to Azure CLI"
    print_info "Run: az login"
    VALIDATION_ERRORS=$((VALIDATION_ERRORS + 1))
  fi
}

# ============================================================================
# Check Azure Permissions
# ============================================================================

check_azure_permissions() {
  print_header "Checking Azure Permissions"
  
  if ! command -v az >/dev/null 2>&1 || ! az account show >/dev/null 2>&1; then
    print_warning "Skipping permissions check (not logged in)"
    return
  fi
  
  print_info "Checking required permissions..."
  
  # Try to list resource groups (basic permission check)
  if az group list --output none 2>/dev/null; then
    print_success "Can list resource groups"
  else
    print_error "Cannot list resource groups"
    print_info "You need at least Reader role on the subscription"
    VALIDATION_ERRORS=$((VALIDATION_ERRORS + 1))
  fi
  
  # Check if user can create resources (requires Contributor or Owner role)
  print_info "Note: Deployment requires Contributor or Owner role"
  print_info "Verify permissions in Azure Portal: Subscriptions > Access Control (IAM)"
}

# ============================================================================
# Check Required Files
# ============================================================================

check_required_files() {
  print_header "Checking Required Files"
  
  # Check for Bicep template
  if [ -f "infrastructure/bicep/main.bicep" ]; then
    print_success "Main Bicep template found"
    
    # Validate Bicep syntax
    if command -v az >/dev/null 2>&1 && az bicep version >/dev/null 2>&1; then
      if az bicep build --file infrastructure/bicep/main.bicep --stdout >/dev/null 2>&1; then
        print_success "Bicep template is valid"
      else
        print_error "Bicep template has syntax errors"
        print_info "Run: az bicep build --file infrastructure/bicep/main.bicep"
        VALIDATION_ERRORS=$((VALIDATION_ERRORS + 1))
      fi
    fi
  else
    print_error "Main Bicep template not found: infrastructure/bicep/main.bicep"
    VALIDATION_ERRORS=$((VALIDATION_ERRORS + 1))
  fi
  
  # Check for Dockerfile
  if [ -f "docker/Dockerfile" ]; then
    print_success "Dockerfile found"
  else
    print_error "Dockerfile not found: docker/Dockerfile"
    VALIDATION_ERRORS=$((VALIDATION_ERRORS + 1))
  fi
  
  # Check for .env.example
  if [ -f ".env.example" ]; then
    print_success ".env.example found"
  else
    print_warning ".env.example not found (recommended for reference)"
    VALIDATION_WARNINGS=$((VALIDATION_WARNINGS + 1))
  fi
  
  # Check for deployment scripts
  local scripts=(
    "scripts/dev/01_stripe_setup.sh"
    "scripts/deploy/01_deploy_infrastructure.sh"
    "scripts/deploy/02_assign_roles.sh"
    "scripts/deploy/03_configure_stripe.sh"
    "scripts/deploy/04_build_and_push_image.sh"
    "scripts/deploy/05_bind_secrets.sh"
  )
  
  for script in "${scripts[@]}"; do
    if [ -f "$script" ]; then
      print_success "Found: $script"
    else
      print_warning "Missing: $script"
      VALIDATION_WARNINGS=$((VALIDATION_WARNINGS + 1))
    fi
  done
}

# ============================================================================
# Check Azure Resource Providers
# ============================================================================

check_resource_providers() {
  print_header "Checking Azure Resource Providers"
  
  if ! command -v az >/dev/null 2>&1 || ! az account show >/dev/null 2>&1; then
    print_warning "Skipping resource provider check (not logged in)"
    return
  fi
  
  print_info "Checking required resource providers..."
  
  local required_providers=(
    "Microsoft.Sql"
    "Microsoft.ContainerRegistry"
    "Microsoft.App"
    "Microsoft.KeyVault"
    "Microsoft.OperationalInsights"
    "Microsoft.Insights"
  )
  
  local unregistered=()
  
  for provider in "${required_providers[@]}"; do
    local state
    state=$(az provider show --namespace "$provider" --query registrationState -o tsv 2>/dev/null || echo "Unknown")
    
    if [ "$state" = "Registered" ]; then
      print_success "$provider: Registered"
    else
      print_warning "$provider: $state"
      unregistered+=("$provider")
    fi
  done
  
  if [ ${#unregistered[@]} -gt 0 ]; then
    printf "\n"
    print_warning "Some resource providers are not registered"
    print_info "Register them with:"
    for provider in "${unregistered[@]}"; do
      printf "  az provider register --namespace %s\n" "$provider"
    done
    print_info "Note: Registration may take a few minutes"
    VALIDATION_WARNINGS=$((VALIDATION_WARNINGS + 1))
  fi
}

# ============================================================================
# Check Environment Configuration
# ============================================================================

check_environment() {
  print_header "Checking Environment Configuration"
  
  # Check Node.js (for local development)
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
  
  # Check package manager
  if command -v pnpm >/dev/null 2>&1; then
    print_success "pnpm is installed"
  elif command -v npm >/dev/null 2>&1; then
    print_warning "npm is installed (pnpm is recommended)"
  else
    print_warning "No Node.js package manager found"
    VALIDATION_WARNINGS=$((VALIDATION_WARNINGS + 1))
  fi
  
  # Check Git
  if command -v git >/dev/null 2>&1; then
    print_success "Git is installed"
  else
    print_warning "Git is not installed (recommended for version control)"
    VALIDATION_WARNINGS=$((VALIDATION_WARNINGS + 1))
  fi
}

# ============================================================================
# Show Validation Summary
# ============================================================================

show_summary() {
  if [ "$JSON_OUTPUT" = true ]; then
    # Output JSON format
    cat << EOF
{
  "status": "$([ "$VALIDATION_ERRORS" -eq 0 ] && echo "success" || echo "error")",
  "errors": $VALIDATION_ERRORS,
  "warnings": $VALIDATION_WARNINGS,
  "can_continue": $([ "$VALIDATION_ERRORS" -eq 0 ] && echo "true" || echo "false")
}
EOF
  else
    # Standard output
    print_header "Validation Summary"
    
    printf "Errors:   %d\n" "$VALIDATION_ERRORS"
    printf "Warnings: %d\n" "$VALIDATION_WARNINGS"
    printf "\n"
    
    if [ "$VALIDATION_ERRORS" -eq 0 ]; then
      print_success "All critical checks passed! ✨"
      printf "\n"
      print_info "You're ready to go! Next steps:"
      printf "  1. Development: bash scripts/dev/00_init_setup.sh\n"
      printf "  2. Production:  bash scripts/deploy/01_deploy_infrastructure.sh\n"
      printf "\n"
      
      if [ "$VALIDATION_WARNINGS" -gt 0 ]; then
        print_warning "You have $VALIDATION_WARNINGS warnings"
        print_info "Review warnings above and fix if necessary"
      fi
    else
      print_error "Validation failed with $VALIDATION_ERRORS errors"
      print_info "Run: bash scripts/dev/00_init_setup.sh to install missing tools"
    fi
  fi
  
  # Exit with appropriate code
  if [ "$VALIDATION_ERRORS" -eq 0 ]; then
    if [ "$VALIDATION_WARNINGS" -gt 0 ]; then
      exit 2  # Warnings only
    else
      exit 0  # All good
    fi
  else
    exit 1  # Errors found
  fi
}

# ============================================================================
# Main Script
# ============================================================================

main() {
  print_header "Azure Deployment Prerequisites Validation"
  
  # Run all checks
  check_cli_tools
  check_azure_auth
  check_azure_permissions
  check_required_files
  check_resource_providers
  check_environment
  show_summary
}

# Run main function
main

