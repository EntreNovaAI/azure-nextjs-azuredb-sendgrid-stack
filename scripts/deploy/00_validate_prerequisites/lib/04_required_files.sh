#!/usr/bin/env bash
#
# Required Files Validation Library
#
# Purpose:
#   Check for required project files
#   - Bicep templates (main-foundation.bicep and main-app.bicep)
#   - Dockerfile (docker/Dockerfile)
#   - .env.example (optional but recommended)
#   - Deployment scripts
#
# Uses global variables from 00_utils.sh:
#   - VALIDATION_ERRORS
#   - VALIDATION_WARNINGS
#

# ============================================================================
# Required Files Check Function
# ============================================================================

# Check for required project files
# Increments VALIDATION_ERRORS for missing critical files
# Increments VALIDATION_WARNINGS for missing optional files
check_required_files() {
  print_header "Checking Required Files"
  
  # Check for Phase 1 Bicep template (Foundation) - CRITICAL
  if [ -f "infrastructure/bicep/main-foundation.bicep" ]; then
    print_success "Phase 1 Bicep template found (main-foundation.bicep)"
    
    # Validate Bicep syntax if Bicep CLI is available
    if command -v az >/dev/null 2>&1 && az bicep version >/dev/null 2>&1; then
      if az bicep build --file infrastructure/bicep/main-foundation.bicep --stdout >/dev/null 2>&1; then
        print_success "Phase 1 Bicep template is valid"
      else
        print_error "Phase 1 Bicep template has syntax errors"
        print_info "Run: az bicep build --file infrastructure/bicep/main-foundation.bicep"
        VALIDATION_ERRORS=$((VALIDATION_ERRORS + 1))
      fi
    fi
  else
    print_error "Phase 1 Bicep template not found: infrastructure/bicep/main-foundation.bicep"
    VALIDATION_ERRORS=$((VALIDATION_ERRORS + 1))
  fi
  
  # Check for Phase 2 Bicep template (Container App) - CRITICAL
  if [ -f "infrastructure/bicep/main-app.bicep" ]; then
    print_success "Phase 2 Bicep template found (main-app.bicep)"
    
    # Validate Bicep syntax if Bicep CLI is available
    if command -v az >/dev/null 2>&1 && az bicep version >/dev/null 2>&1; then
      if az bicep build --file infrastructure/bicep/main-app.bicep --stdout >/dev/null 2>&1; then
        print_success "Phase 2 Bicep template is valid"
      else
        print_error "Phase 2 Bicep template has syntax errors"
        print_info "Run: az bicep build --file infrastructure/bicep/main-app.bicep"
        VALIDATION_ERRORS=$((VALIDATION_ERRORS + 1))
      fi
    fi
  else
    print_error "Phase 2 Bicep template not found: infrastructure/bicep/main-app.bicep"
    VALIDATION_ERRORS=$((VALIDATION_ERRORS + 1))
  fi
  
  # Check for Dockerfile - CRITICAL
  if [ -f "docker/Dockerfile" ]; then
    print_success "Dockerfile found"
  else
    print_error "Dockerfile not found: docker/Dockerfile"
    VALIDATION_ERRORS=$((VALIDATION_ERRORS + 1))
  fi
  
  # Check for .env.example - OPTIONAL but recommended
  if [ -f ".env.example" ]; then
    print_success ".env.example found"
  else
    print_warning ".env.example not found (recommended for reference)"
    VALIDATION_WARNINGS=$((VALIDATION_WARNINGS + 1))
  fi
  
  # Check for deployment scripts - OPTIONAL but expected
  # These should exist in a complete project
  local scripts=(
    "scripts/dev/01_stripe_setup.sh"
    "scripts/deploy/01_deploy_infrastructure/01_deploy_infrastructure.sh"
    "scripts/deploy/02_assign_roles/02_assign_roles.sh"
    "scripts/deploy/03_configure_stripe/03_configure_stripe.sh"
    "scripts/deploy/04_build_and_push_image/04_build_and_push_image.sh"
    "scripts/deploy/05_deploy_container_app/05_deploy_container_app.sh"
    "scripts/deploy/06_bind_secrets/06_bind_secrets.sh"
    "scripts/deploy/07_get_connection_strings/07_get_connection_strings.sh"
    "scripts/deploy/99_cleanup_resources/99_cleanup_resources.sh"
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


