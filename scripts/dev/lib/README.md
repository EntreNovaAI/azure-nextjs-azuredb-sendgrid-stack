# Installation Library Modules

This directory contains modular bash libraries for automated prerequisite installation and system setup.

## Purpose

These modules provide a clean, maintainable way to detect the operating system, check for required tools, and install missing prerequisites across different platforms (Linux, macOS, Windows/WSL).

## Module Overview

### Core Utilities

**`utils.sh`** - Common utility functions
- Colored output functions (print_header, print_success, print_error, etc.)
- Logging to `logs/init-setup.log`
- Interactive prompt functions with default [Y/n]
- Command existence checking

### System Detection

**`os_detect.sh`** - Operating system and package manager detection
- Detects OS: Linux, WSL, macOS, Windows (Git Bash)
- Detects package manager: apt, dnf, yum, brew, choco, winget
- Exports `OS_TYPE` and `PKG_MANAGER` variables

### Installation Modules

**`install_node_pnpm.sh`** - Node.js and pnpm installation
- Installs Node.js 20 LTS via NodeSource (Linux) or Homebrew (macOS)
- Installs pnpm via corepack (recommended) or npm fallback
- Interactive prompts with installation verification

**`install_azure.sh`** - Azure CLI and Bicep installation
- Installs Azure CLI using official Microsoft scripts
- Installs Bicep CLI via `az bicep install`
- Optional installation with skip capability

**`install_docker.sh`** - Docker installation
- Installs Docker Engine (Linux) or Docker Desktop (macOS)
- Verifies Docker daemon is running
- Provides manual installation guidance for Windows/WSL

**`install_tools.sh`** - Additional development tools
- jq (JSON processor)
- Git (version control)
- Stripe CLI (webhook testing)
- curl and openssl verification

## Usage

These modules are sourced by `scripts/dev/00_init_setup.sh`:

```bash
# Source utility functions first
source "$SCRIPT_DIR/lib/utils.sh"

# Initialize logging
init_log

# Source other modules
source "$SCRIPT_DIR/lib/os_detect.sh"
source "$SCRIPT_DIR/lib/install_node_pnpm.sh"
# ... etc
```

## Design Principles

1. **Modularity**: Each file handles a specific domain (~60-80 lines)
2. **Idempotency**: Safe to run multiple times
3. **Interactive**: All prompts default to [Y/n] for easy confirmation
4. **Cross-platform**: Supports Linux, WSL, macOS, Windows (Git Bash)
5. **Error handling**: Graceful failures with helpful error messages
6. **Logging**: All actions logged to `logs/init-setup.log`

## Platform Support

| Platform | Package Manager | Status |
|----------|----------------|---------|
| Ubuntu/Debian | apt | ✅ Fully supported |
| Red Hat/Fedora | dnf/yum | ✅ Fully supported |
| macOS | brew | ✅ Fully supported |
| Windows WSL | apt | ✅ Fully supported |
| Windows (Git Bash) | manual | ⚠️ Limited (manual links provided) |

## Installation Commands by Platform

### Node.js 20 LTS

- **Linux (Debian/Ubuntu)**: `curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash - && sudo apt-get install -y nodejs`
- **Linux (Red Hat/Fedora)**: `curl -fsSL https://rpm.nodesource.com/setup_20.x | sudo bash - && sudo dnf install -y nodejs`
- **macOS**: `brew install node@20`
- **Windows**: Manual download from nodejs.org

### pnpm

- **All platforms**: `corepack enable && corepack prepare pnpm@latest --activate`
- **Fallback**: `npm install -g pnpm`

### Azure CLI

- **Linux**: `curl -sL https://aka.ms/InstallAzureCLIDeb | sudo bash`
- **macOS**: `brew install azure-cli`
- **Windows**: Manual MSI from https://aka.ms/installazurecliwindows

### Bicep

- **All platforms** (requires Azure CLI): `az bicep install`

### Docker

- **Linux**: `curl -fsSL https://get.docker.com | sudo sh`
- **macOS**: `brew install --cask docker`
- **Windows/WSL**: Docker Desktop required

### jq

- **Linux**: `sudo apt-get install -y jq` or `sudo dnf install -y jq`
- **macOS**: `brew install jq`
- **Windows**: `choco install jq`

## Adding New Installation Modules

To add a new tool installation:

1. Create a new file in `scripts/dev/lib/` (e.g., `install_newtool.sh`)
2. Follow the existing module structure:
   - Installation function: `install_toolname()`
   - Check and install function: `check_install_toolname()`
   - Use OS detection variables: `$OS_TYPE` and `$PKG_MANAGER`
   - Log all actions with `log_message()`
   - Use consistent output functions from `utils.sh`
3. Source the module in `00_init_setup.sh`
4. Call `check_install_toolname()` in the appropriate section

## Best Practices

- Always check if tool exists before attempting installation
- Provide manual installation instructions for unsupported platforms
- Use `prompt_install_skip()` for optional tools
- Use `prompt_yes_no()` for required tools
- Log all installation attempts and results
- Verify installation succeeded after running commands
- Handle errors gracefully and continue when possible

## Troubleshooting

**Module sourcing errors:**
- Ensure you're running from project root
- Check file permissions: `chmod +x scripts/dev/lib/*.sh`

**Installation failures:**
- Check `logs/init-setup.log` for detailed error messages
- Verify internet connectivity
- Ensure sufficient permissions (some commands need sudo)

**Platform-specific issues:**
- Windows Git Bash: Some installations require manual steps
- WSL: Docker Desktop integration must be enabled
- macOS: Homebrew must be installed first

## Maintenance

When updating installation commands:
1. Verify commands work on all supported platforms
2. Update this README with new commands
3. Test the full installation flow
4. Update version numbers if specific versions are required

