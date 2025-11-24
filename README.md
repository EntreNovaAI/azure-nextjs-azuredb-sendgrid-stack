# Azure NextAuth Stack

🚀 **A production-ready starter template** for modern web applications with Azure cloud services.

## 🚀 Quick Start

### 1. Clone the Repository

```bash
git clone <your-repo-url>
```

### 2. Follow the Workflow

For complete setup and development workflow, follow the step-by-step guide:

📋 **[See WORKFLOW.md](docs/WORKFLOW.md)** for detailed instructions on:

- Initial setup and configuration
- Local development environment
- Database setup and migrations
- Testing and deployment

## 📦 Technology Stack

### Frontend & Framework

- **Next.js 16.0.1** - React framework with App Router
- **React 19.2.0** - UI library with latest features
- **TypeScript 5.9.3** - Type-safe development
- **Tailwind CSS 4.1.17** - Utility-first CSS framework
- **Radix UI** - Accessible component primitives
- **Lucide React** - Beautiful icon library

### Backend & Database

- **NextAuth.js 4.24.13** - Authentication framework
- **Kysely 0.28.8** - Type-safe SQL query builder
- **Tedious 19.1.3** - Azure SQL Database driver
- **Tarn 3.0.2** - Connection pooling

### Integrations

- **Stripe 20.0.0** - Payment processing
- **MailerSend 2.6.0** - Transactional emails
- **Zod 4.1.13** - Schema validation
- **Axios 1.13.2** - HTTP client

### Azure SDKs

- **@azure/identity 4.13.0** - Azure authentication
- **@azure/storage-blob 12.29.1** - Blob storage
- **@azure/web-pubsub 1.2.0** - Real-time messaging
- **@azure/app-configuration 1.10.0** - Configuration management

### Testing

- **Vitest 4.0.13** - Unit and integration testing
- **Playwright** - End-to-end testing
- **@testing-library/react 16.3.0** - React component testing
- **@vitest/coverage-v8** - Code coverage reporting

### Development Tools

- **pnpm** - Fast, disk space efficient package manager
- **Docker** - Containerization
- **Azure CLI** - Infrastructure management
- **Bicep** - Infrastructure as Code

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

See [DEPLOYMENT.md](docs/DEPLOYMENT.md) for detailed deployment instructions and workflow.

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
2. **Security**: Key Vault integration for secret management
3. **Monitoring**: Application Insights for telemetry and logging
4. **Container hosting**: Azure Container Apps with auto-scaling

### Deployment Workflow

See [DEPLOYMENT.md](docs/DEPLOYMENT.md) for detailed deployment instructions.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🆘 Support

### Documentation Resources

- **Start here**: [WORKFLOW.md](docs/WORKFLOW.md) - Complete setup workflow
- **All guides**: See the [Documentation](#-documentation) section above for specific topics
- **Deployment help**: [DEPLOYMENT.md](docs/DEPLOYMENT.md) -  deployment guide

### Additional Help

- Review [Azure documentation](https://docs.microsoft.com/azure/) for service-specific questions
- Open an issue for bugs or feature requests

---

**Ready to build something amazing?** 🎉
