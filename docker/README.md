# Docker Setup Documentation

This folder contains all Docker-related assets for the Azure Next.js Stack application.

## Files Overview

- **Dockerfile**: Multi-stage build configuration for creating optimized production images
- **.dockerignore**: Specifies which files to exclude from the Docker build context
- **docker-compose.yml**: Orchestrates the build and deployment with environment variables

## Prerequisites

- Docker installed (version 20.10 or higher)
- Docker Compose installed (version 2.0 or higher)
- `.env.production` file with your API keys and configuration

## Environment Variables Setup

1. Create a `.env.production` file in the project root
2. Add your API keys and configuration:

```env
# Azure Configuration
AZURE_SQL_SERVER=your-server.database.windows.net
AZURE_SQL_DATABASE=your-database
AZURE_SQL_USER=your-username
AZURE_SQL_PASSWORD=your-password

# SendGrid Configuration
SENDGRID_API_KEY=your-sendgrid-key
SENDGRID_FROM_EMAIL=your-email@domain.com

# Stripe Configuration
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_xxx
STRIPE_SECRET_KEY=sk_live_xxx
STRIPE_WEBHOOK_SECRET=whsec_xxx

# Application Configuration
NEXT_PUBLIC_APP_URL=https://your-domain.com
NEXTAUTH_SECRET=your-nextauth-secret
NEXTAUTH_URL=https://your-domain.com
```

## Build and Run Commands

### Using Docker Compose (Recommended)

**Note**: Run these commands from the `docker` folder or use `-f` flag to specify the compose file path.

```bash
# Option 1: Run from docker folder
cd docker
docker-compose up --build

# Option 2: Run from project root with -f flag
docker-compose -f docker/docker-compose.yml up --build

# Run in detached mode (background)
docker-compose up -d --build

# Stop the application
docker-compose down

# View logs
docker-compose logs -f

# Rebuild without cache
docker-compose build --no-cache
```

### Using Docker CLI (Manual)

**Note**: Run these commands from the project root.

```bash
# Build the image (from project root)
docker build -f docker/Dockerfile -t azure-nextjs-app .

# Run the container
docker run -p 3000:3000 --env-file .env.production azure-nextjs-app

# Run in detached mode
docker run -d -p 3000:3000 --env-file .env.production --name azure-nextjs-app azure-nextjs-app

# Stop and remove the container
docker stop azure-nextjs-app && docker rm azure-nextjs-app
```

## How Environment Variables Work

### Build Time
- `.env.production` is copied into the builder stage
- Next.js inlines public environment variables (NEXT_PUBLIC_*) during build
- This ensures optimal performance for client-side code

### Runtime
- Docker Compose loads `.env.production` via `env_file`
- Variables are available to the Node.js server
- Server-side API routes can access all environment variables

## Security Notes

⚠️ **Important Security Considerations:**

1. **Never commit `.env.production`** to version control
2. Add `.env.production` to `.gitignore`
3. Use secrets management in production (Azure Key Vault, Docker Secrets)
4. The container runs as non-root user `nextjs` for security
5. Environment variables in the image are visible via `docker inspect`

## Production Deployment

For production environments, consider:

1. **Use Docker Secrets** instead of env files
2. **Enable health checks** in your orchestrator
3. **Set resource limits** (CPU, memory)
4. **Use multi-replica deployment** for high availability
5. **Implement proper logging** and monitoring

## Troubleshooting

### Build fails with "Lockfile not found"
Ensure package-lock.json or yarn.lock exists in your project root.

### Environment variables not working
- Verify `.env.production` exists in project root
- Check variable names match exactly
- Rebuild the image from docker folder: `cd docker && docker-compose build --no-cache`

### Permission errors
The app runs as user `nextjs` (UID 1001). Ensure file permissions are correct.

### Out of memory during build
Increase Docker memory limit in Docker Desktop settings.

## Next Steps

After successful deployment:
1. Access the app at http://localhost:3000
2. Check health endpoint at http://localhost:3000/api/health
3. Monitor logs with `docker-compose logs -f`
4. Test all API integrations (Stripe, SendGrid, Azure DB)

