#!/usr/bin/env bash
#
# Azure Resource Cleanup Script
#
# Purpose:
#   Safely delete Azure resources to avoid unnecessary costs
#   Supports selective or complete resource deletion
#
# Usage:
#   bash scripts/deploy/06_az_cleanup.sh [--yes] [--resource-group <rg>] [--delete-rg]
#
# Options:
#   --yes              Auto-confirm prompts (non-interactive mode)
#   --resource-group   Specify resource group name
#   --delete-rg        Delete the entire resource group (fastest)
#

set -euo pipefail

# ============================================================================
# Configuration
# ============================================================================

RESOURCE_GROUP=""
AUTO_YES=false
DELETE_RG=false

# ============================================================================
# Parse Arguments
# ============================================================================

while [ $# -gt 0 ]; do
  case "$1" in
    --yes)
      AUTO_YES=true
      shift
      ;;
    --resource-group)
      RESOURCE_GROUP="$2"
      shift 2
      ;;
    --delete-rg)
      DELETE_RG=true
      shift
      ;;
    *)
      printf "Unknown option: %s\n" "$1"
      printf "Usage: %s [--yes] [--resource-group <rg>] [--delete-rg]\n" "$0"
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

# Double confirmation for critical operations
double_confirm() {
  if [ "$AUTO_YES" = true ]; then
    return 0
  fi
  
  local prompt="$1"
  
  if ! confirm "$prompt"; then
    return 1
  fi
  
  printf "Type 'DELETE' to confirm: "
  read -r response
  
  if [ "$response" = "DELETE" ]; then
    return 0
  else
    print_info "Confirmation failed"
    return 1
  fi
}

# ============================================================================
# Check Prerequisites
# ============================================================================

check_prerequisites() {
  if ! command -v az >/dev/null 2>&1; then
    print_error "Azure CLI is required but not installed."
    exit 1
  fi
  
  if ! az account show >/dev/null 2>&1; then
    print_error "Not logged in to Azure CLI"
    print_info "Run: az login"
    exit 1
  fi
}

# ============================================================================
# Get Resource Group
# ============================================================================

get_resource_group() {
  if [ -z "$RESOURCE_GROUP" ]; then
    # Try to read from .env.production
    if [ -f ".env.production" ]; then
      RESOURCE_GROUP=$(grep "^RESOURCE_GROUP=" ".env.production" 2>/dev/null | cut -d'=' -f2 || echo "")
    fi
    
    # Prompt if still not found
    if [ -z "$RESOURCE_GROUP" ]; then
      printf "Enter resource group name to delete: "
      read -r RESOURCE_GROUP
    fi
  fi
  
  if [ -z "$RESOURCE_GROUP" ]; then
    print_error "Resource group name is required"
    exit 1
  fi
  
  # Verify resource group exists
  if ! az group show --name "$RESOURCE_GROUP" >/dev/null 2>&1; then
    print_error "Resource group not found: $RESOURCE_GROUP"
    exit 1
  fi
  
  print_info "Target resource group: $RESOURCE_GROUP"
}

# ============================================================================
# List Resources
# ============================================================================

list_resources() {
  print_header "Resources in $RESOURCE_GROUP"
  
  # Get resource count
  local resource_count
  resource_count=$(az resource list --resource-group "$RESOURCE_GROUP" --query "length([])" -o tsv)
  
  if [ "$resource_count" -eq 0 ]; then
    print_info "No resources found in this resource group"
    return
  fi
  
  print_info "Found $resource_count resources:"
  printf "\n"
  
  # List resources by type
  az resource list --resource-group "$RESOURCE_GROUP" --query "[].{Type:type, Name:name}" -o table
  
  printf "\n"
}

# ============================================================================
# Delete Entire Resource Group
# ============================================================================

