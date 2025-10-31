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

# Exit if any command fails
set -e

# Change to project root directory
# This ensures we can find next.config.js
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
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
  # We'll try 10 times, waiting 2 seconds between tries
  for i in {1..10}; do
    PUBLIC_URL=$(grep -o 'https://[^[:space:]]*\.devtunnels\.ms' "$TUNNEL_LOG" | head -n1 || echo "")
    
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
echo "   Local:  http://localhost:3000"
echo "   Public: $PUBLIC_URL"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "Press Ctrl+C to stop everything"
echo ""

# Start the development server
pnpm run dev
