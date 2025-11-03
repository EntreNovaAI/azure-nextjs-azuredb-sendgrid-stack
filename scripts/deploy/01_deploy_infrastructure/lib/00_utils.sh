#!/usr/bin/env bash
#
# Utility Functions Library
#
# Purpose:
#   Common utility functions for printing, user interaction, and input handling
#   Used across all deployment scripts
#
# Functions:
#   - print_header()       : Print section headers
#   - print_info()         : Print informational messages
#   - print_success()      : Print success messages
#   - print_error()        : Print error messages
#   - print_warning()      : Print warning messages
#   - confirm()            : Ask user for yes/no confirmation
#   - read_with_default()  : Read input with a default value
#   - read_password()      : Read password securely with confirmation
#

# ============================================================================
# Print Functions
# ============================================================================

# Print colored section header
print_header() {
  printf "\n"
  printf "============================================================\n"
  printf " %s\n" "$1"
  printf "============================================================\n"
  printf "\n"
}

# Print informational message with icon
print_info() {
  printf "ℹ️  %s\n" "$1"
}

# Print success message with icon
print_success() {
  printf "✅ %s\n" "$1"
}

# Print error message with icon (sent to stderr)
print_error() {
  printf "❌ %s\n" "$1" >&2
}

# Print warning message with icon
print_warning() {
  printf "⚠️  %s\n" "$1"
}

# ============================================================================
# User Interaction Functions
# ============================================================================

# Ask user for yes/no confirmation
# Defaults to requiring explicit "yes" - user must type 'y' or 'yes' to confirm
# If AUTO_YES is set to true, always returns 0 (yes)
#
# Usage:
#   if confirm "Continue with deployment?"; then
#     echo "User confirmed"
#   else
#     echo "User declined"
#   fi
confirm() {
  # Check if AUTO_YES is set (should be exported by calling script)
  if [ "${AUTO_YES:-false}" = true ]; then
    return 0
  fi
  
  local prompt="$1"
  local response
  printf "%s (y/n): " "$prompt"
  read -r response
  
  case "$response" in
    [yY]|[yY][eE][sS])
      # User explicitly confirmed
      return 0
      ;;
    *)
      # Empty or any other input = no
      return 1
      ;;
  esac
}

# Read input with default value
# Displays the default value in brackets
# If user presses Enter without typing, returns the default
#
# Usage:
#   LOCATION=$(read_with_default "Azure region" "eastus2")
read_with_default() {
  local prompt="$1"
  local default="$2"
  local response
  
  # Print prompt to stderr so it's visible even if output is captured
  printf "%s [%s]: " "$prompt" "$default" >&2
  # Read from stdin
  read -r response
  
  if [ -z "$response" ]; then
    # User pressed Enter without typing - use default
    printf "%s" "$default"
  else
    # User provided input
    printf "%s" "$response"
  fi
}

# Read password securely with confirmation
# Input is hidden while typing
# Requires minimum 8 characters
# Asks user to confirm password by typing it twice
#
# Usage:
#   SQL_PASSWORD=$(read_password "SQL admin password")
read_password() {
  local prompt="$1"
  local password
  local password_confirm
  
  while true; do
    # Print prompt to stderr so it's always visible
    printf "%s (input will be hidden): " "$prompt" >&2
    read -rs password
    printf "\n" >&2
    
    # Validate minimum length
    if [ ${#password} -lt 8 ]; then
      print_error "Password must be at least 8 characters"
      continue
    fi
    
    # Ask for confirmation
    printf "Confirm password (input will be hidden): " >&2
    read -rs password_confirm
    printf "\n" >&2
    
    # Check if passwords match
    if [ "$password" = "$password_confirm" ]; then
      printf "%s" "$password"
      return 0
    else
      print_error "Passwords do not match. Try again."
    fi
  done
}


