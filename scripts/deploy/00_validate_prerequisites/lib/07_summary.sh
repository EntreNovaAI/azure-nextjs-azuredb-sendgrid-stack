#!/usr/bin/env bash
#
# Validation Summary Display Library
#
# Purpose:
#   Display final validation summary and exit with appropriate code
#   - Show error and warning counts
#   - Provide next steps
#   - Support JSON output format
#
# Uses global variables from 00_utils.sh:
#   - VALIDATION_ERRORS
#   - VALIDATION_WARNINGS
#   - JSON_OUTPUT
#
# Exit Codes:
#   0 - All checks passed
#   1 - Critical errors found
#   2 - Only warnings found (can continue)
#

# ============================================================================
# Summary Display Function
# ============================================================================

# Display validation summary and exit with appropriate code
show_summary() {
  if [ "$JSON_OUTPUT" = true ]; then
    # Output JSON format for parsing by other tools
    cat << EOF
{
  "status": "$([ "$VALIDATION_ERRORS" -eq 0 ] && echo "success" || echo "error")",
  "errors": $VALIDATION_ERRORS,
  "warnings": $VALIDATION_WARNINGS,
  "can_continue": $([ "$VALIDATION_ERRORS" -eq 0 ] && echo "true" || echo "false")
}
EOF
  else
    # Standard human-readable output
    print_header "Validation Summary"
    
    printf "Errors:   %d\n" "$VALIDATION_ERRORS"
    printf "Warnings: %d\n" "$VALIDATION_WARNINGS"
    printf "\n"
    
    if [ "$VALIDATION_ERRORS" -eq 0 ]; then
      # All critical checks passed
      print_success "All critical checks passed! ✨"
      printf "\n"
      print_info "You're ready to go! Next steps:"
      printf "  1. Development: bash scripts/dev/00_init_setup.sh\n"
      printf "  2. Production:  bash scripts/deploy/01_deploy_infrastructure.sh\n"
      printf "\n"
      
      if [ "$VALIDATION_WARNINGS" -gt 0 ]; then
        print_warning "You have $VALIDATION_WARNINGS warnings"
        print_info "Review warnings above and fix if necessary"
      fi
    else
      # Critical errors found
      print_error "Validation failed with $VALIDATION_ERRORS errors"
      print_info "Fix the errors above before proceeding"
      print_info "Run: bash scripts/dev/00_init_setup.sh to install missing tools"
    fi
  fi
  
  # Exit with appropriate code
  if [ "$VALIDATION_ERRORS" -eq 0 ]; then
    if [ "$VALIDATION_WARNINGS" -gt 0 ]; then
      exit 2  # Warnings only (can continue)
    else
      exit 0  # All good
    fi
  else
    exit 1  # Errors found
  fi
}


