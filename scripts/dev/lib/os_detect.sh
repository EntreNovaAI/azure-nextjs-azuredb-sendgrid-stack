#!/usr/bin/env bash
#
# OS Detection Library
#
# Purpose:
#   Detect operating system and package manager
#   Export variables for use in other scripts
#

# ============================================================================
# OS Detection
# ============================================================================

# Detect the operating system
# Returns: linux, wsl, macos, windows, or unknown
detect_os() {
  case "$OSTYPE" in
    linux-gnu*)
      # Check if running in WSL
      if grep -qi microsoft /proc/version 2>/dev/null; then
        echo "wsl"
      else
        echo "linux"
      fi
      ;;
    darwin*)
      echo "macos"
      ;;
    msys*|cygwin*)
      echo "windows"
      ;;
    *)
      echo "unknown"
      ;;
  esac
}

# ============================================================================
# Package Manager Detection
# ============================================================================

# Detect available package manager
# Returns: apt, dnf, brew, choco, winget, or none
detect_package_manager() {
  local os_type="$1"
  
  case "$os_type" in
    linux|wsl)
      if command -v apt-get >/dev/null 2>&1; then
        echo "apt"
      elif command -v dnf >/dev/null 2>&1; then
        echo "dnf"
      elif command -v yum >/dev/null 2>&1; then
        echo "yum"
      else
        echo "none"
      fi
      ;;
    macos)
      if command -v brew >/dev/null 2>&1; then
        echo "brew"
      else
        echo "none"
      fi
      ;;
    windows)
      if command -v choco >/dev/null 2>&1; then
        echo "choco"
      elif command -v winget >/dev/null 2>&1; then
        echo "winget"
      else
        echo "none"
      fi
      ;;
    *)
      echo "none"
      ;;
  esac
}

# ============================================================================
# Initialize OS Environment
# ============================================================================

# Initialize and export OS detection variables
init_os_environment() {
  # Detect OS
  OS_TYPE=$(detect_os)
  export OS_TYPE
  
  # Detect package manager
  PKG_MANAGER=$(detect_package_manager "$OS_TYPE")
  export PKG_MANAGER
  
  # Log detection results
  if [ -n "${INIT_LOG_FILE:-}" ]; then
    log_message "OS detected: $OS_TYPE"
    log_message "Package manager: $PKG_MANAGER"
  fi
  
  return 0
}

# ============================================================================
# Display OS Information
# ============================================================================

# Display detected OS and package manager
show_os_info() {
  print_info "Operating System: $OS_TYPE"
  print_info "Package Manager: $PKG_MANAGER"
  
  # Warn if no package manager found
  if [ "$PKG_MANAGER" = "none" ]; then
    print_warning "No package manager detected"
    print_info "Some installations may require manual steps"
  fi
}

