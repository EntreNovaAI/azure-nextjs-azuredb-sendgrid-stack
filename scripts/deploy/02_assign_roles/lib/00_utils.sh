#!/usr/bin/env bash
#
# Utility Functions Library
#
# Purpose:
#   Common utility functions for printing and user interaction
#   Used across all role assignment scripts
#
# Functions:
#   - print_header()  : Print section headers
#   - print_info()    : Print informational messages
#   - print_success() : Print success messages
#   - print_error()   : Print error messages
#   - print_warning() : Print warning messages
#   - confirm()       : Ask user for confirmation (Y/n prompt)
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
# Confirmation Function
# ============================================================================

# Ask user for confirmation
# Defaults to YES - user must explicitly type 'n' or 'no' to decline
# Returns 0 for yes, 1 for no
# If AUTO_YES is set to true, always returns 0 (yes)
#
# Usage:
#   if confirm "Continue with deployment?"; then
#     echo "User confirmed"
#   else
#     echo "User declined"
#   fi
confirm() {
  # Check if AUTO_YES is set (should be set by calling script)
  if [ "${AUTO_YES:-false}" = true ]; then
    return 0
  fi
  
  local prompt="$1"
  local response
  printf "%s [Y/n]: " "$prompt"
  read -r response || true  # Prevent read from causing script exit
  
  case "$response" in
    [nN]|[nN][oO])
      # User explicitly declined
      return 1
      ;;
    *)
      # Empty or any other input = yes (default)
      return 0
      ;;
  esac
}

