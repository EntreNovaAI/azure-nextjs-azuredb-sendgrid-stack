#!/usr/bin/env bash
#
# Utility Functions Library
#
# Purpose:
#   Common utility functions for shell scripts
#   Includes colored output, prompts, logging, and command checks
#

# ============================================================================
# Colors and Output Functions
# ============================================================================

# Print header with decorative borders
print_header() {
  printf "\n"
  printf "============================================================\n"
  printf " %s\n" "$1"
  printf "============================================================\n"
  printf "\n"
}

# Print informational message
print_info() {
  printf "ℹ️  %s\n" "$1"
}

# Print success message
print_success() {
  printf "✅ %s\n" "$1"
}

# Print error message
print_error() {
  printf "❌ %s\n" "$1" >&2
}

# Print warning message
print_warning() {
  printf "⚠️  %s\n" "$1"
}

# ============================================================================
# Logging Functions
# ============================================================================

# Initialize log file
init_log() {
  local log_dir="logs"
  local log_file="$log_dir/init-setup.log"
  
  # Create logs directory if it doesn't exist
  mkdir -p "$log_dir"
  
  # Add log header with timestamp
  {
    echo ""
    echo "============================================================"
    echo "Init Setup Started: $(date '+%Y-%m-%d %H:%M:%S')"
    echo "============================================================"
    echo ""
  } >> "$log_file"
  
  # Export log file path for use in other functions
  export INIT_LOG_FILE="$log_file"
}

# Log message to file (also prints to console)
log_message() {
  local message="$1"
  local timestamp
  timestamp=$(date '+%Y-%m-%d %H:%M:%S')
  
  # Log to file if log is initialized
  if [ -n "${INIT_LOG_FILE:-}" ]; then
    echo "[$timestamp] $message" >> "$INIT_LOG_FILE"
  fi
}

# ============================================================================
# Prompt Functions
# ============================================================================

# Prompt user with default Yes
# Usage: prompt_yes_no "Install Docker?"
# Returns: 0 for yes, 1 for no
prompt_yes_no() {
  local prompt="$1"
  local response
  
  printf "%s [Y/n]: " "$prompt"
  read -r response
  
  # Default to Yes if empty
  response=${response:-Y}
  
  case "$response" in
    [yY]|[yY][eE][sS])
      log_message "User confirmed: $prompt"
      return 0
      ;;
    *)
      log_message "User declined: $prompt"
      return 1
      ;;
  esac
}

# Prompt with skip option for optional tools
# Returns: 0 for yes, 1 for no/abort, 2 for skip
prompt_install_skip() {
  local prompt="$1"
  local response
  
  printf "%s [Y/n/skip]: " "$prompt"
  read -r response
  
  # Default to Yes if empty
  response=${response:-Y}
  
  case "$response" in
    [yY]|[yY][eE][sS])
      log_message "User confirmed: $prompt"
      return 0
      ;;
    [sS]|[sS][kK][iI][pP])
      log_message "User skipped: $prompt"
      return 2
      ;;
    *)
      log_message "User declined: $prompt"
      return 1
      ;;
  esac
}

# ============================================================================
# Command Checking Functions
# ============================================================================

# Check if a command exists
# Usage: command_exists "docker"
# Returns: 0 if exists, 1 if not
command_exists() {
  command -v "$1" >/dev/null 2>&1
}

# Check if command exists and print status
check_and_report() {
  local cmd="$1"
  local name="$2"
  
  if command_exists "$cmd"; then
    print_success "$name is installed"
    return 0
  else
    print_warning "$name is not installed"
    return 1
  fi
}

