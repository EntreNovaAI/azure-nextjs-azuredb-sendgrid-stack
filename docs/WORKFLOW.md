# Development Workflow

> **Quick Reference**: From setup to production in two phases

## 📊 Process Overview

### Phase 1: Local Development

| Step | Task | Details |
|------|------|---------|
| 1 | **Check Prerequisites** | Node.js, pnpm, Docker, Azure CLI |
| 2️ | **Database Setup** | Azure SQL Server + Run migrations |
| 3️ | **Configure Services** | Stripe (test), Google OAuth, MailerSend |
| 4️ | **Customize Theme** | Update colors and fonts |
| 5️ | **Vibe Code** | Build features, iterate fast |
| 6️ | **Test Locally** | Dev server + tunnel for webhooks |

### Phase 2: Deployment

| Step | Task | Details |
|------|------|---------|
| 1 | **Deploy Infrastructure** | Auto-creates resources & runs migrations |
| 2 | **Configure Production** | Stripe live mode + webhooks |
| 3 | **Build & Push** | Docker image to Azure ACR |
| 4 | **Bind Secrets** | Store in Azure Key Vault |
| 5 | **Verify & Launch** | Test production & go live! 🚀 |

---

## 🚀 Getting Started

### Step 1: Review Development Principles

Before diving in, it may be helpful to understand the approach we are going for:

📖 **[Read DEVELOPMENT_PRINCIPLES.md](DEVELOPMENT_PRINCIPLES.MD)**

Learn about:

- Code organization and structure
- Best practices we follow
- Architecture decisions

---

### Step 2: Set Up Local Development

Ready to code? Follow the local setup guide:

📖 **[Follow LOCAL_DEVELOPMENT.md](LOCAL_DEVELOPMENT.MD)**

This covers:

- Installing prerequisites
- Setting up Azure SQL Database in SSMS
- Configuring Stripe test mode
- Setting up Google OAuth
- Customizing colors and fonts
- Running the development server
- Vibe coding workflow

---

## 🌐 Deployment to Azure

Once your app is ready, deploy to production:


### Detailed Deployment Guide

For step-by-step instructions with explanations:

📖 **[Follow DEPLOYMENT.md](DEPLOYMENT.md)**

---

## 📚 Additional Documentation

### Infrastructure
- **[INFRASTRUCTURE.md](INFRASTRUCTURE.md)** - Bicep templates and Azure resources
- **[DOCKER.md](DOCKER.md)** - Docker setup and containerization
- **[DB.md](DB.MD)** - Database schema and migrations

### Project Info
- **[README.md](../README.md)** - Project overview and features

---

## 🎯 Quick Tips

**For Local Development:**
- Use test mode for all services (Stripe, etc.)
- Keep `.env.local` secure (never commit)

**For Deployment:**
- Run validation script first
- All secrets stored in Azure Key Vault

---

**Ready to start?** → [Review Development Principles](DEVELOPMENT_PRINCIPLES.MD) → [Begin Local Development](LOCAL_DEVELOPMENT.MD)