delete_resource_group() {
  print_header "⚠️  DELETE RESOURCE GROUP ⚠️"
  
  print_warning "This will DELETE ALL RESOURCES in the resource group:"
  print_warning "  • Resource Group: $RESOURCE_GROUP"
  print_warning "  • All contained resources will be permanently deleted"
  print_warning "  • This action CANNOT be undone"
  printf "\n"
  
  if ! double_confirm "Are you absolutely sure you want to DELETE the entire resource group?"; then
    print_info "Deletion cancelled by user"
    exit 0
  fi
  
  printf "\n"
  print_info "Deleting resource group: $RESOURCE_GROUP"
  print_info "This may take 5-15 minutes..."
  
  if az group delete --name "$RESOURCE_GROUP" --yes --no-wait; then
    print_success "Resource group deletion initiated"
    print_info "Deletion is running in the background"
    print_info "Check status: az group show --name $RESOURCE_GROUP"
  else
    print_error "Failed to delete resource group"
    exit 1
  fi
}

# ============================================================================
# Delete Individual Resources
# ============================================================================

delete_individual_resources() {
  print_header "Selective Resource Deletion"
  
  print_info "You can delete resources individually or by type"
  printf "\n"
  
  # Resource types to clean up (in deletion order)
  local resource_types=(
    "Container App"
    "Container Apps Environment"
    "Container Registry"
    "SQL Database"
    "SQL Server"
    "Key Vault"
    "Storage Account"
    "OpenAI Service"
    "Web PubSub"
    "Application Insights"
    "Log Analytics Workspace"
  )
  
  for resource_type in "${resource_types[@]}"; do
    case "$resource_type" in
      "Container App")
        delete_container_apps
        ;;
      "Container Apps Environment")
        delete_container_env
        ;;
      "Container Registry")
        delete_container_registry
        ;;
      "SQL Database")
        delete_sql_databases
        ;;
      "SQL Server")
        delete_sql_servers
        ;;
      "Key Vault")
        delete_key_vaults
        ;;
      "Storage Account")
        delete_storage_accounts
        ;;
      "OpenAI Service")
        delete_openai_services
        ;;
      "Web PubSub")
        delete_webpubsub
        ;;
      "Application Insights")
        delete_app_insights
        ;;
      "Log Analytics Workspace")
        delete_log_analytics
        ;;
    esac
  done
  
  printf "\n"
  print_success "Selective deletion complete"
  
  # Check if resource group is now empty
  local remaining_count
  remaining_count=$(az resource list --resource-group "$RESOURCE_GROUP" --query "length([])" -o tsv)
  
  if [ "$remaining_count" -eq 0 ]; then
    print_info "Resource group is now empty"
    if confirm "Delete the empty resource group?"; then
      az group delete --name "$RESOURCE_GROUP" --yes --no-wait
      print_success "Resource group deletion initiated"
    fi
  else
    print_info "$remaining_count resources remaining in resource group"
  fi
}

# Individual resource deletion functions
delete_container_apps() {
  local apps
  apps=$(az containerapp list --resource-group "$RESOURCE_GROUP" --query "[].name" -o tsv 2>/dev/null || echo "")
  
  if [ -z "$apps" ]; then
    return
  fi
  
  printf "\n"
  print_info "Found Container Apps: $apps"
  
  if confirm "Delete Container Apps?"; then
    while IFS= read -r app; do
      [ -z "$app" ] && continue
      print_info "Deleting Container App: $app"
      az containerapp delete --name "$app" --resource-group "$RESOURCE_GROUP" --yes --output none 2>/dev/null || true
      print_success "Deleted: $app"
    done <<< "$apps"
  fi
}

delete_container_env() {
  local envs
  envs=$(az containerapp env list --resource-group "$RESOURCE_GROUP" --query "[].name" -o tsv 2>/dev/null || echo "")
  
  if [ -z "$envs" ]; then
    return
  fi
  
  printf "\n"
  print_info "Found Container Apps Environments: $envs"
  
  if confirm "Delete Container Apps Environments?"; then
    while IFS= read -r env; do
      [ -z "$env" ] && continue
      print_info "Deleting Container Apps Environment: $env"
      az containerapp env delete --name "$env" --resource-group "$RESOURCE_GROUP" --yes --output none 2>/dev/null || true
      print_success "Deleted: $env"
    done <<< "$envs"
  fi
}

