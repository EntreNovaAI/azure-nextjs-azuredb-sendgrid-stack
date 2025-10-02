import { MailerSend, EmailParams, Sender, Recipient } from "mailersend";
import {
  EmailConfig,
  EmailRecipient,
  WelcomeEmailData,
  PasswordResetEmailData,
  EmailConfigSchema,
  EmailRecipientSchema,
  WelcomeEmailDataSchema,
  PasswordResetEmailDataSchema,
  EnvironmentConfigSchema
} from "./schemas";

/**
 * MailerSend service class for reusable email operations
 * Handles email sending with validation and error handling
 */
export class EmailService {
  private mailerSend: MailerSend;
  private defaultFrom: { email: string; name: string };

  constructor() {
    // Validate environment variables using Zod
    const envValidation = EnvironmentConfigSchema.safeParse({
      MAILERSEND_API_KEY: process.env.MAILERSEND_API_KEY,
      MAILERSEND_FROM_EMAIL: process.env.MAILERSEND_FROM_EMAIL,
      MAILERSEND_FROM_NAME: process.env.MAILERSEND_FROM_NAME
    });

    if (!envValidation.success) {
      const errors = envValidation.error.issues.map(err => `${err.path.join('.')}: ${err.message}`).join(', ');
      throw new Error(`Environment validation failed: ${errors}`);
    }

    const { MAILERSEND_API_KEY, MAILERSEND_FROM_EMAIL, MAILERSEND_FROM_NAME } = envValidation.data;

    // Initialize MailerSend with validated API key
    this.mailerSend = new MailerSend({ apiKey: MAILERSEND_API_KEY });
    
    // Set default sender from validated environment variables
    this.defaultFrom = {
      email: MAILERSEND_FROM_EMAIL || 'noreply@yourdomain.com',
      name: MAILERSEND_FROM_NAME || 'Your App Name'
    };
  }

  /**
   * Send a generic email with custom configuration
   * @param config - Email configuration object
   * @returns Promise with send result
   */
  async sendEmail(config: EmailConfig): Promise<any> {
    try {
      // Validate email configuration using Zod
      const validation = EmailConfigSchema.safeParse(config);
      if (!validation.success) {
        const errors = validation.error.issues.map(err => `${err.path.join('.')}: ${err.message}`).join(', ');
        throw new Error(`Email configuration validation failed: ${errors}`);
      }

      const validatedConfig = validation.data;

      // Create sender object
      const from = validatedConfig.from || this.defaultFrom;
      const sentFrom = new Sender(from.email, from.name || '');

      // Create recipients array
      const recipients = validatedConfig.to.map(
        recipient => new Recipient(recipient.email, recipient.name || '')
      );

      // Build email parameters
      const emailParams = new EmailParams()
        .setFrom(sentFrom)
        .setTo(recipients)
        .setSubject(validatedConfig.subject);

      // Set reply-to if provided
      if (validatedConfig.replyTo) {
        const replyTo = new Sender(validatedConfig.replyTo.email, validatedConfig.replyTo.name || '');
        emailParams.setReplyTo(replyTo);
      }

      // Set content (HTML takes priority over text)
      if (validatedConfig.html) {
        emailParams.setHtml(validatedConfig.html);
      }
      if (validatedConfig.text) {
        emailParams.setText(validatedConfig.text);
      }

      // Send the email
      const result = await this.mailerSend.email.send(emailParams);
      console.log('Email sent successfully:', result);
      return result;
    } catch (error) {
      console.error('Failed to send email:', error);
      throw new Error(`Email sending failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Send welcome email to new users
   * @param to - Recipient email and name
   * @param data - Welcome email data
   */
  async sendWelcomeEmail(
    to: EmailRecipient,
    data: WelcomeEmailData
  ): Promise<any> {
    // Validate recipient and welcome email data
    const recipientValidation = EmailRecipientSchema.safeParse(to);
    const dataValidation = WelcomeEmailDataSchema.safeParse(data);

    if (!recipientValidation.success) {
      const errors = recipientValidation.error.issues.map(err => `to.${err.path.join('.')}: ${err.message}`).join(', ');
      throw new Error(`Recipient validation failed: ${errors}`);
    }

    if (!dataValidation.success) {
      const errors = dataValidation.error.issues.map(err => `data.${err.path.join('.')}: ${err.message}`).join(', ');
      throw new Error(`Welcome email data validation failed: ${errors}`);
    }

    const validatedTo = recipientValidation.data;
    const validatedData = dataValidation.data;
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #333;">Welcome to Our Platform!</h1>
        <p>Hi ${validatedData.userName},</p>
        <p>Thank you for joining us! We're excited to have you on board.</p>
        ${validatedData.loginUrl ? `<p><a href="${validatedData.loginUrl}" style="background: #007bff; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Get Started</a></p>` : ''}
        <p>If you have any questions, feel free to reach out to our support team.</p>
        <p>Best regards,<br>The Team</p>
      </div>
    `;

    const text = `
      Welcome to Our Platform!
      
      Hi ${validatedData.userName},
      
      Thank you for joining us! We're excited to have you on board.
      ${validatedData.loginUrl ? `\n\nGet started: ${validatedData.loginUrl}` : ''}
      
      If you have any questions, feel free to reach out to our support team.
      
      Best regards,
      The Team
    `;

    return this.sendEmail({
      to: [validatedTo],
      subject: 'Welcome to Our Platform!',
      html,
      text
    });
  }

  /**
   * Send password reset email
   * @param to - Recipient email and name
   * @param data - Password reset email data
   */
  async sendPasswordResetEmail(
    to: EmailRecipient,
    data: PasswordResetEmailData
  ): Promise<any> {
    // Validate recipient and password reset email data
    const recipientValidation = EmailRecipientSchema.safeParse(to);
    const dataValidation = PasswordResetEmailDataSchema.safeParse(data);

    if (!recipientValidation.success) {
      const errors = recipientValidation.error.issues.map(err => `to.${err.path.join('.')}: ${err.message}`).join(', ');
      throw new Error(`Recipient validation failed: ${errors}`);
    }

    if (!dataValidation.success) {
      const errors = dataValidation.error.issues.map(err => `data.${err.path.join('.')}: ${err.message}`).join(', ');
      throw new Error(`Password reset email data validation failed: ${errors}`);
    }

    const validatedTo = recipientValidation.data;
    const validatedData = dataValidation.data;
    const expirationText = validatedData.expirationTime || '24 hours';
    
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #333;">Password Reset Request</h1>
        <p>Hi ${validatedData.userName},</p>
        <p>We received a request to reset your password. Click the button below to create a new password:</p>
        <p><a href="${validatedData.resetUrl}" style="background: #dc3545; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Reset Password</a></p>
        <p><strong>This link will expire in ${expirationText}.</strong></p>
        <p>If you didn't request this password reset, please ignore this email.</p>
        <p>Best regards,<br>The Team</p>
      </div>
    `;

    const text = `
      Password Reset Request
      
      Hi ${validatedData.userName},
      
      We received a request to reset your password. Use this link to create a new password:
      ${validatedData.resetUrl}
      
      This link will expire in ${expirationText}.
      
      If you didn't request this password reset, please ignore this email.
      
      Best regards,
      The Team
    `;

    return this.sendEmail({
      to: [validatedTo],
      subject: 'Password Reset Request',
      html,
      text
    });
  }
}
