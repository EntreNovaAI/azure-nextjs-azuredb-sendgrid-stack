# Azure Role Assignment Script

This directory contains the modular role assignment script for Azure Container App managed identity.

## Architecture

The script has been split into focused modules for better maintainability and readability:

```
02_assign_roles/
├── 02_assign_roles.sh       # Main orchestrator script
├── lib/                      # Library modules (numbered by execution order)
│   ├── 00_utils.sh          # Utility functions (printing, confirmation)
│   ├── 01_prerequisites.sh  # Prerequisites checking
│   ├── 02_config.sh         # Configuration loading from .env.production
│   ├── 03_subscription.sh   # Azure subscription management
│   ├── 04_resources.sh      # Resource information retrieval
│   ├── 05_permissions.sh    # User permissions checking
│   ├── 06_roles.sh          # RBAC role assignment
│   └── 07_verify.sh         # Role verification
└── README.md                # This file
```

## Usage

Run the main orchestrator script:

```bash
# Interactive mode (default)
bash scripts/deploy/02_assign_roles/02_assign_roles.sh

# Non-interactive mode (auto-confirm all prompts)
bash scripts/deploy/02_assign_roles/02_assign_roles.sh --yes

# Specify subscription
bash scripts/deploy/02_assign_roles/02_assign_roles.sh --subscription <subscription-id>

# Combined
bash scripts/deploy/02_assign_roles/02_assign_roles.sh --yes --subscription <subscription-id>
```

## Modules Overview

### Main Orchestrator (`02_assign_roles.sh`)

The main entry point that:
- Parses command line arguments
- Sources all library modules
- Executes steps in the correct order
- Displays final summary

### Library Modules

#### `lib/utils.sh`
Common utility functions used throughout:
- `print_header()` - Section headers
- `print_info()` - Info messages
- `print_success()` - Success messages
- `print_error()` - Error messages
- `print_warning()` - Warning messages
- `confirm()` - User confirmation prompts

#### `lib/prerequisites.sh`
Checks all prerequisites:
- Azure CLI installation
- Azure CLI login status
- .env.production file existence

#### `lib/config.sh`
Loads configuration from `.env.production`:
- ACR_NAME
- KEY_VAULT_NAME
- CONTAINER_APP_NAME

#### `lib/subscription.sh`
Handles Azure subscription selection:
- Uses current subscription by default
- Prompts user to confirm or switch
- Supports `--subscription` flag

#### `lib/resources.sh`
Retrieves Azure resource information:
- Resource group name
- Managed identity principal ID
- ACR resource ID (with leading slash removal)
- Key Vault resource ID (with leading slash removal)

Includes detailed error handling for common issues.
Automatically removes leading slashes from resource IDs to prevent MissingSubscription errors.

#### `lib/permissions.sh`
Checks user permissions:
- Verifies Owner or User Access Administrator role
- Provides helpful error messages
- Allows proceeding with manual confirmation

#### `lib/roles.sh`
Assigns RBAC roles:
- AcrPull role on Container Registry
- Key Vault Secrets User role on Key Vault

Uses best practices:
- Role definition IDs (not names)
- Principal type specification
- Minimal scope (resource level, not resource group)
- Timeout protection

#### `lib/verify.sh`
Verifies role assignments:
- Checks if roles are active
- Provides warnings if not found yet
- Notes propagation delay

## Role Definitions

The script assigns two critical roles:

1. **AcrPull** (`7f951dda-4ed3-4680-a7ca-43fe172d538d`)
   - Allows Container App to pull Docker images from ACR
   - Scoped to ACR resource only

2. **Key Vault Secrets User** (`4633458b-17de-408a-b874-0445c86b69e6`)
   - Allows Container App to read secrets from Key Vault
   - Scoped to Key Vault resource only

## Benefits of Modular Structure

1. **Maintainability**: Each module has a single, clear responsibility
2. **Readability**: Smaller files are easier to understand
3. **Reusability**: Library functions can be used by other scripts
4. **Testability**: Individual modules can be tested in isolation
5. **Documentation**: Each file has clear purpose and usage comments

## Prerequisites

- Azure CLI installed and logged in
- .env.production file created by `01_deploy_infrastructure.sh`
- Owner or User Access Administrator role on the resource group

## Troubleshooting

### MissingSubscription Error

If you encounter:
```
(MissingSubscription) The request did not have a subscription or a valid tenant level resource provider.
```

This error can occur when:
1. **Leading slash in scope**: Azure resource IDs with leading slashes cause this error
   - Fixed automatically by the script (removes leading `/` from resource IDs)
   - Azure expects: `subscriptions/...` NOT `/subscriptions/...`
2. **Authentication issue**: Run `az logout` then `az login`
3. **Wrong subscription**: Run `az account set --subscription <subscription-id>`
4. **Permissions**: Verify you have Owner or User Access Administrator role

The script now automatically removes leading slashes from resource IDs to prevent this error.

## Next Steps

After successful role assignment:
1. Wait 1-2 minutes for role propagation
2. Continue with: `bash scripts/deploy/03_configure_stripe.sh`

