# Azure NextAuth Stack

🚀 **A production-ready starter template** for modern web applications with Azure cloud services.

## 🌟 Features

This template provides a complete, scalable foundation with:

### Core Stack
- **Next.js 15** with App Router
- **NextAuth.js v5** for authentication
- **TypeScript** for type safety
- **Kysely** query builder with Azure SQL Database
- **Tailwind CSS** (ready to add)

### Azure Services
- **Azure Container Apps** - Serverless container hosting
- **Azure SQL Database** - Managed database
- **Azure Key Vault** - Secure secret management
- **Azure Blob Storage** - File storage
- **Azure OpenAI** - AI capabilities
- **Azure Web PubSub** - Real-time communication
- **Application Insights** - Monitoring and telemetry

### Integrations
- **Stripe** payments integration
- **GitHub Actions** CI/CD pipeline
- **Docker** containerization

## 🚀 Quick Start

### Prerequisites
- Node.js 20+
- pnpm: `corepack enable && corepack prepare pnpm@latest --activate`
- Azure CLI: `az login`
- Docker (for deployment)

### 1. Clone and Setup
```bash
git clone <your-repo-url>
cd azure-next-auth-stack
cp .env.example .env.local
```

### 2. Configure Environment
**Edit `.env.local`** with:
- `NEXTAUTH_SECRET` (generate: `openssl rand -base64 32`)
- `MSSQL_SERVER`, `MSSQL_DATABASE`, `MSSQL_USER`, `MSSQL_PASSWORD`, `MSSQL_ENCRYPT` - Azure SQL Database connection
- `NEXTAUTH_URL` - Your devtunnel URL (see setup guide)
- `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` (from Google Cloud Console)
- Stripe keys (test mode)
- AI provider settings

**Note**: You'll need to set up Google OAuth and Azure Dev Tunnels for authentication to work. See the detailed [setup guide](docs/setup_guide.md).

### 3. Database Setup and Run
```bash
pnpm install
# Run Kysely migrations to set up database tables
pnpm dlx tsx kysely/migration-script.ts
pnpm dev
```

Visit [http://localhost:3000](http://localhost:3000)

**For authentication to work**: Follow the [setup guide](docs/setup_guide.md) to configure Google OAuth and Azure Dev Tunnels.

## 📖 Documentation

For detailed setup and deployment instructions, see [`docs/setup_guide.md`](docs/setup_guide.md).

## 🏗️ Project Structure

```
├── app/                    # Next.js App Router
│   ├── api/               # API routes
│   │   ├── auth/          # NextAuth configuration
│   │   └── webhooks/      # Stripe webhooks
├── docs/                  # Documentation
├── infra/                 # Infrastructure as Code
│   ├── bicep/            # Azure Bicep templates
│   └── github/           # GitHub Actions workflows
├── app/_lib/              # Shared utilities
│   ├── AI/ai.ts          # AI provider abstraction
│   ├── kysely/           # Kysely database client and types
│   ├── azure/storage.ts  # Azure Blob Storage
│   └── azure/webpubsub.ts # Real-time messaging
├── kysely/               # Database migrations
└── scripts/              # Deployment scripts
```

## 🔧 Available Scripts

- `pnpm dev` - Start development server
- `pnpm build` - Build for production
- `pnpm start` - Start production server
- `pnpm dlx tsx kysely/migration-script.ts` - Run database migrations

## 🚀 Deployment

This template includes everything needed for Azure deployment:

1. **Infrastructure**: Bicep templates for all Azure resources
2. **CI/CD**: GitHub Actions workflow for automated deployment
3. **Security**: Key Vault integration for secret management
4. **Monitoring**: Application Insights setup

See the [setup guide](docs/setup_guide.md) for step-by-step deployment instructions.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🆘 Support

- Check the [setup guide](docs/setup_guide.md) for common issues
- Review Azure documentation for service-specific questions
- Open an issue for bugs or feature requests

---

**Ready to build something amazing?** 🎉
