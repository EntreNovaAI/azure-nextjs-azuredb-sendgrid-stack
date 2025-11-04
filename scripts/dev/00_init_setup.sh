#!/usr/bin/env bash
#
# Automated Project Initialization Script
#
# Purpose:
#   Automatically set up development environment from fresh clone
#   Validates prerequisites and installs missing tools interactively
#
# Usage:
#   bash scripts/dev/00_init_setup.sh
#

set -euo pipefail

# ============================================================================
# Change to Project Root Directory
# ============================================================================

# Get the directory where this script is located
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# Change to project root (two levels up from scripts/dev/)
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
cd "$PROJECT_ROOT"

echo "Working from project root: $PROJECT_ROOT"

# ============================================================================
# Source Library Modules
# ============================================================================

# Source utility functions
source "$SCRIPT_DIR/lib/utils.sh"

# Initialize logging
init_log

# Source other modules
source "$SCRIPT_DIR/lib/os_detect.sh"
source "$SCRIPT_DIR/lib/install_node_pnpm.sh"
source "$SCRIPT_DIR/lib/install_azure.sh"
source "$SCRIPT_DIR/lib/install_docker.sh"
source "$SCRIPT_DIR/lib/install_tools.sh"

# ============================================================================
# Main Setup Process
# ============================================================================

main() {
  print_header "Automated Project Initialization"
  
  log_message "Starting automated setup"
  
  # Detect operating system and package manager
  print_header "System Detection"
  init_os_environment
  show_os_info
  
  # Run validation script first
  print_header "Running Prerequisites Validation"
  if [ -f "scripts/deploy/00_validate_prerequisites.sh" ]; then
    print_info "Checking current system state..."
    # Run validation in check-only mode (ignore exit code for now)
    bash scripts/deploy/00_validate_prerequisites.sh || true
  fi
  
  # Install critical prerequisites
  print_header "Installing Critical Prerequisites"
  
  # Node.js (required)
  if ! check_install_nodejs; then
    print_error "Setup failed: Node.js is required"
    exit 1
  fi
  
  # pnpm (required)
  if ! check_install_pnpm; then
    print_error "Setup failed: pnpm is required"
    exit 1
  fi
  
  # Install deployment tools (optional, can skip)
  print_header "Installing Deployment Tools (Optional)"
  
  check_install_azure_cli
  check_install_bicep
  check_install_docker
  
  # Install helpful tools
  print_header "Installing Additional Tools (Optional)"
  
  check_basic_tools
  check_install_jq
  check_install_git
  check_install_stripe
  
  # Set up environment file
  print_header "Setting Up Environment Configuration"
  
  # Check if .env.example exists and clone it to .env.local
  if [ -f ".env.example" ]; then
    if [ -f ".env.local" ]; then
      print_info ".env.local already exists, skipping copy"
    else
      print_info "Copying .env.example to .env.local"
      cp .env.example .env.local
      print_success "Created .env.local from .env.example"
      print_info "Please update .env.local with your actual configuration values"
    fi
  else
    print_warning ".env.example not found, skipping environment file creation"
    print_info "You may need to manually create .env.local with required environment variables"
  fi
  
  # Success summary
  print_header "Setup Complete!"
  
  print_success "Critical tools installed successfully"
  printf "\n"
  print_info "Next steps:"
  printf "  1. Install project dependencies: pnpm install\n"
  printf "  2. Configure environment: Update .env.local with your credentials\n"
  printf "  3. Set up database and run migrations\n"
  printf "  4. Start development server: pnpm dev\n"
  printf "\n"
  print_info "For detailed setup instructions, use the /init command in Cursor"
  printf "\n"
  
  log_message "Setup completed successfully"
}

# Run main function
main

