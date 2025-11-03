#!/usr/bin/env bash
#
# Role Assignment Library
#
# Purpose:
#   Assign Azure RBAC roles to managed identity
#   - AcrPull role for Container Registry access
#   - Key Vault Secrets User role for Key Vault access
#

# Source utilities
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$SCRIPT_DIR/00_utils.sh"

# ============================================================================
# Role Definition Constants
# ============================================================================

# Role Definition IDs (these are the same across all Azure subscriptions)
# AcrPull: Pull images from Azure Container Registry
ACR_PULL_ROLE_ID="7f951dda-4ed3-4680-a7ca-43fe172d538d"
# Key Vault Secrets User: Read secrets from Key Vault
KV_SECRETS_USER_ROLE_ID="4633458b-17de-408a-b874-0445c86b69e6"

# Export for use in other scripts
export ACR_PULL_ROLE_ID
export KV_SECRETS_USER_ROLE_ID

# ============================================================================
# Role Assignment Functions
# ============================================================================

# Assign all required RBAC roles
# Returns 0 on success (even if roles already exist)
assign_roles() {
  print_header "Assigning RBAC Roles"
  
  # Ask for confirmation before proceeding
  if ! confirm "Proceed with role assignments?"; then
    print_info "Role assignment cancelled by user"
    exit 0
  fi
  
  # Assign individual roles
  assign_acr_pull_role
  assign_keyvault_secrets_role
  
  print_success "All role assignments completed!"
}

# ============================================================================
# Helper Functions
# ============================================================================

# Assign AcrPull role for Container Registry access
assign_acr_pull_role() {
  # Best practice: Use role definition ID instead of role name
  # Best practice: Specify principalType for clarity
  # Best practice: Scope to minimum necessary (ACR resource, not resource group)
  print_info "Assigning AcrPull role on ACR..."
  print_info "Principal ID: $PRINCIPAL_ID"
  print_info "ACR Scope: $ACR_ID"
  
  # Try assignment and capture output
  # Using timeout to prevent hanging
  print_info "Executing role assignment command..."
  
  # Capture both stdout and stderr, and track exit code
  # Note: --subscription parameter is required even though scope contains subscription path
  # Best practice: Always explicitly specify subscription to avoid context issues
  set +e  # Temporarily disable exit on error
  ACR_RESULT=$(timeout 90 az role assignment create \
    --assignee-object-id "$PRINCIPAL_ID" \
    --assignee-principal-type ServicePrincipal \
    --role "$ACR_PULL_ROLE_ID" \
    --scope "$ACR_ID" \
    --subscription "$SUBSCRIPTION_ID" \
    --output json 2>&1)
  ACR_EXIT_CODE=$?
  set -e  # Re-enable exit on error
  
  print_info "Result received. Checking status (exit code: $ACR_EXIT_CODE)..."
  
  # Check result and provide appropriate feedback
  if echo "$ACR_RESULT" | grep -q '"principalId"'; then
    print_success "AcrPull role assigned successfully"
  elif echo "$ACR_RESULT" | grep -qi "already exists\|Conflict"; then
    print_success "AcrPull role already assigned (this is fine)"
  elif [ $ACR_EXIT_CODE -eq 124 ]; then
    # Exit code 124 means timeout
    print_error "Command timed out after 90 seconds"
    printf "\n"
    print_warning "This usually means:"
    print_info "  1. Network connectivity issues to Azure"
    print_info "  2. Azure API is experiencing delays"
    print_info "  3. The managed identity doesn't exist yet (needs time to propagate)"
    printf "\n"
    print_info "Command that was run:"
    printf "  az role assignment create \\\\\n"
    printf "    --assignee-object-id %s \\\\\n" "$PRINCIPAL_ID"
    printf "    --assignee-principal-type ServicePrincipal \\\\\n"
    printf "    --role %s \\\\\n" "$ACR_PULL_ROLE_ID"
    printf "    --scope %s \\\\\n" "$ACR_ID"
    printf "    --subscription %s\n" "$SUBSCRIPTION_ID"
    printf "\n"
    print_warning "Continuing anyway - check Azure Portal to verify"
  elif [ $ACR_EXIT_CODE -ne 0 ]; then
    print_error "Failed to assign AcrPull role (exit code: $ACR_EXIT_CODE)"
    printf "\n"
    print_warning "Error details:"
    echo "$ACR_RESULT" | head -20
    printf "\n"
    print_info "Command that was run:"
    printf "  az role assignment create \\\\\n"
    printf "    --assignee-object-id %s \\\\\n" "$PRINCIPAL_ID"
    printf "    --assignee-principal-type ServicePrincipal \\\\\n"
    printf "    --role %s \\\\\n" "$ACR_PULL_ROLE_ID"
    printf "    --scope %s \\\\\n" "$ACR_ID"
    printf "    --subscription %s\n" "$SUBSCRIPTION_ID"
    printf "\n"
    print_warning "Continuing anyway - check Azure Portal to verify"
  else
    print_success "AcrPull role assigned successfully"
  fi
}

