# Azure NextAuth Stack

🚀 **A production-ready starter template** for modern web applications with Azure cloud services.

## 🌟 Features

This template provides a complete, scalable foundation with:

### Core Stack
- **Next.js 16** with App Router
- **React 19** for modern UI development
- **NextAuth.js v4** for authentication (Google OAuth + Credentials)
- **TypeScript** for type safety
- **Kysely 0.28** query builder with Azure SQL Database
- **Tailwind CSS v4** with Radix UI components

### Azure Services
- **Azure Container Apps** - Serverless container hosting
- **Azure SQL Database** - Managed database
- **Azure Key Vault** - Secure secret management
- **Azure Blob Storage** - File storage
- **Azure OpenAI** - AI capabilities
- **Azure Web PubSub** - Real-time communication
- **Application Insights** - Monitoring and telemetry

### Integrations & Tools
- **Stripe** payments integration with webhooks
- **MailerSend** email service for transactional emails
- **GitHub Actions** CI/CD pipeline
- **Docker** containerization
- **Vitest** for unit and integration testing
- **Playwright** for end-to-end testing

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
- Stripe keys (test mode): `STRIPE_SECRET_KEY`, `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`, `STRIPE_WEBHOOK_SECRET`
- MailerSend API credentials: `MAILERSEND_API_KEY`, `MAILERSEND_FROM_EMAIL`, `MAILERSEND_FROM_NAME`
- AI provider settings (optional)

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

## 📦 Technology Stack

### Frontend & Framework
- **Next.js 16.0.1** - React framework with App Router
- **React 19.2.0** - UI library with latest features
- **TypeScript 5.9.3** - Type-safe development
- **Tailwind CSS 4.1.16** - Utility-first CSS framework
- **Radix UI** - Accessible component primitives
- **Lucide React** - Beautiful icon library

### Backend & Database
- **NextAuth.js 4.24.13** - Authentication framework
- **Kysely 0.28.8** - Type-safe SQL query builder
- **Tedious 18.6.1** - Azure SQL Database driver
- **Tarn 3.0.2** - Connection pooling

### Integrations
- **Stripe 19.1.0** - Payment processing
- **MailerSend 2.6.0** - Transactional emails
- **Zod 4.1.12** - Schema validation
- **Axios 1.13.1** - HTTP client

### Azure SDKs
- **@azure/identity 4.13.0** - Azure authentication
- **@azure/storage-blob 12.29.1** - Blob storage
- **@azure/web-pubsub 1.2.0** - Real-time messaging
- **@azure/app-configuration 1.9.0** - Configuration management

### Testing
- **Vitest 4.0.5** - Unit and integration testing
- **Playwright** - End-to-end testing
- **@testing-library/react 16.3.0** - React component testing
- **@vitest/coverage-v8** - Code coverage reporting

### Development Tools
- **pnpm** - Fast, disk space efficient package manager
- **Docker** - Containerization
- **Azure CLI** - Infrastructure management
- **Bicep** - Infrastructure as Code

## 📖 Documentation

For detailed setup and deployment instructions, see [`docs/setup_guide.md`](docs/setup_guide.md).

## 🏗️ Project Structure

```
├── app/                          # Next.js App Router
│   ├── (marketing)/             # Landing pages
│   ├── (product)/               # Dashboard and product features
│   ├── (legal)/                 # Terms, privacy, contact pages
│   ├── api/                     # API routes
│   │   ├── auth/               # NextAuth configuration
│   │   ├── stripe/             # Stripe webhooks
│   │   └── health/             # Health check endpoint
│   ├── auth/                    # Auth pages (signup, login, reset)
│   ├── checkout/                # Stripe checkout flow
│   └── profile/                 # User profile pages
├── src/                          # Source code
│   ├── components/              # Reusable UI components
│   │   ├── ui/                 # Radix UI components
│   │   ├── auth/               # Authentication components
│   │   ├── navigation/         # Navigation components
│   │   └── shared/             # Shared utility components
│   ├── lib/                     # Core libraries
│   │   ├── auth/               # Auth services and utilities
│   │   ├── kysely/             # Database client and types
│   │   ├── stripe/             # Stripe integration
│   │   ├── mailersend/         # Email service with Zod validation
│   │   ├── azure/              # Azure services (Storage, Web PubSub)
│   │   └── AI/                 # AI provider abstraction
│   ├── layouts/                 # Page layouts
│   ├── constants/               # App constants
│   ├── hooks/                   # Custom React hooks
│   └── types/                   # TypeScript type definitions
├── kysely/                       # Database migrations
├── infrastructure/               # Infrastructure as Code
│   └── bicep/                   # Azure Bicep templates and modules
├── scripts/                      # Development and deployment scripts
│   ├── dev/                     # Development scripts (Stripe, tunnels)
│   └── deploy/                  # Deployment scripts (Azure, secrets)
├── tests/                        # Test suites
│   ├── unit/                    # Unit tests (Vitest)
│   ├── integration/             # Integration tests
│   └── e2e/                     # End-to-end tests (Playwright)
└── docker/                       # Docker configuration
```

