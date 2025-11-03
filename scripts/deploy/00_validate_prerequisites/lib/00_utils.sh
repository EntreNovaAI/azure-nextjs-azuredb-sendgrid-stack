#!/usr/bin/env bash
#
# Utility Functions Library
#
# Purpose:
#   Common utility functions for printing and result tracking
#   Used across all validation scripts
#
# Functions:
#   - print_header()  : Print section headers
#   - print_info()    : Print informational messages
#   - print_success() : Print success messages
#   - print_error()   : Print error messages
#   - print_warning() : Print warning messages
#
# Global Variables (shared across all validation modules):
#   - VALIDATION_ERRORS   : Counter for critical errors
#   - VALIDATION_WARNINGS : Counter for warnings
#   - JSON_OUTPUT         : Whether to output in JSON format
#

# ============================================================================
# Initialize Global Tracking Variables
# ============================================================================

# These variables track validation results across all modules
VALIDATION_ERRORS=0
VALIDATION_WARNINGS=0

# ============================================================================
# Print Functions
# ============================================================================

# Print colored section header
# Only prints if JSON_OUTPUT is false
print_header() {
  if [ "${JSON_OUTPUT:-false}" = false ]; then
    printf "\n"
    printf "============================================================\n"
    printf " %s\n" "$1"
    printf "============================================================\n"
    printf "\n"
  fi
}

# Print informational message with icon
print_info() {
  if [ "${JSON_OUTPUT:-false}" = false ]; then
    printf "ℹ️  %s\n" "$1"
  fi
}

# Print success message with icon
print_success() {
  if [ "${JSON_OUTPUT:-false}" = false ]; then
    printf "✅ %s\n" "$1"
  fi
}

# Print error message with icon (sent to stderr)
print_error() {
  if [ "${JSON_OUTPUT:-false}" = false ]; then
    printf "❌ %s\n" "$1" >&2
  fi
}

# Print warning message with icon
print_warning() {
  if [ "${JSON_OUTPUT:-false}" = false ]; then
    printf "⚠️  %s\n" "$1"
  fi
}