delete_container_registry() {
  local acrs
  acrs=$(az acr list --resource-group "$RESOURCE_GROUP" --query "[].name" -o tsv 2>/dev/null || echo "")
  
  if [ -z "$acrs" ]; then
    return
  fi
  
  printf "\n"
  print_info "Found Container Registries: $acrs"
  
  if confirm "Delete Container Registries?"; then
    while IFS= read -r acr; do
      [ -z "$acr" ] && continue
      print_info "Deleting Container Registry: $acr"
      az acr delete --name "$acr" --resource-group "$RESOURCE_GROUP" --yes --output none 2>/dev/null || true
      print_success "Deleted: $acr"
    done <<< "$acrs"
  fi
}

delete_sql_databases() {
  local servers
  servers=$(az sql server list --resource-group "$RESOURCE_GROUP" --query "[].name" -o tsv 2>/dev/null || echo "")
  
  if [ -z "$servers" ]; then
    return
  fi
  
  printf "\n"
  
  while IFS= read -r server; do
    [ -z "$server" ] && continue
    
    local dbs
    dbs=$(az sql db list --resource-group "$RESOURCE_GROUP" --server "$server" --query "[?name!='master'].name" -o tsv 2>/dev/null || echo "")
    
    if [ -n "$dbs" ]; then
      print_info "Found databases on $server: $dbs"
      
      if confirm "Delete databases on $server?"; then
        while IFS= read -r db; do
          [ -z "$db" ] && continue
          print_info "Deleting database: $db"
          az sql db delete --name "$db" --server "$server" --resource-group "$RESOURCE_GROUP" --yes --output none 2>/dev/null || true
          print_success "Deleted: $db"
        done <<< "$dbs"
      fi
    fi
  done <<< "$servers"
}

delete_sql_servers() {
  local servers
  servers=$(az sql server list --resource-group "$RESOURCE_GROUP" --query "[].name" -o tsv 2>/dev/null || echo "")
  
  if [ -z "$servers" ]; then
    return
  fi
  
  printf "\n"
  print_info "Found SQL Servers: $servers"
  
  if confirm "Delete SQL Servers?"; then
    while IFS= read -r server; do
      [ -z "$server" ] && continue
      print_info "Deleting SQL Server: $server"
      az sql server delete --name "$server" --resource-group "$RESOURCE_GROUP" --yes --output none 2>/dev/null || true
      print_success "Deleted: $server"
    done <<< "$servers"
  fi
}

delete_key_vaults() {
  local vaults
  vaults=$(az keyvault list --resource-group "$RESOURCE_GROUP" --query "[].name" -o tsv 2>/dev/null || echo "")
  
  if [ -z "$vaults" ]; then
    return
  fi
  
  printf "\n"
  print_info "Found Key Vaults: $vaults"
  print_warning "Key Vaults have soft-delete enabled and will be recoverable for 7 days"
  
  if confirm "Delete Key Vaults?"; then
    while IFS= read -r vault; do
      [ -z "$vault" ] && continue
      print_info "Deleting Key Vault: $vault"
      az keyvault delete --name "$vault" --resource-group "$RESOURCE_GROUP" --output none 2>/dev/null || true
      print_success "Deleted: $vault (soft-deleted, recoverable for 7 days)"
      
      if confirm "Permanently purge $vault? (cannot be recovered)"; then
        az keyvault purge --name "$vault" --output none 2>/dev/null || true
        print_success "Purged: $vault"
      fi
    done <<< "$vaults"
  fi
}

delete_storage_accounts() {
  local storage_accounts
  storage_accounts=$(az storage account list --resource-group "$RESOURCE_GROUP" --query "[].name" -o tsv 2>/dev/null || echo "")
  
  if [ -z "$storage_accounts" ]; then
    return
  fi
  
  printf "\n"
  print_info "Found Storage Accounts: $storage_accounts"
  
  if confirm "Delete Storage Accounts?"; then
    while IFS= read -r storage; do
      [ -z "$storage" ] && continue
      print_info "Deleting Storage Account: $storage"
      az storage account delete --name "$storage" --resource-group "$RESOURCE_GROUP" --yes --output none 2>/dev/null || true
      print_success "Deleted: $storage"
    done <<< "$storage_accounts"
  fi
}

