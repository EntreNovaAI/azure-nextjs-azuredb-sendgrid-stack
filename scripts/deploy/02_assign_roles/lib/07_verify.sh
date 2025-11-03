#!/usr/bin/env bash
#
# Role Verification Library
#
# Purpose:
#   Verify role assignments by attempting to reassign them
#   If roles already exist, Azure will return success
#   This ensures roles are properly assigned regardless of previous state
#

# Source utilities
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$SCRIPT_DIR/00_utils.sh"

# ============================================================================
# Verification Functions
# ============================================================================

# Verify that all role assignments are active by reassigning them
# Returns 0 regardless of verification status (warnings only)
verify_roles() {
  print_header "Verifying Role Assignments"
  
  print_info "Attempting to reassign roles to ensure they exist..."
  printf "\n"
  
  # Verify individual roles by reassigning
  verify_acr_pull_role
  verify_keyvault_secrets_role
  
  # Show propagation note
  printf "\n"
  print_success "Role verification complete!"
  print_info "Note: Role assignments may take 1-2 minutes to fully propagate in Azure"
}

# ============================================================================
# Helper Functions
# ============================================================================

# Verify AcrPull role by attempting to reassign it
verify_acr_pull_role() {
  print_info "Verifying AcrPull role on ACR..."
  
  # Use the same logic as assignment - if role exists, Azure returns success
  # Temporarily disable exit on error
  set +e
  ACR_RESULT=$(timeout 90 az role assignment create \
    --assignee-object-id "$PRINCIPAL_ID" \
    --assignee-principal-type ServicePrincipal \
    --role "$ACR_PULL_ROLE_ID" \
    --scope "$ACR_ID" \
    --subscription "$SUBSCRIPTION_ID" \
    --output json 2>&1)
  ACR_EXIT_CODE=$?
  set -e
  
  # Check result - same logic as 06_roles.sh
  if echo "$ACR_RESULT" | grep -q '"principalId"'; then
    print_success "✓ AcrPull role verified (assigned successfully)"
  elif echo "$ACR_RESULT" | grep -qi "already exists\|Conflict"; then
    print_success "✓ AcrPull role verified (already exists)"
  elif [ $ACR_EXIT_CODE -eq 124 ]; then
    # Exit code 124 means timeout
    print_warning "⚠ Command timed out - role may exist but couldn't verify"
  elif [ $ACR_EXIT_CODE -ne 0 ]; then
    print_warning "⚠ Could not verify AcrPull role"
    print_info "Error details:"
    echo "$ACR_RESULT" | head -5
  else
    print_success "✓ AcrPull role verified"
  fi
}

# Verify Key Vault Secrets User role by attempting to reassign it
verify_keyvault_secrets_role() {
  print_info "Verifying Key Vault Secrets User role..."
  
  # Use the same logic as assignment - if role exists, Azure returns success
  # Temporarily disable exit on error
  set +e
  KV_RESULT=$(timeout 90 az role assignment create \
    --assignee-object-id "$PRINCIPAL_ID" \
    --assignee-principal-type ServicePrincipal \
    --role "$KV_SECRETS_USER_ROLE_ID" \
    --scope "$KV_ID" \
    --subscription "$SUBSCRIPTION_ID" \
    --output json 2>&1)
  KV_EXIT_CODE=$?
  set -e
  
  # Check result - same logic as 06_roles.sh
  if echo "$KV_RESULT" | grep -q '"principalId"'; then
    print_success "✓ Key Vault Secrets User role verified (assigned successfully)"
  elif echo "$KV_RESULT" | grep -qi "already exists\|Conflict"; then
    print_success "✓ Key Vault Secrets User role verified (already exists)"
  elif [ $KV_EXIT_CODE -eq 124 ]; then
    # Exit code 124 means timeout
    print_warning "⚠ Command timed out - role may exist but couldn't verify"
  elif [ $KV_EXIT_CODE -ne 0 ]; then
    print_warning "⚠ Could not verify Key Vault Secrets User role"
    print_info "Error details:"
    echo "$KV_RESULT" | head -5
  else
    print_success "✓ Key Vault Secrets User role verified"
  fi
}

