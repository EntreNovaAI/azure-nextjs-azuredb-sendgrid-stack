#!/usr/bin/env bash
#
# Post-Deployment Summary Display Library
#
# Purpose:
#   Display post-deployment summary and next steps
#   - Show deployed resources
#   - Provide clear next steps for Phase 2
#   - Explain two-phase deployment strategy
#
# Uses variables from calling script:
#   - SQL_SERVER_FQDN
#   - SQL_DATABASE_NAME
#   - ACR_LOGIN_SERVER
#   - KEY_VAULT_NAME
#   - ENV_FILE
#

# ============================================================================
# Post-Deployment Summary Function
# ============================================================================

# Display post-deployment summary with next steps
show_post_deployment_summary() {
  print_header "Phase 1 Deployment Complete!"
  
  # ========================================================================
  # Deployed Resources Summary
  # ========================================================================
  
  printf "📦 Foundation Resources Deployed:\n\n"
  printf "  SQL Server:      %s\n" "$SQL_SERVER_FQDN"
  printf "  Database:        %s (with tables created)\n" "$SQL_DATABASE_NAME"
  printf "  ACR:             %s\n" "$ACR_LOGIN_SERVER"
  printf "  Key Vault:       %s\n" "$KEY_VAULT_NAME"
  printf "  Container Env:   Ready (Container App will be deployed in Phase 2)\n"
  printf "\n"
  
  # ========================================================================
  # Next Steps
  # ========================================================================
  
  printf "📝 Next Steps (Two-Phase Deployment):\n\n"
  printf "  ✓ PHASE 1 COMPLETE - Foundation Deployed\n"
  printf "  -----------------------------------------\n\n"
  printf "  NEXT: Prepare for Phase 2\n"
  printf "  -------------------------\n"
  printf "  1. Review %s\n" "$ENV_FILE"
  printf "  2. Assign RBAC roles (REQUIRED for Container App to pull images):\n"
  printf "     bash scripts/deploy/02_assign_roles/02_assign_roles.sh\n\n"
  printf "  3. Configure Stripe (BEFORE building Docker image):\n"
  printf "     bash scripts/deploy/03_configure_stripe.sh\n\n"
  printf "  4. Build and push Docker image to ACR:\n"
  printf "     bash scripts/deploy/04_build_and_push_image.sh\n\n"
  printf "  PHASE 2 - Deploy Container App\n"
  printf "  -------------------------------\n"
  printf "  5. Deploy Container App (now that image exists):\n"
  printf "     bash scripts/deploy/05_deploy_container_app.sh\n\n"
  printf "  6. Bind secrets to Container App:\n"
  printf "     bash scripts/deploy/06_bind_secrets.sh\n"
  printf "\n"
  
  # ========================================================================
  # Important Warnings
  # ========================================================================
  
  printf "⚠️  IMPORTANT:\n"
  printf "   • Complete RBAC assignment (step 2) BEFORE building image\n"
  printf "   • Configure Stripe (step 3) BEFORE building Docker image\n"
  printf "   • Container App cannot be deployed until image exists in ACR\n"
  printf "\n"
  
  # ========================================================================
  # Why Two Phases?
  # ========================================================================
  
  printf "💡 Why Two Phases?\n"
  printf "   Phase 1 creates infrastructure without requiring a Docker image\n"
  printf "   Phase 2 deploys the Container App once the image is ready\n"
  printf "   This solves the 'chicken and egg' problem!\n"
  printf "\n"
  
  print_success "Foundation infrastructure deployed! 🚀"
  print_info "Continue with step 2 above (assign RBAC roles)"
}