delete_openai_services() {
  local openai_services
  openai_services=$(az cognitiveservices account list --resource-group "$RESOURCE_GROUP" --query "[?kind=='OpenAI'].name" -o tsv 2>/dev/null || echo "")
  
  if [ -z "$openai_services" ]; then
    return
  fi
  
  printf "\n"
  print_info "Found OpenAI Services: $openai_services"
  
  if confirm "Delete OpenAI Services?"; then
    while IFS= read -r openai; do
      [ -z "$openai" ] && continue
      print_info "Deleting OpenAI Service: $openai"
      az cognitiveservices account delete --name "$openai" --resource-group "$RESOURCE_GROUP" --output none 2>/dev/null || true
      print_success "Deleted: $openai"
    done <<< "$openai_services"
  fi
}

delete_webpubsub() {
  local pubsubs
  pubsubs=$(az webpubsub list --resource-group "$RESOURCE_GROUP" --query "[].name" -o tsv 2>/dev/null || echo "")
  
  if [ -z "$pubsubs" ]; then
    return
  fi
  
  printf "\n"
  print_info "Found Web PubSub Services: $pubsubs"
  
  if confirm "Delete Web PubSub Services?"; then
    while IFS= read -r pubsub; do
      [ -z "$pubsub" ] && continue
      print_info "Deleting Web PubSub: $pubsub"
      az webpubsub delete --name "$pubsub" --resource-group "$RESOURCE_GROUP" --output none 2>/dev/null || true
      print_success "Deleted: $pubsub"
    done <<< "$pubsubs"
  fi
}

delete_app_insights() {
  local insights
  insights=$(az monitor app-insights component show --resource-group "$RESOURCE_GROUP" --query "[].name" -o tsv 2>/dev/null || echo "")
  
  if [ -z "$insights" ]; then
    return
  fi
  
  printf "\n"
  print_info "Found Application Insights: $insights"
  
  if confirm "Delete Application Insights?"; then
    while IFS= read -r insight; do
      [ -z "$insight" ] && continue
      print_info "Deleting Application Insights: $insight"
      az monitor app-insights component delete --app "$insight" --resource-group "$RESOURCE_GROUP" --output none 2>/dev/null || true
      print_success "Deleted: $insight"
    done <<< "$insights"
  fi
}

delete_log_analytics() {
  local workspaces
  workspaces=$(az monitor log-analytics workspace list --resource-group "$RESOURCE_GROUP" --query "[].name" -o tsv 2>/dev/null || echo "")
  
  if [ -z "$workspaces" ]; then
    return
  fi
  
  printf "\n"
  print_info "Found Log Analytics Workspaces: $workspaces"
  
  if confirm "Delete Log Analytics Workspaces?"; then
    while IFS= read -r workspace; do
      [ -z "$workspace" ] && continue
      print_info "Deleting Log Analytics Workspace: $workspace"
      az monitor log-analytics workspace delete --workspace-name "$workspace" --resource-group "$RESOURCE_GROUP" --yes --force true --output none 2>/dev/null || true
      print_success "Deleted: $workspace"
    done <<< "$workspaces"
  fi
}

# ============================================================================
# Main Script
# ============================================================================

main() {
  print_header "⚠️  Azure Resource Cleanup ⚠️"
  
  print_warning "This script will delete Azure resources"
  print_warning "Make sure you have backups of any important data"
  printf "\n"
  
  check_prerequisites
  get_resource_group
  list_resources
  
  if [ "$DELETE_RG" = true ]; then
    delete_resource_group
  else
    print_info "Deletion options:"
    printf "  1. Delete entire resource group (fastest)\n"
    printf "  2. Delete resources individually (selective)\n"
    printf "\n"
    
    if confirm "Delete entire resource group?"; then
      delete_resource_group
    else
      delete_individual_resources
    fi
  fi
  
  printf "\n"
  print_success "Cleanup complete! 🧹"
}

# Run main function
main

