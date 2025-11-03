// Re-export all types and schemas for backward compatibility
export * from './schemas';

// Import and re-export the service
export { EmailService } from './email-service';

// Import types and service for use in this file
import type { EmailConfig, EmailRecipient, WelcomeEmailData, PasswordResetEmailData } from './schemas';
import { EmailService } from './email-service';

/**
 * IMPORTANT: Lazy initialization prevents build-time errors
 * In production (Azure Container Apps), secrets are injected at runtime from Key Vault
 * During Docker build, these env vars won't exist yet, so we defer initialization
 */

// Singleton instance holder (lazy initialization)
let emailServiceInstance: EmailService | null = null;

/**
 * Get the EmailService singleton instance (lazy initialization)
 * This prevents errors during Docker build when secrets aren't available yet
 */
function getEmailService(): EmailService {
  if (!emailServiceInstance) {
    emailServiceInstance = new EmailService();
  }
  return emailServiceInstance;
}

// Export lazy-initialized singleton instance
export const emailService = {
  get instance() {
    return getEmailService();
  }
};

// Export individual functions for convenience (with lazy initialization)
export const sendEmail = (config: EmailConfig) => getEmailService().sendEmail(config);
export const sendWelcomeEmail = (to: EmailRecipient, data: WelcomeEmailData) => 
  getEmailService().sendWelcomeEmail(to, data);
export const sendPasswordResetEmail = (to: EmailRecipient, data: PasswordResetEmailData) => 
  getEmailService().sendPasswordResetEmail(to, data);