# Assign Key Vault Secrets User role for Key Vault access
assign_keyvault_secrets_role() {
  # Best practice: Use role definition ID instead of role name
  # Best practice: Specify principalType for clarity  
  # Best practice: Scope to minimum necessary (Key Vault resource, not resource group)
  print_info "Assigning Key Vault Secrets User role..."
  print_info "Principal ID: $PRINCIPAL_ID"
  print_info "Key Vault Scope: $KV_ID"
  
  # Try assignment and capture output
  # Using timeout to prevent hanging
  print_info "Executing role assignment command..."
  
  # Capture both stdout and stderr, and track exit code
  # Note: --subscription parameter is required even though scope contains subscription path
  # Best practice: Always explicitly specify subscription to avoid context issues
  set +e  # Temporarily disable exit on error
  KV_RESULT=$(timeout 90 az role assignment create \
    --assignee-object-id "$PRINCIPAL_ID" \
    --assignee-principal-type ServicePrincipal \
    --role "$KV_SECRETS_USER_ROLE_ID" \
    --scope "$KV_ID" \
    --subscription "$SUBSCRIPTION_ID" \
    --output json 2>&1)
  KV_EXIT_CODE=$?
  set -e  # Re-enable exit on error
  
  print_info "Result received. Checking status (exit code: $KV_EXIT_CODE)..."
  
  # Check result and provide appropriate feedback
  if echo "$KV_RESULT" | grep -q '"principalId"'; then
    print_success "Key Vault Secrets User role assigned successfully"
  elif echo "$KV_RESULT" | grep -qi "already exists\|Conflict"; then
    print_success "Key Vault Secrets User role already assigned (this is fine)"
  elif [ $KV_EXIT_CODE -eq 124 ]; then
    # Exit code 124 means timeout
    print_error "Command timed out after 90 seconds"
    printf "\n"
    print_warning "This usually means:"
    print_info "  1. Network connectivity issues to Azure"
    print_info "  2. Azure API is experiencing delays"
    print_info "  3. The managed identity doesn't exist yet (needs time to propagate)"
    printf "\n"
    print_info "Command that was run:"
    printf "  az role assignment create \\\\\n"
    printf "    --assignee-object-id %s \\\\\n" "$PRINCIPAL_ID"
    printf "    --assignee-principal-type ServicePrincipal \\\\\n"
    printf "    --role %s \\\\\n" "$KV_SECRETS_USER_ROLE_ID"
    printf "    --scope %s \\\\\n" "$KV_ID"
    printf "    --subscription %s\n" "$SUBSCRIPTION_ID"
    printf "\n"
    print_warning "Continuing anyway - check Azure Portal to verify"
  elif [ $KV_EXIT_CODE -ne 0 ]; then
    print_error "Failed to assign Key Vault Secrets User role (exit code: $KV_EXIT_CODE)"
    printf "\n"
    print_warning "Error details:"
    echo "$KV_RESULT" | head -20
    printf "\n"
    print_info "Command that was run:"
    printf "  az role assignment create \\\\\n"
    printf "    --assignee-object-id %s \\\\\n" "$PRINCIPAL_ID"
    printf "    --assignee-principal-type ServicePrincipal \\\\\n"
    printf "    --role %s \\\\\n" "$KV_SECRETS_USER_ROLE_ID"
    printf "    --scope %s \\\\\n" "$KV_ID"
    printf "    --subscription %s\n" "$SUBSCRIPTION_ID"
    printf "\n"
    print_warning "Continuing anyway - check Azure Portal to verify"
  else
    print_success "Key Vault Secrets User role assigned successfully"
  fi
}

