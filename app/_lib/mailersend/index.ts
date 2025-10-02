// Re-export all types and schemas for backward compatibility
export * from './schemas';

// Import and re-export the service
export { EmailService } from './email-service';

// Import types and service for use in this file
import type { EmailConfig, EmailRecipient, WelcomeEmailData, PasswordResetEmailData } from './schemas';
import { EmailService } from './email-service';

// Create and export a singleton instance
export const emailService = new EmailService();

// Export individual functions for convenience
export const sendEmail = (config: EmailConfig) => emailService.sendEmail(config);
export const sendWelcomeEmail = (to: EmailRecipient, data: WelcomeEmailData) => 
  emailService.sendWelcomeEmail(to, data);
export const sendPasswordResetEmail = (to: EmailRecipient, data: PasswordResetEmailData) => 
  emailService.sendPasswordResetEmail(to, data);