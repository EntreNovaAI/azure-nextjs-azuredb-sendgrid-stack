#!/usr/bin/env bash
#
# Permissions Checking Library
#
# Purpose:
#   Check if current user has permissions to assign roles
#   - Owner role allows all permissions
#   - User Access Administrator role allows role assignments
#

# Source utilities
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$SCRIPT_DIR/00_utils.sh"

# ============================================================================
# Permission Checking Function
# ============================================================================

# Check if current user has permissions to assign roles
# Verifies Owner or User Access Administrator role
# Returns 0 on success (or user confirms to proceed anyway)
# Exits with error if user declines to proceed
check_permissions() {
  print_header "Checking Your Permissions"
  
  # Get current user identity
  get_current_user_identity
  
  # Check role assignments
  check_role_assignments
}

# ============================================================================
# Helper Functions
# ============================================================================

# Get current user identity for role checks
get_current_user_identity() {
  print_info "Getting current user identity..."
  
  # Method 1: Get object ID from signed-in user (works for user accounts)
  CURRENT_USER_OBJECT_ID=$(az ad signed-in-user show --query id -o tsv 2>/dev/null || true)
  
  # Method 2: Get username/email (works for both users and service principals)
  CURRENT_USER_NAME=$(az account show --query user.name -o tsv 2>/dev/null || true)
  
  # Method 3: Get user type to determine best identifier
  CURRENT_USER_TYPE=$(az account show --query user.type -o tsv 2>/dev/null || true)
  
  print_info "User type: ${CURRENT_USER_TYPE:-unknown}"
  print_info "User name: ${CURRENT_USER_NAME:-unknown}"
  print_info "Object ID: ${CURRENT_USER_OBJECT_ID:-unknown}"
  
  # Determine which identifier to use for role assignment queries
  # For user accounts: use object ID if available, otherwise use username
  # For service principals: use username
  if [ -n "$CURRENT_USER_OBJECT_ID" ]; then
    CURRENT_USER_ID="$CURRENT_USER_OBJECT_ID"
  elif [ -n "$CURRENT_USER_NAME" ]; then
    CURRENT_USER_ID="$CURRENT_USER_NAME"
  else
    print_warning "Could not determine current user identity"
    print_info "Proceeding with role assignment attempt..."
    return 0
  fi
  
  export CURRENT_USER_ID
  print_success "Using identifier for role checks: $CURRENT_USER_ID"
}

# Check if user has Owner or User Access Administrator role
check_role_assignments() {
  print_info "Checking if you have role assignment permissions..."
  
  # Get resource group ID for proper scope checking
  print_info "Getting resource group scope..."
  RG_ID=$(az group show --name "$RESOURCE_GROUP" --query id -o tsv 2>/dev/null)
  
  if [ -z "$RG_ID" ]; then
    print_warning "Could not get resource group ID"
    print_info "Proceeding with role assignment attempt..."
    return 0
  fi
  print_info "Resource group scope: $RG_ID"
  
  # Get ALL role assignments for the current user (including inherited ones)
  print_info "Checking all your role assignments (including inherited)..."
  
  # Method 1: Check at resource group scope with inherited roles
  # This is the most reliable method for resource group permissions
  ALL_ROLES=$(az role assignment list \
    --resource-group "$RESOURCE_GROUP" \
    --include-inherited \
    --query "[].{Role:roleDefinitionName, Scope:scope, PrincipalId:principalId}" \
    -o json 2>/dev/null || echo "[]")
  
  # Filter to only assignments for the current user
  # We need to check both Object ID and Name in case one method worked
  if [ -n "$CURRENT_USER_OBJECT_ID" ]; then
    USER_ROLES=$(echo "$ALL_ROLES" | jq --arg id "$CURRENT_USER_OBJECT_ID" '[.[] | select(.PrincipalId == $id)]' 2>/dev/null || echo "[]")
  else
    USER_ROLES="[]"
  fi
  
  # If Method 1 returned no results, try Method 2: direct assignee lookup
  if [ "$USER_ROLES" = "[]" ] || [ -z "$USER_ROLES" ]; then
    print_info "Trying alternative role lookup method..."
    USER_ROLES=$(az role assignment list \
      --assignee "$CURRENT_USER_ID" \
      --query "[].{Role:roleDefinitionName, Scope:scope}" \
      -o json 2>/dev/null || echo "[]")
  fi
  
  # Use the results from whichever method worked
  ALL_ROLES="$USER_ROLES"
  
  # Extract just the role names for easier checking
  ROLE_NAMES=$(echo "$ALL_ROLES" | grep -o '"Role": "[^"]*"' | cut -d'"' -f4 || true)
  
  # Check if user has Owner or User Access Administrator role at ANY scope
  HAS_OWNER=$(echo "$ROLE_NAMES" | grep -i "^Owner$" || true)
  HAS_UAA=$(echo "$ROLE_NAMES" | grep -i "^User Access Administrator$" || true)
  
  # Debug: Show all roles found
  if [ -n "$ROLE_NAMES" ]; then
    print_info "Found roles:"
    echo "$ALL_ROLES" | grep -E '"Role"|"Scope"' | sed 's/^/  /' || true
  else
    print_warning "No roles found with current detection methods"
    print_info "This could be due to:"
    print_info "  - Azure CLI caching issues (try: az account clear && az login)"
    print_info "  - Roles assigned through group membership (not directly detected)"
    print_info "  - Recent role assignments (may take a few minutes to propagate)"
  fi
  
  # Check if user has any of the required roles
  if [ -n "$HAS_OWNER" ] || [ -n "$HAS_UAA" ]; then
    if [ -n "$HAS_OWNER" ]; then
      print_success "✓ You have Owner role - can assign roles"
    else
      print_success "✓ You have User Access Administrator role - can assign roles"
    fi
  else
    handle_missing_permissions
  fi
}

