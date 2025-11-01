#!/usr/bin/env bash
#
# Azure Tools Installation Library
#
# Purpose:
#   Install Azure CLI and Bicep CLI
#   These tools are needed for Azure deployment
#

# ============================================================================
# Azure CLI Installation
# ============================================================================

# Install Azure CLI
install_azure_cli() {
  print_info "Installing Azure CLI..."
  log_message "Starting Azure CLI installation"
  
  case "$OS_TYPE" in
    linux|wsl)
      # Use Microsoft's installation script
      print_info "Downloading Azure CLI installation script..."
      if curl -sL https://aka.ms/InstallAzureCLIDeb | sudo bash; then
        print_success "Azure CLI installed successfully"
        log_message "Azure CLI installed via Microsoft script"
        return 0
      fi
      ;;
    macos)
      if [ "$PKG_MANAGER" = "brew" ]; then
        if brew install azure-cli; then
          print_success "Azure CLI installed successfully"
          log_message "Azure CLI installed via brew"
          return 0
        fi
      else
        print_error "Homebrew is required for macOS"
        return 1
      fi
      ;;
    windows)
      print_warning "Automated Azure CLI installation not supported on Git Bash"
      print_info "Please download and install Azure CLI manually:"
      print_info "  https://aka.ms/installazurecliwindows"
      print_info "Download and run the MSI installer"
      return 1
      ;;
  esac
  
  print_error "Azure CLI installation failed"
  log_message "Azure CLI installation failed"
  return 1
}

# ============================================================================
# Bicep CLI Installation
# ============================================================================

# Install Bicep CLI
install_bicep() {
  print_info "Installing Bicep CLI..."
  log_message "Starting Bicep installation"
  
  # Check if Azure CLI is available
  if ! command_exists az; then
    print_error "Azure CLI must be installed before Bicep"
    return 1
  fi
  
  # Install Bicep via Azure CLI
  if az bicep install; then
    print_success "Bicep CLI installed successfully"
    log_message "Bicep installed via az bicep install"
    return 0
  fi
  
  print_error "Bicep installation failed"
  log_message "Bicep installation failed"
  return 1
}

# ============================================================================
# Check and Install Azure CLI
# ============================================================================

# Check if Azure CLI is installed, offer to install if missing
check_install_azure_cli() {
  if command_exists az; then
    local version
    version=$(az version --query '"azure-cli"' -o tsv 2>/dev/null || echo "unknown")
    print_success "Azure CLI is already installed: $version"
    log_message "Azure CLI found: $version"
    return 0
  fi
  
  print_warning "Azure CLI is not installed (needed for deployment)"
  print_info "Azure CLI is required for deploying to Azure"
  
  if prompt_install_skip "Install Azure CLI now?"; then
    local result=$?
    if [ $result -eq 2 ]; then
      # User chose to skip
      print_info "Skipping Azure CLI installation"
      log_message "Azure CLI installation skipped by user"
      return 0
    elif [ $result -eq 0 ]; then
      # User chose to install
      if install_azure_cli; then
        # Verify installation
        if command_exists az; then
          local version
          version=$(az version --query '"azure-cli"' -o tsv 2>/dev/null || echo "unknown")
          print_success "Azure CLI $version installed successfully"
          return 0
        fi
      fi
      
      print_error "Failed to install Azure CLI"
      print_info "You can install it later before deployment"
      return 0  # Don't fail setup for optional tool
    fi
  fi
  
  print_info "Continuing without Azure CLI"
  return 0
}

# ============================================================================
# Check and Install Bicep
# ============================================================================

# Check if Bicep is installed, offer to install if missing
check_install_bicep() {
  # Skip if Azure CLI is not installed
  if ! command_exists az; then
    print_info "Skipping Bicep (Azure CLI not available)"
    return 0
  fi
  
  if az bicep version >/dev/null 2>&1; then
    local version
    version=$(az bicep version | grep -o 'version [0-9.]*' | cut -d' ' -f2)
    print_success "Bicep CLI is already installed: $version"
    log_message "Bicep found: $version"
    return 0
  fi
  
  print_warning "Bicep CLI is not installed (needed for deployment)"
  print_info "Bicep is used for Azure infrastructure as code"
  
  if prompt_install_skip "Install Bicep CLI now?"; then
    local result=$?
    if [ $result -eq 2 ]; then
      # User chose to skip
      print_info "Skipping Bicep installation"
      log_message "Bicep installation skipped by user"
      return 0
    elif [ $result -eq 0 ]; then
      # User chose to install
      if install_bicep; then
        # Verify installation
        if az bicep version >/dev/null 2>&1; then
          local version
          version=$(az bicep version | grep -o 'version [0-9.]*' | cut -d' ' -f2)
          print_success "Bicep CLI $version installed successfully"
          return 0
        fi
      fi
      
      print_error "Failed to install Bicep CLI"
      print_info "You can install it later: az bicep install"
      return 0  # Don't fail setup for optional tool
    fi
  fi
  
  print_info "Continuing without Bicep"
  return 0
}

