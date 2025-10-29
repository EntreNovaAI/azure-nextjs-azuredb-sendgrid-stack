# Docker Setup Quick Reference

All Docker-related files are in the `docker/` folder.

## 📁 Docker Files Location

```
docker/
├── Dockerfile           # Multi-stage build configuration
├── docker-compose.yml   # Orchestration configuration
├── .dockerignore       # Files to exclude from build
└── README.md           # Complete Docker documentation
```

## 🚀 Quick Start

### Option 1: From docker folder (Recommended)
```bash
cd docker
docker-compose up --build
```

### Option 2: From project root
```bash
docker-compose -f docker/docker-compose.yml up --build
```

### Option 3: Using Docker CLI
```bash
docker build -f docker/Dockerfile -t azure-nextjs-app .
docker run -p 3000:3000 --env-file .env.production azure-nextjs-app
```

## 📋 Prerequisites

1. **Docker installed** (version 20.10+)
2. **Docker Compose installed** (version 2.0+)
3. **`.env.production` file** in project root with your API keys

## 📚 Full Documentation

For complete documentation, troubleshooting, and advanced configuration:
👉 **See `docker/README.md`**

## 🔧 Common Issues Fixed

✅ **Stripe API version** - Now uses account default (no more build breaks)  
✅ **pnpm + styled-jsx** - Configured properly in `.npmrc`  
✅ **File paths** - Correctly configured for docker folder structure  

## 🔗 Related Files

- `.npmrc` - pnpm configuration for proper dependency resolution
- `src/lib/stripe/stripe-client.ts` - Centralized Stripe configuration
- `package.json` - Includes `styled-jsx` for Next.js compatibility

