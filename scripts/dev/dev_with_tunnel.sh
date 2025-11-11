#!/usr/bin/env bash
# 
# Dev Server with Public Tunnel
# 
# This script does the following:
# 1. Asks you to pick a tunnel service (Azure Dev Tunnels or ngrok)
# 2. Starts the tunnel on port 3000
# 3. Gets the public URL from the tunnel
# 4. Updates your next.config.js to allow the tunnel URL
# 5. Starts your Next.js dev server
# 
# When you press Ctrl+C, everything stops and cleans up automatically.
#
# Usage:
#   bash scripts/dev/dev_with_tunnel.sh         # Run without Stripe webhook setup
#   bash scripts/dev/dev_with_tunnel.sh -stripe # Run with Stripe webhook setup
#

# Exit if any command fails
set -e

# Parse command-line flags
ENABLE_STRIPE=false
while [[ $# -gt 0 ]]; do
  case $1 in
    -stripe|--stripe)
      ENABLE_STRIPE=true
      shift
      ;;
    -h|--help)
      echo "Usage: bash scripts/dev/dev_with_tunnel.sh [OPTIONS]"
      echo ""
      echo "Options:"
      echo "  -stripe, --stripe    Enable automatic Stripe webhook configuration"
      echo "  -h, --help          Show this help message"
      exit 0
      ;;
    *)
      echo "Unknown option: $1"
      echo "Use -h or --help for usage information"
      exit 1
      ;;
  esac
done

# Change to project root directory
# This ensures we can find next.config.js
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
cd "$PROJECT_ROOT"

echo ""
echo "📁 Working directory: $PROJECT_ROOT"
echo ""

# Ask user to pick a tunnel service
echo "🌐 Pick your tunnel service:"
echo ""
echo "   1) Azure Dev Tunnels"
echo "      (good for Azure projects)"
echo ""
echo "   2) ngrok"
echo "      (popular and easy to use)"
echo ""
read -p "Your choice (1 or 2): " TUNNEL_CHOICE
echo ""

# Variables to store tunnel info
TUNNEL_PID=""
TUNNEL_LOG=$(mktemp)
PUBLIC_URL=""

# Cleanup function
# This runs when the script exits (normal exit or Ctrl+C)
cleanup() {
  echo ""
  echo "🧹 Cleaning up..."
  
  # Optional: Delete the webhook we created
  # Uncomment the following lines if you want to auto-delete webhooks on exit
  if [ ! -z "$STRIPE_WEBHOOK_ID" ] && [ -f ".env.local" ]; then
    STRIPE_KEY=$(grep "^STRIPE_SECRET_KEY=" .env.local | cut -d'=' -f2)
    if [ ! -z "$STRIPE_KEY" ]; then
      echo "   Removing Stripe webhook..."
      curl -s -X DELETE "https://api.stripe.com/v1/webhook_endpoints/${STRIPE_WEBHOOK_ID}" \
        -u "${STRIPE_KEY}:" > /dev/null 2>&1 || true
    fi
  fi
  
  # Stop the tunnel process if it's running
  if [ ! -z "$TUNNEL_PID" ]; then
    kill $TUNNEL_PID 2>/dev/null || true
  fi
  
  # Remove temporary log file
  rm -f "$TUNNEL_LOG"
  
  echo "✅ Cleanup done"
}

# Register cleanup to run when script exits
trap cleanup EXIT INT TERM

