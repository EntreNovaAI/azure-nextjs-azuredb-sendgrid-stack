#!/usr/bin/env bash
#
# Additional Tools Installation Library
#
# Purpose:
#   Install helpful tools: jq, openssl, curl, git, Stripe CLI
#   These tools enhance development experience
#

# ============================================================================
# jq Installation
# ============================================================================

# Install jq JSON processor
install_jq() {
  print_info "Installing jq..."
  log_message "Starting jq installation"
  
  case "$OS_TYPE" in
    linux|wsl)
      case "$PKG_MANAGER" in
        apt)
          if sudo apt-get update && sudo apt-get install -y jq; then
            print_success "jq installed successfully"
            log_message "jq installed via apt"
            return 0
          fi
          ;;
        dnf|yum)
          if sudo "$PKG_MANAGER" install -y jq; then
            print_success "jq installed successfully"
            log_message "jq installed via $PKG_MANAGER"
            return 0
          fi
          ;;
      esac
      ;;
    macos)
      if [ "$PKG_MANAGER" = "brew" ]; then
        if brew install jq; then
          print_success "jq installed successfully"
          log_message "jq installed via brew"
          return 0
        fi
      fi
      ;;
    windows)
      if [ "$PKG_MANAGER" = "choco" ]; then
        if choco install -y jq; then
          print_success "jq installed successfully"
          log_message "jq installed via choco"
          return 0
        fi
      else
        print_warning "Manual installation required"
        print_info "Download from: https://jqlang.github.io/jq/download/"
        return 1
      fi
      ;;
  esac
  
  print_error "jq installation failed"
  log_message "jq installation failed"
  return 1
}

# ============================================================================
# Git Installation
# ============================================================================

# Install Git
install_git() {
  print_info "Installing Git..."
  log_message "Starting Git installation"
  
  case "$OS_TYPE" in
    linux|wsl)
      case "$PKG_MANAGER" in
        apt)
          if sudo apt-get update && sudo apt-get install -y git; then
            print_success "Git installed successfully"
            log_message "Git installed via apt"
            return 0
          fi
          ;;
        dnf|yum)
          if sudo "$PKG_MANAGER" install -y git; then
            print_success "Git installed successfully"
            log_message "Git installed via $PKG_MANAGER"
            return 0
          fi
          ;;
      esac
      ;;
    macos)
      if [ "$PKG_MANAGER" = "brew" ]; then
        if brew install git; then
          print_success "Git installed successfully"
          log_message "Git installed via brew"
          return 0
        fi
      else
        # Git usually comes with Xcode Command Line Tools
        print_info "Installing Xcode Command Line Tools..."
        if xcode-select --install 2>/dev/null; then
          print_success "Git will be installed with Xcode tools"
          return 0
        fi
      fi
      ;;
    windows)
      print_warning "You're using Git Bash, so Git is already available"
      return 0
      ;;
  esac
  
  print_error "Git installation failed"
  log_message "Git installation failed"
  return 1
}

# ============================================================================
# Stripe CLI Installation
# ============================================================================

# Install Stripe CLI
install_stripe() {
  print_info "Installing Stripe CLI..."
  log_message "Starting Stripe CLI installation"
  
  case "$OS_TYPE" in
    linux|wsl)
      if [ "$PKG_MANAGER" = "apt" ]; then
        # Add Stripe repository and install
        if curl -s https://packages.stripe.dev/api/security/keypair/stripe-cli-gpg/public | sudo gpg --dearmor -o /usr/share/keyrings/stripe.gpg; then
          echo "deb [signed-by=/usr/share/keyrings/stripe.gpg] https://packages.stripe.dev/stripe-cli-debian-local stable main" | sudo tee /etc/apt/sources.list.d/stripe.list
          if sudo apt-get update && sudo apt-get install -y stripe; then
            print_success "Stripe CLI installed successfully"
            log_message "Stripe CLI installed via apt"
            return 0
          fi
        fi
      fi
      ;;
    macos)
      if [ "$PKG_MANAGER" = "brew" ]; then
        if brew install stripe/stripe-cli/stripe; then
          print_success "Stripe CLI installed successfully"
          log_message "Stripe CLI installed via brew"
          return 0
        fi
      fi
      ;;
    windows)
      if [ "$PKG_MANAGER" = "choco" ]; then
        if choco install -y stripe-cli; then
          print_success "Stripe CLI installed successfully"
          log_message "Stripe CLI installed via choco"
          return 0
        fi
      fi
      ;;
  esac
  
  print_warning "Stripe CLI installation failed"
  print_info "You can install it later from: https://stripe.com/docs/stripe-cli"
  log_message "Stripe CLI installation failed"
  return 1
}

# ============================================================================
# Check and Install Tools
# ============================================================================

# Check and install jq
check_install_jq() {
  if command_exists jq; then
    local version
    version=$(jq --version)
    print_success "jq is already installed: $version"
    log_message "jq found: $version"
    return 0
  fi
  
  print_warning "jq is not installed (recommended)"
  print_info "jq is helpful for JSON parsing in scripts"
  
  if prompt_install_skip "Install jq now?"; then
    local result=$?
    if [ $result -eq 2 ]; then
      print_info "Skipping jq installation"
      log_message "jq installation skipped by user"
      return 0
    elif [ $result -eq 0 ]; then
      install_jq || true
    fi
  fi
  
  return 0
}

# Check and install Git
check_install_git() {
  if command_exists git; then
    local version
    version=$(git --version)
    print_success "Git is already installed: $version"
    log_message "Git found: $version"
    return 0
  fi
  
  print_warning "Git is not installed (recommended)"
  print_info "Git is essential for version control"
  
  if prompt_install_skip "Install Git now?"; then
    local result=$?
    if [ $result -eq 2 ]; then
      print_info "Skipping Git installation"
      log_message "Git installation skipped by user"
      return 0
    elif [ $result -eq 0 ]; then
      install_git || true
    fi
  fi
  
  return 0
}

# Check and install Stripe CLI
check_install_stripe() {
  if command_exists stripe; then
    local version
    version=$(stripe version 2>/dev/null | head -1)
    print_success "Stripe CLI is already installed: $version"
    log_message "Stripe CLI found: $version"
    return 0
  fi
  
  print_warning "Stripe CLI is not installed (optional)"
  print_info "Stripe CLI is useful for testing payment webhooks"
  
  if prompt_install_skip "Install Stripe CLI now?"; then
    local result=$?
    if [ $result -eq 2 ]; then
      print_info "Skipping Stripe CLI installation"
      log_message "Stripe CLI installation skipped by user"
      return 0
    elif [ $result -eq 0 ]; then
      install_stripe || true
    fi
  fi
  
  return 0
}

# Check curl and openssl (usually pre-installed)
check_basic_tools() {
  # Check curl
  if command_exists curl; then
    print_success "curl is installed"
  else
    print_warning "curl is not installed (required)"
    print_info "Please install curl manually for your system"
  fi
  
  # Check openssl
  if command_exists openssl; then
    print_success "openssl is installed"
  else
    print_warning "openssl is not installed (recommended)"
    print_info "openssl is used to generate secure secrets"
  fi
}