## 🔧 Available Scripts

### Development
- `pnpm dev` - Start development server on port 3000
- `pnpm build` - Build for production
- `pnpm start` - Start production server
- `pnpm lint` - Run Next.js linter

### Database
- `pnpm dlx tsx kysely/migration-script.ts` - Run database migrations
- `pnpm db:init` - Initialize database via API

### Testing
- `pnpm test` - Run tests in watch mode (Vitest)
- `pnpm test:watch` - Run tests with Vitest in watch mode
- `pnpm test:coverage` - Generate test coverage report
- `pnpm test:ci` - Run tests in CI mode
- `pnpm test:e2e` - Run end-to-end tests (Playwright)
- `pnpm test:e2e:ui` - Run e2e tests with UI
- `pnpm test:e2e:debug` - Debug e2e tests
- `pnpm test:integration` - Run integration tests only
- `pnpm test:components` - Run component tests only
- `pnpm test:all` - Run all tests (unit + e2e)
- `pnpm test:all:ci` - Run all tests in CI mode

## ✨ Key Features

### Authentication & Authorization
- **Multi-provider auth**: Google OAuth and email/password (credentials provider)
- **Password reset flow**: Secure token-based password reset with email notifications
- **Access levels**: Free, basic, premium tiers with feature gating
- **Session management**: JWT-based sessions with NextAuth v4

### Payments & Subscriptions
- **Stripe integration**: Complete checkout flow with webhooks
- **Subscription management**: Multiple product tiers (Basic, Premium)
- **Webhook handling**: Automated subscription updates and payment processing

### Email Service
- **MailerSend integration**: Transactional email service
- **Zod validation**: Type-safe email schemas with runtime validation
- **Pre-built templates**: Welcome emails, password reset emails
- **Developer-friendly**: Simple API with comprehensive error handling

### Database & ORM
- **Kysely query builder**: Type-safe SQL queries with TypeScript
- **Azure SQL Database**: Managed database with connection pooling
- **Migration system**: Version-controlled database schema migrations
- **Repository pattern**: Clean data access layer

### Testing Infrastructure
- **Unit tests**: Vitest with React Testing Library
- **Integration tests**: API and component integration testing
- **E2E tests**: Playwright for full user flow testing
- **Coverage reporting**: Built-in code coverage tools

## 🚀 Deployment

This template includes comprehensive deployment tooling for Azure:

### Automated Deployment Scripts
- **Development setup**: `scripts/dev/` - Stripe test mode setup and dev tunnels
- **Production deployment**: `scripts/deploy/` - Full Azure infrastructure deployment
  - Infrastructure provisioning with Bicep
  - Stripe production setup
  - Secrets management with Key Vault
  - Validation and cleanup utilities

### Infrastructure as Code
1. **Bicep templates**: Modular Azure resource definitions
2. **CI/CD**: GitHub Actions workflow for automated deployment
3. **Security**: Key Vault integration for secret management
4. **Monitoring**: Application Insights for telemetry and logging
5. **Container hosting**: Azure Container Apps with auto-scaling

### Deployment Workflow
```bash
# Development
bash scripts/dev/01_stripe_setup.sh
bash scripts/dev/dev_with_tunnel.sh

# Production
bash scripts/deploy/04_az_validate_setup.sh
bash scripts/deploy/01_az_deploy_infra.sh
bash scripts/deploy/02_stripe_production_setup.sh
bash scripts/deploy/03_az_bind_secrets.sh
```

See the [setup guide](docs/setup_guide.md) for detailed deployment instructions.

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
