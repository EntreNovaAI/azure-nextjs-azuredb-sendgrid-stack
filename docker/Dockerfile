# syntax=docker.io/docker/dockerfile:1

# Use Node.js 20 Alpine for smallest image size
FROM node:20-alpine AS base

# Install dependencies only when needed
FROM base AS deps
# libc6-compat is needed for some Node.js native dependencies on Alpine
RUN apk add --no-cache libc6-compat
WORKDIR /app

# Copy dependency files
COPY package.json yarn.lock* package-lock.json* pnpm-lock.yaml* .npmrc* ./

# Install dependencies based on the package manager detected
# Use frozen lockfile to ensure reproducible builds
RUN \
  if [ -f yarn.lock ]; then \
    yarn --frozen-lockfile; \
  elif [ -f package-lock.json ]; then \
    npm ci; \
  elif [ -f pnpm-lock.yaml ]; then \
    corepack enable pnpm && pnpm i --frozen-lockfile; \
  else \
    echo "Lockfile not found." && exit 1; \
  fi


# Build stage - compile the application
FROM base AS builder
WORKDIR /app

# Copy installed dependencies from deps stage
COPY --from=deps /app/node_modules ./node_modules

# Copy only the application source files (test files excluded via .dockerignore)
COPY . .

# Disable Next.js telemetry during build for faster builds
ENV NEXT_TELEMETRY_DISABLED=1

# Set production environment for optimal build
ENV NODE_ENV=production

# Build the Next.js application
# This creates the .next/standalone folder with minimal dependencies
RUN \
  if [ -f yarn.lock ]; then \
    yarn run build; \
  elif [ -f package-lock.json ]; then \
    npm run build; \
  elif [ -f pnpm-lock.yaml ]; then \
    corepack enable pnpm && pnpm run build; \
  else \
    echo "Lockfile not found." && exit 1; \
  fi

# Production image - minimal runtime with only necessary files
FROM base AS runner
WORKDIR /app

# Set production environment variables
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

# Create non-root user and group for security best practices
# Running as non-root reduces security risks
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

# Copy public assets from builder
COPY --from=builder /app/public ./public

# Copy standalone build output with minimal dependencies
# Next.js standalone output includes only necessary files
# https://nextjs.org/docs/advanced-features/output-file-tracing
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

# Switch to non-root user for enhanced security
USER nextjs

# Expose the application port
EXPOSE 3000

# Health check to ensure container is healthy
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000/api/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})" || exit 1

# Run the standalone Next.js server
# server.js is created by next build from the standalone output
CMD ["node", "server.js"]

