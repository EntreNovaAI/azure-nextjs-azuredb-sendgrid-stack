#!/usr/bin/env bash
#
# Azure Infrastructure Deployment Script - Phase 1 (Foundation) - Main Orchestrator
#
# Purpose:
#   Deploy foundation Azure infrastructure using Bicep templates
#   This is Phase 1 of a two-phase deployment strategy
#   
#   Phase 1 (this script) deploys:
#   - SQL Database, ACR, Key Vault, Container Apps Environment
#   - Does NOT deploy Container App (no Docker image required yet)
#
#   Phase 2 (05_deploy_container_app.sh) deploys:
#   - Container App (after Docker image is built and pushed)
#
# Why Two Phases?
#   Solves the "chicken and egg" problem where Container App needs a 
#   Docker image, but you need infrastructure to push the image to ACR
#
# Usage:
#   bash scripts/deploy/01_deploy_infrastructure/01_deploy_infrastructure.sh [OPTIONS]
#
# Options:
#   --yes             Auto-confirm prompts (non-interactive mode)
#   --subscription    Azure subscription ID (optional)
#
# Note:
#   This script has been refactored into a modular architecture.
#   Individual functionality is split into focused library files in lib/:
#   - 00_utils.sh          : Utility functions (printing, input)
#   - 00_env_preparation.sh: Prepare .env.production from .env.local
#   - 01_prerequisites.sh  : Prerequisites checking
#   - 02_parameters.sh     : Parameter collection
#   - 03_validation.sh     : Bicep validation and what-if
#   - 04_deployment.sh     : Infrastructure deployment
#   - 05_outputs.sh        : Extract deployment outputs
#   - 06_env_generation.sh : Generate .env.production file
#   - 07_summary.sh        : Post-deployment summary
#   - 08_migrations.sh     : Database migrations (create tables)
#

set -euo pipefail

# ============================================================================
# Change to Project Root Directory
# ============================================================================

# Get the directory where this script is located
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# Change to project root (three levels up from scripts/deploy/01_deploy_infrastructure/)
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../../.." && pwd)"
cd "$PROJECT_ROOT"

# ============================================================================
# Configuration
# ============================================================================

# Environment file to generate
ENV_FILE=".env.production"
export ENV_FILE

# Phase 1: Deploy foundation resources only (no Container App yet)
BICEP_TEMPLATE="infrastructure/bicep/main-foundation.bicep"
export BICEP_TEMPLATE

# Default deployment values (can be changed here for easier customization)
DEFAULT_RESOURCE_GROUP="enova-rg"
DEFAULT_LOCATION="eastus2"
DEFAULT_PREFIX="enova"
DEFAULT_SQL_ADMIN_USER="sqladmin"
DEFAULT_SQL_SKU="Basic"

# Export defaults for use in library scripts
export DEFAULT_RESOURCE_GROUP
export DEFAULT_LOCATION
export DEFAULT_PREFIX
export DEFAULT_SQL_ADMIN_USER
export DEFAULT_SQL_SKU

# ============================================================================
# Parse Command Line Arguments
# ============================================================================

# Default values
AUTO_YES=false
SUBSCRIPTION_ID=""

# Parse arguments
while [ $# -gt 0 ]; do
  case "$1" in
    --yes)
      AUTO_YES=true
      shift
      ;;
    --subscription)
      SUBSCRIPTION_ID="$2"
      shift 2
      ;;
    *)
      printf "Unknown option: %s\n" "$1"
      printf "Usage: %s [--yes] [--subscription <id>]\n" "$0"
      exit 1
      ;;
  esac
done

# Export variables for use in library scripts
export AUTO_YES
export SUBSCRIPTION_ID

# ============================================================================
# Load Library Functions
# ============================================================================

# Get lib directory path
LIB_DIR="$SCRIPT_DIR/lib"

# Source all library files in execution order
source "$LIB_DIR/00_utils.sh"
source "$LIB_DIR/00_env_preparation.sh"
source "$LIB_DIR/01_prerequisites.sh"
source "$LIB_DIR/02_parameters.sh"
source "$LIB_DIR/03_validation.sh"
source "$LIB_DIR/04_deployment.sh"
source "$LIB_DIR/05_outputs.sh"
source "$LIB_DIR/06_env_generation.sh"
source "$LIB_DIR/08_migrations.sh"
source "$LIB_DIR/07_summary.sh"

# ============================================================================
# Main Orchestration Function
# ============================================================================

main() {
  print_header "Azure Infrastructure Deployment"
  
  # Execute all deployment steps in order
  # Each function is defined in its respective library file
  prepare_production_env   # First, copy .env.local to .env.production and set NODE_ENV=production
  check_prerequisites
  collect_parameters
  show_deployment_summary
  validate_bicep
  deploy_infrastructure
  extract_outputs
  generate_env_file
  run_database_migrations  # Create database tables after infrastructure is ready
  show_post_deployment_summary
}

# ============================================================================
# Script Entry Point
# ============================================================================

# Run main function
main


