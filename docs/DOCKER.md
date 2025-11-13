# Docker Setup Documentation

Modern Docker configuration for Azure Next.js Stack with production-ready optimizations.

## 📁 Files Overview

- **Dockerfile**: Multi-stage build with Alpine Linux for minimal image size
- **.dockerignore**: Excludes test files, docs, and dev dependencies from build
- **docker-compose.yml**: Production-ready orchestration with health checks
- **README.md**: This comprehensive setup guide

## ✅ Prerequisites

- Docker **v24.0+** (with BuildKit support)
- Docker Compose **v2.0+**
- `.env.production` file in project root with your configuration
- Node.js **v20** (matches Docker base image)

## 🔧 Modern Features Implemented

✓ **Multi-stage builds** - Minimal production image size
✓ **BuildKit optimizations** - Faster builds with intelligent caching
✓ **Standalone output** - Only necessary files included
✓ **Non-root user** - Enhanced security (runs as `nextjs` user)
✓ **Health checks** - Built-in container health monitoring
✓ **Test exclusion** - No test files in production image
✓ **Layer caching** - Dependencies cached separately from source


**Security Note**: Never commit `.env.production` to version control!

## 🚀 Quick Start

**Note**: Modern Docker uses `docker compose` (not `docker-compose`)

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

## 🔍 Troubleshooting

### TypeScript Build Errors

**Error**: `Cannot find module '@vitejs/plugin-react'` or test config errors
- **Cause**: Test files included in Docker build
- **Solution**: Already fixed! `.dockerignore` excludes test files and configs
- **Verify**: Check that `vitest.config.mts` and `tests/` are in `.dockerignore`

**Error**: `moduleResolution` issues
- **Cause**: Old TypeScript config
- **Solution**: Already fixed! `tsconfig.json` uses `"moduleResolution": "bundler"`

### Build fails with "Lockfile not found"
- Ensure `pnpm-lock.yaml`, `package-lock.json`, or `yarn.lock` exists in project root
- Check that lockfile isn't in `.dockerignore`

### Environment variables not working
- Verify `.env.production` exists in **project root** (not in docker folder)
- Check variable names match exactly (case-sensitive)
- Rebuild without cache: `docker compose build --no-cache`
- Ensure `.env.production` is NOT in `.dockerignore`

### Health check failing
- Wait 40 seconds (start_period) after container starts
- Check logs: `docker compose logs app`
- Test manually: `curl http://localhost:3000/api/health`
- Ensure port 3000 is not already in use

### Permission errors
- App runs as non-root user `nextjs` (UID 1001)
- File ownership is set automatically in Dockerfile
- On Linux, ensure Docker daemon can access project files

### Out of memory during build
- Increase Docker memory limit (Docker Desktop → Settings → Resources)
- Recommended minimum: 4GB RAM
- For large apps, consider 8GB+

### Container exits immediately
- Check logs: `docker compose logs app`
- Verify all required environment variables are set
- Test build locally: `npm run build`

### Port already in use
```bash
# Check what's using port 3000
lsof -i :3000  # macOS/Linux
netstat -ano | findstr :3000  # Windows

# Use different port
docker run -p 4000:3000 ...
```

## 📊 Image Optimization

Our Docker setup achieves minimal image size through:

- **Alpine Linux base** - Smallest Node.js image (~40MB base)
- **Multi-stage builds** - Build artifacts not included in final image
- **Standalone output** - Next.js tree-shaking removes unused dependencies
- **Layer caching** - node_modules cached separately from source
- **Excluded files** - Tests, docs, and dev tools removed via `.dockerignore`

Expected image sizes:

- **Development build**: ~1.5GB (with all dependencies)
- **Production build**: ~200-300MB (optimized standalone)

```bash
# Check your image size
docker images azure-nextjs-app:latest

# Analyze image layers
docker history azure-nextjs-app:latest
```

## 🎯 Next Steps

After successful deployment:

1. **Verify the app**: http://localhost:3000
2. **Check health**: http://localhost:3000/api/health
3. **Monitor logs**: `docker compose logs -f`
4. **Test integrations**:
   - Stripe checkout
   - Email sending (MailerSend)
   - Database connectivity (Azure SQL)
   - Authentication flows

## 📚 Additional Resources

- [Next.js Docker Documentation](https://nextjs.org/docs/deployment#docker-image)
- [Docker Best Practices](https://docs.docker.com/develop/dev-best-practices/)
- [Next.js Standalone Output](https://nextjs.org/docs/advanced-features/output-file-tracing)
- [Docker BuildKit](https://docs.docker.com/build/buildkit/)

## 🐛 Still Having Issues?

If you encounter problems not covered here:
1. Check Docker daemon is running
2. Verify Docker version is up to date
3. Review container logs carefully
4. Test the build locally without Docker first
5. Open an issue with error logs and environment details