# Handle case where required permissions are not found
handle_missing_permissions() {
  print_warning "Could not automatically detect Owner or User Access Administrator role"
  printf "\n"
  print_info "Your current role assignments:"
  if [ -n "$ALL_ROLES" ] && [ "$ALL_ROLES" != "[]" ]; then
    echo "$ALL_ROLES" | grep -E '"Role"|"Scope"' | sed 's/^/  /'
  else
    echo "  (none found with current detection method)"
  fi
  printf "\n"
  print_warning "Note: Role detection can fail due to Azure CLI caching or permission format issues"
  print_info "If you KNOW you have User Access Administrator or Owner role, we can proceed"
  printf "\n"
  
  # Ask user if they want to proceed anyway
  if [ "${AUTO_YES:-false}" = true ]; then
    print_info "Auto-yes mode: Proceeding with role assignment attempt..."
    return 0
  fi
  
  printf "Do you have User Access Administrator or Owner role on this resource group? [Y/n]: "
  read -r response || true  # Prevent read from causing script exit
  
  case "$response" in
    [nN]|[nN][oO])
      # User explicitly said no
      show_permission_error_help
      exit 1
      ;;
    *)
      # Empty or any other input = yes (default)
      print_info "Proceeding with role assignment attempt..."
      print_info "If it fails, you'll see an error from Azure CLI"
      return 0
      ;;
  esac
}

# Show helpful error message for missing permissions
show_permission_error_help() {
  print_error "Role assignment requires Owner or User Access Administrator role"
  printf "\n"
  print_info "Solutions:"
  print_info "1. Ask your Azure admin to grant you 'User Access Administrator' role:"
  printf "   az role assignment create --role \"User Access Administrator\" \\\\\n"
  printf "     --assignee %s \\\\\n" "$CURRENT_USER_ID"
  printf "     --resource-group %s\n" "$RESOURCE_GROUP"
  printf "\n"
  print_info "2. Or ask your admin to grant you 'Owner' role (includes all permissions):"
  printf "   az role assignment create --role \"Owner\" \\\\\n"
  printf "     --assignee %s \\\\\n" "$CURRENT_USER_ID"
  printf "     --resource-group %s\n" "$RESOURCE_GROUP"
  printf "\n"
  print_info "3. Or ask your Azure admin to run this script and assign these roles:"
  printf "\n"
  printf "   # Assign AcrPull role\n"
  printf "   az role assignment create \\\\\n"
  printf "     --role %s \\\\\n" "${ACR_PULL_ROLE_ID}"
  printf "     --assignee %s \\\\\n" "$PRINCIPAL_ID"
  printf "     --scope %s\n" "$ACR_ID"
  printf "\n"
  printf "   # Assign Key Vault Secrets User role\n"
  printf "   az role assignment create \\\\\n"
  printf "     --role %s \\\\\n" "${KV_SECRETS_USER_ROLE_ID}"
  printf "     --assignee %s \\\\\n" "$PRINCIPAL_ID"
  printf "     --scope %s\n" "$KV_ID"
  printf "\n"
}