# Start the tunnel based on user's choice
if [ "$TUNNEL_CHOICE" = "1" ]; then
  # Option 1: Azure Dev Tunnels
  echo "🚀 Starting Azure Dev Tunnels on port 3000..."
  
  # Start devtunnel in the background
  # Save output to a log file so we can read the URL
  devtunnel host -p 3000 --allow-anonymous > "$TUNNEL_LOG" 2>&1 &
  TUNNEL_PID=$!
  
  echo "⏳ Waiting for tunnel to start..."
  sleep 3
  
  # Try to get the URL from the log file
  # Azure Dev Tunnels outputs URLs with port numbers like: https://xxx.use.devtunnels.ms:3000
  # We'll try 10 times, waiting 2 seconds between tries
  for i in {1..10}; do
    # Try pattern with port number first (most common format)
    # Format: https://xxx.use.devtunnels.ms:3000 or https://xxx.global.devtunnels.ms:3000
    PUBLIC_URL=$(grep -oE 'https://[a-zA-Z0-9-]+\.(use|global)\.devtunnels\.ms:[0-9]+' "$TUNNEL_LOG" | head -n1 || echo "")
    
    # If still not found, try pattern without port (fallback)
    if [ -z "$PUBLIC_URL" ]; then
      PUBLIC_URL=$(grep -oE 'https://[a-zA-Z0-9-]+\.(use|global)\.devtunnels\.ms' "$TUNNEL_LOG" | head -n1 || echo "")
    fi
    
    # If still not found, try a broader pattern
    if [ -z "$PUBLIC_URL" ]; then
      PUBLIC_URL=$(grep -oE 'https://[^[:space:]]*devtunnels\.ms[^[:space:]]*' "$TUNNEL_LOG" | head -n1 || echo "")
    fi
    
    # If we found a URL, stop trying
    if [ ! -z "$PUBLIC_URL" ]; then
      break
    fi
    
    echo "   Trying again... ($i/10)"
    sleep 2
  done
  
  # Check if we got a URL
  if [ -z "$PUBLIC_URL" ]; then
    echo "❌ Could not get tunnel URL."
    echo ""
    echo "   Debug info - checking log file:"
    echo "   Last 20 lines of tunnel log:"
    tail -n 20 "$TUNNEL_LOG" | sed 's/^/   /'
    echo ""
    echo "   Make sure Azure Dev Tunnels is installed:"
    echo "   https://aka.ms/devtunnels/download"
    exit 1
  fi
  
