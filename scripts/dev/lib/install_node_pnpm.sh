#!/usr/bin/env bash
#
# Node.js and pnpm Installation Library
#
# Purpose:
#   Install Node.js 20 LTS and pnpm package manager
#   Supports multiple operating systems and package managers
#

# ============================================================================
# Node.js Installation
# ============================================================================

# Install Node.js 20 LTS
install_nodejs() {
  print_info "Installing Node.js 20 LTS..."
  log_message "Starting Node.js installation"
  
  case "$OS_TYPE" in
    linux|wsl)
      case "$PKG_MANAGER" in
        apt)
          # Use NodeSource repository for latest Node.js 20
          print_info "Using NodeSource repository..."
          if curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -; then
            if sudo apt-get install -y nodejs; then
              print_success "Node.js installed successfully"
              log_message "Node.js installed via apt"
              return 0
            fi
          fi
          ;;
        dnf|yum)
          # Use NodeSource for Red Hat based systems
          print_info "Using NodeSource repository..."
          if curl -fsSL https://rpm.nodesource.com/setup_20.x | sudo bash -; then
            if sudo "$PKG_MANAGER" install -y nodejs; then
              print_success "Node.js installed successfully"
              log_message "Node.js installed via $PKG_MANAGER"
              return 0
            fi
          fi
          ;;
      esac
      ;;
    macos)
      if [ "$PKG_MANAGER" = "brew" ]; then
        if brew install node@20; then
          print_success "Node.js installed successfully"
          log_message "Node.js installed via brew"
          return 0
        fi
      else
        print_error "Homebrew is required for macOS"
        print_info "Install Homebrew: /bin/bash -c \"\$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)\""
        return 1
      fi
      ;;
    windows)
      print_warning "Automated Node.js installation not supported on Git Bash"
      print_info "Please download and install Node.js manually:"
      print_info "  https://nodejs.org/en/download/"
      print_info "Download the Windows Installer (.msi) for Node.js 20 LTS"
      return 1
      ;;
  esac
  
  print_error "Node.js installation failed"
  log_message "Node.js installation failed"
  return 1
}

# ============================================================================
# pnpm Installation
# ============================================================================

# Install pnpm via corepack
install_pnpm() {
  print_info "Installing pnpm..."
  log_message "Starting pnpm installation"
  
  # Check if Node.js is available
  if ! command_exists node; then
    print_error "Node.js must be installed before pnpm"
    return 1
  fi
  
  # Try corepack first (recommended method)
  if command_exists corepack; then
    print_info "Using corepack to install pnpm..."
    if corepack enable && corepack prepare pnpm@latest --activate; then
      print_success "pnpm installed via corepack"
      log_message "pnpm installed via corepack"
      return 0
    fi
  fi
  
  # Fallback to npm global install
  print_info "Installing pnpm via npm..."
  if npm install -g pnpm; then
    print_success "pnpm installed via npm"
    log_message "pnpm installed via npm"
    return 0
  fi
  
  print_error "pnpm installation failed"
  log_message "pnpm installation failed"
  return 1
}

# ============================================================================
# Check and Install Node.js
# ============================================================================

# Check if Node.js is installed, offer to install if missing
check_install_nodejs() {
  if command_exists node; then
    local version
    version=$(node --version)
    print_success "Node.js is already installed: $version"
    log_message "Node.js found: $version"
    return 0
  fi
  
  print_warning "Node.js is not installed (required)"
  print_info "Node.js is required for running the application"
  
  if prompt_yes_no "Install Node.js 20 LTS now?"; then
    if install_nodejs; then
      # Verify installation
      if command_exists node; then
        local version
        version=$(node --version)
        print_success "Node.js $version installed successfully"
        return 0
      fi
    fi
    
    print_error "Failed to install Node.js"
    return 1
  else
    print_error "Node.js installation declined - cannot continue"
    return 1
  fi
}

# ============================================================================
# Check and Install pnpm
# ============================================================================

# Check if pnpm is installed, offer to install if missing
check_install_pnpm() {
  if command_exists pnpm; then
    local version
    version=$(pnpm --version)
    print_success "pnpm is already installed: $version"
    log_message "pnpm found: $version"
    return 0
  fi
  
  print_warning "pnpm is not installed (required)"
  print_info "pnpm is the package manager for this project"
  
  if prompt_yes_no "Install pnpm now?"; then
    if install_pnpm; then
      # Verify installation
      if command_exists pnpm; then
        local version
        version=$(pnpm --version)
        print_success "pnpm $version installed successfully"
        return 0
      fi
    fi
    
    print_error "Failed to install pnpm"
    return 1
  else
    print_error "pnpm installation declined - cannot continue"
    return 1
  fi
}

