#!/usr/bin/env bash
#
# Docker Installation Library
#
# Purpose:
#   Install Docker and verify Docker daemon
#   Needed for container builds and deployment
#

# ============================================================================
# Docker Installation
# ============================================================================

# Install Docker
install_docker() {
  print_info "Installing Docker..."
  log_message "Starting Docker installation"
  
  case "$OS_TYPE" in
    linux)
      case "$PKG_MANAGER" in
        apt)
          # Install Docker using Docker's official script
          print_info "Using Docker's official installation script..."
          if curl -fsSL https://get.docker.com | sudo sh; then
            # Add current user to docker group
            if sudo usermod -aG docker "$USER"; then
              print_success "Docker installed successfully"
              print_warning "You may need to log out and back in for group changes to take effect"
              log_message "Docker installed via official script"
              return 0
            fi
          fi
          ;;
        dnf|yum)
          # Install Docker via package manager
          if sudo "$PKG_MANAGER" install -y docker; then
            sudo systemctl start docker
            sudo systemctl enable docker
            sudo usermod -aG docker "$USER"
            print_success "Docker installed successfully"
            print_warning "You may need to log out and back in for group changes to take effect"
            log_message "Docker installed via $PKG_MANAGER"
            return 0
          fi
          ;;
      esac
      ;;
    wsl)
      print_warning "Docker Desktop is recommended for WSL"
      print_info "Install Docker Desktop for Windows:"
      print_info "  1. Download from: https://www.docker.com/products/docker-desktop"
      print_info "  2. Enable WSL 2 integration in Docker Desktop settings"
      print_info "  3. Restart WSL after installation"
      return 1
      ;;
    macos)
      if [ "$PKG_MANAGER" = "brew" ]; then
        # Install Docker Desktop via Homebrew Cask
        if brew install --cask docker; then
          print_success "Docker Desktop installed"
          print_info "Please start Docker Desktop from Applications"
          log_message "Docker Desktop installed via brew"
          return 0
        fi
      else
        print_error "Homebrew is required for macOS"
        print_info "Or download Docker Desktop manually:"
        print_info "  https://www.docker.com/products/docker-desktop"
        return 1
      fi
      ;;
    windows)
      print_warning "Automated Docker installation not supported on Git Bash"
      print_info "Please install Docker Desktop for Windows:"
      print_info "  https://www.docker.com/products/docker-desktop"
      print_info "Download and run the installer"
      return 1
      ;;
  esac
  
  print_error "Docker installation failed"
  log_message "Docker installation failed"
  return 1
}

# ============================================================================
# Docker Verification
# ============================================================================

# Verify Docker daemon is running
verify_docker_daemon() {
  if docker info >/dev/null 2>&1; then
    print_success "Docker daemon is running"
    return 0
  else
    print_warning "Docker is installed but daemon is not running"
    print_info "Start Docker:"
    case "$OS_TYPE" in
      linux)
        print_info "  sudo systemctl start docker"
        ;;
      macos|wsl)
        print_info "  Start Docker Desktop application"
        ;;
    esac
    return 1
  fi
}

# ============================================================================
# Check and Install Docker
# ============================================================================

# Check if Docker is installed, offer to install if missing
check_install_docker() {
  if command_exists docker; then
    local version
    version=$(docker --version | cut -d' ' -f3 | tr -d ',')
    print_success "Docker is already installed: $version"
    log_message "Docker found: $version"
    
    # Check if daemon is running
    verify_docker_daemon
    return 0
  fi
  
  print_warning "Docker is not installed (needed for deployment)"
  print_info "Docker is required for building and deploying containers"
  
  if prompt_install_skip "Install Docker now?"; then
    local result=$?
    if [ $result -eq 2 ]; then
      # User chose to skip
      print_info "Skipping Docker installation"
      log_message "Docker installation skipped by user"
      return 0
    elif [ $result -eq 0 ]; then
      # User chose to install
      if install_docker; then
        # Verify installation
        if command_exists docker; then
          local version
          version=$(docker --version | cut -d' ' -f3 | tr -d ',')
          print_success "Docker $version installed successfully"
          
          # Check daemon status
          verify_docker_daemon
          return 0
        fi
      fi
      
      print_error "Failed to install Docker"
      print_info "You can install it later before deployment"
      return 0  # Don't fail setup for optional tool
    fi
  fi
  
  print_info "Continuing without Docker"
  return 0
}