elif [ "$TUNNEL_CHOICE" = "2" ]; then
  # Option 2: ngrok
  echo "🚀 Starting ngrok tunnel on port 3000..."
  
  # Start ngrok in the background
  # Save output to a log file
  ngrok http 3000 --log=stdout > "$TUNNEL_LOG" 2>&1 &
  TUNNEL_PID=$!
  
  echo "⏳ Waiting for tunnel to start..."
  sleep 3
  
  # Try to get the URL from ngrok's API
  # ngrok provides a local API at port 4040
  for i in {1..10}; do
    PUBLIC_URL=$(curl -s http://localhost:4040/api/tunnels | grep -o '"public_url":"https://[^"]*' | grep -o 'https://[^"]*' | head -n1 || echo "")
    
    # If we found a URL, stop trying
    if [ ! -z "$PUBLIC_URL" ]; then
      break
    fi
    
    echo "   Trying again... ($i/10)"
    sleep 2
  done
  
  # Check if we got a URL
  if [ -z "$PUBLIC_URL" ]; then
    echo "❌ Could not get ngrok URL."
    echo ""
    echo "   Make sure ngrok is installed and set up:"
    echo "   https://ngrok.com/download"
    exit 1
  fi
  
else
  # Invalid choice
  echo "❌ Invalid choice."
  echo "   Please run the script again and pick 1 or 2."
  exit 1
fi

# Remove 'https://' from the URL to get just the host
PUBLIC_HOST=$(echo "$PUBLIC_URL" | sed 's|https://||')

echo ""
echo "✅ Tunnel is running!"
echo "   Public URL: $PUBLIC_URL"
echo ""

# ============================================================================
# Update Stripe Webhook
# ============================================================================

update_stripe_webhook() {
  echo "🔗 Setting up Stripe webhook..."
  echo ""
  
  # Check if .env.local exists
  if [ ! -f ".env.local" ]; then
    echo "⚠️  .env.local not found"
    echo "   Skipping Stripe webhook setup"
    echo "   Run: bash scripts/dev/01_stripe_setup.sh first"
    echo ""
    return 0
  fi
  
  # Get Stripe secret key from .env.local
  STRIPE_KEY=$(grep "^STRIPE_SECRET_KEY=" .env.local | cut -d'=' -f2)
  
  if [ -z "$STRIPE_KEY" ]; then
    echo "⚠️  STRIPE_SECRET_KEY not found in .env.local"
    echo "   Skipping Stripe webhook setup"
    echo "   Run: bash scripts/dev/01_stripe_setup.sh first"
    echo ""
    return 0
  fi
  
  # Validate it's a test key
  if [[ ! "$STRIPE_KEY" =~ ^sk_test_ ]]; then
    echo "⚠️  Found production Stripe key in .env.local"
    echo "   For safety, only test keys (sk_test_...) are auto-configured"
    echo "   Skipping webhook setup"
    echo ""
    return 0
  fi
  
  # Construct webhook URL
  WEBHOOK_URL="${PUBLIC_URL}/api/stripe/webhooks"
  
  echo "   Webhook URL: $WEBHOOK_URL"
  echo ""
  
  # Fetch existing webhooks
  local webhooks_response
  webhooks_response=$(curl -s -X GET https://api.stripe.com/v1/webhook_endpoints \
    -u "${STRIPE_KEY}:")
  
  # Check if webhook already exists for this URL
  local existing_webhook_id=""
  if command -v jq >/dev/null 2>&1; then
    existing_webhook_id=$(echo "$webhooks_response" | jq -r ".data[] | select(.url==\"$WEBHOOK_URL\") | .id" | head -1)
  fi
  
  if [ -n "$existing_webhook_id" ] && [ "$existing_webhook_id" != "null" ]; then
    # Webhook already exists
    echo "   ℹ️  Webhook already exists (ID: $existing_webhook_id)"
    echo "   ✅ Using existing webhook"
    echo ""
    
    # Get the existing secret
    local webhook_secret
    if command -v jq >/dev/null 2>&1; then
      webhook_secret=$(echo "$webhooks_response" | jq -r ".data[] | select(.id==\"$existing_webhook_id\") | .secret" | head -1)
    fi
    
    # Update .env.local with the secret if we have it
    if [ -n "$webhook_secret" ] && [ "$webhook_secret" != "null" ]; then
      update_env_var "STRIPE_WEBHOOK_SECRET" "$webhook_secret"
      echo "   ✅ Webhook secret updated in .env.local"
      echo ""
    fi
    
    return 0
  fi
  
  # Create new webhook
  echo "   Creating new webhook endpoint..."
  
  local create_response
  create_response=$(curl -s -X POST https://api.stripe.com/v1/webhook_endpoints \
    -u "${STRIPE_KEY}:" \
    -d "url=${WEBHOOK_URL}" \
    -d "enabled_events[]=checkout.session.completed" \
    -d "enabled_events[]=customer.subscription.created" \
    -d "enabled_events[]=customer.subscription.updated" \
    -d "enabled_events[]=customer.subscription.deleted")
  
  # Extract webhook ID and secret
  local webhook_id
  local webhook_secret
  
  if command -v jq >/dev/null 2>&1; then
    webhook_id=$(echo "$create_response" | jq -r '.id')
    webhook_secret=$(echo "$create_response" | jq -r '.secret')
  else
    webhook_id=$(echo "$create_response" | grep -o '"id":"we_[^"]*"' | head -1 | cut -d'"' -f4)
    webhook_secret=$(echo "$create_response" | grep -o '"secret":"whsec_[^"]*"' | head -1 | cut -d'"' -f4)
  fi
  
  if [ -z "$webhook_id" ] || [ "$webhook_id" = "null" ]; then
    echo "   ❌ Failed to create webhook"
    echo "   Response: $create_response"
    echo ""
    echo "   You can manually set up the webhook at:"
    echo "   https://dashboard.stripe.com/test/webhooks"
    echo ""
    return 0
  fi
  
  echo "   ✅ Webhook created (ID: $webhook_id)"
  echo ""
  
  # Update .env.local with webhook secret
  update_env_var "STRIPE_WEBHOOK_SECRET" "$webhook_secret"
  echo "   ✅ Webhook secret saved to .env.local"
  echo ""
  
  # Store webhook ID for cleanup later
  export STRIPE_WEBHOOK_ID="$webhook_id"
}

# Helper function to update or add environment variable
update_env_var() {
  local key="$1"
  local value="$2"
  local env_file=".env.local"
  
  # Create temp file
  local temp_file
  temp_file=$(mktemp)
  
  if grep -q "^${key}=" "$env_file" 2>/dev/null; then
    # Update existing variable
    sed "s|^${key}=.*|${key}=${value}|" "$env_file" > "$temp_file"
    mv "$temp_file" "$env_file"
  elif grep -q "^#${key}=" "$env_file" 2>/dev/null; then
    # Uncomment and update
    sed "s|^#${key}=.*|${key}=${value}|" "$env_file" > "$temp_file"
    mv "$temp_file" "$env_file"
  else
    # Add new variable
    echo "" >> "$env_file"
    echo "# Stripe Webhook Secret (auto-generated)" >> "$env_file"
    echo "${key}=${value}" >> "$env_file"
  fi
}

# Run the webhook setup only if -stripe flag was provided
if [ "$ENABLE_STRIPE" = true ]; then
  update_stripe_webhook
fi

# Update next.config.js
echo "📝 Updating next.config.js..."

# Make a backup of the original file
# We'll restore this when the script exits
if [ -f "next.config.js" ]; then
  cp next.config.js next.config.js.backup
else
  echo "❌ Error: next.config.js not found in $PROJECT_ROOT"
  exit 1
fi

# Write the updated config file
# This adds the tunnel host to allowedDevOrigins
cat > next.config.js << EOF
/** @type {import('next').NextConfig} */
const isDev = process.env.NODE_ENV === 'development'

// Get the host from NEXTAUTH_URL
const devOriginHost = (() => {
  try {
    const url = process.env.NEXTAUTH_URL || 'http://localhost:3000'
    return new URL(url).host
  } catch {
    return 'localhost:3000'
  }
})()

const nextConfig = {
  output: 'standalone',
  
  // Allow both localhost and tunnel URLs in development
  // This lets Next.js accept requests from the tunnel
  allowedDevOrigins: isDev ? [devOriginHost, '$PUBLIC_HOST'] : [],
}

module.exports = nextConfig
EOF

echo "✅ Config updated"
echo ""

# Set environment variable for authentication
# This tells NextAuth to use the tunnel URL
export NEXTAUTH_URL="$PUBLIC_URL"

echo "🌐 Environment variables:"
echo "   NEXTAUTH_URL = $NEXTAUTH_URL"
echo ""

# Update cleanup to also restore the config file
trap 'cleanup; cp next.config.js.backup next.config.js 2>/dev/null && rm -f next.config.js.backup' EXIT INT TERM

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🚀 Starting Next.js dev server..."
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "   Local:    http://localhost:3000"
echo "   Public:   $PUBLIC_URL"
if [ ! -z "$STRIPE_WEBHOOK_ID" ]; then
  echo "   Webhook:  ${PUBLIC_URL}/api/stripe/webhooks"
fi
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
if [ "$ENABLE_STRIPE" = true ]; then
  echo "💡 Stripe webhooks are configured automatically"
  echo "   Test payments will trigger real webhook events"
else
  echo "💡 Stripe webhooks not configured"
  echo "   To enable: bash scripts/dev/dev_with_tunnel.sh -stripe"
fi
echo ""
echo "Press Ctrl+C to stop everything"
echo ""

# Start the development server
pnpm run dev
