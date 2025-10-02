import { z } from "zod";

// Zod schemas for validation
export const EmailRecipientSchema = z.object({
  email: z.email("Invalid email address"),
  name: z.string().optional()
});

export const EmailSenderSchema = z.object({
  email: z.email("Invalid email address"),
  name: z.string().optional()
});

// Main email configuration schema
export const EmailConfigSchema = z.object({
  to: z.array(EmailRecipientSchema).min(1, "At least one recipient is required"),
  from: EmailSenderSchema.optional(),
  subject: z.string().min(1, "Subject is required").max(200, "Subject too long"),
  html: z.string().optional(),
  text: z.string().optional(),
  replyTo: EmailSenderSchema.optional()
}).refine(
  (data) => data.html || data.text,
  {
    message: "Either HTML or text content must be provided",
    path: ["html", "text"]
  }
);

// Welcome email data schema
export const WelcomeEmailDataSchema = z.object({
  userName: z.string().min(1, "User name is required"),
  loginUrl: z.url("Invalid login URL").optional()
});

// Password reset email data schema
export const PasswordResetEmailDataSchema = z.object({
  userName: z.string().min(1, "User name is required"),
  resetUrl: z.url("Invalid reset URL"),
  expirationTime: z.string().optional()
});

// Environment configuration schema (internal use only)
export const EnvironmentConfigSchema = z.object({
  MAILERSEND_API_KEY: z.string().min(1, "MailerSend API key is required"),
  MAILERSEND_FROM_EMAIL: z.email("Invalid from email address").optional(),
  MAILERSEND_FROM_NAME: z.string().optional()
});

// TypeScript types derived from Zod schemas
export type EmailConfig = z.infer<typeof EmailConfigSchema>;
export type WelcomeEmailData = z.infer<typeof WelcomeEmailDataSchema>;
export type PasswordResetEmailData = z.infer<typeof PasswordResetEmailDataSchema>;
export type EmailRecipient = z.infer<typeof EmailRecipientSchema>;
export type EmailSender = z.infer<typeof EmailSenderSchema>;
export type EnvironmentConfig = z.infer<typeof EnvironmentConfigSchema>;
