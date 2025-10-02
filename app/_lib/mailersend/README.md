# MailerSend Email Service

A reusable email service built on top of MailerSend for sending transactional emails with comprehensive Zod validation for type safety and runtime validation.

## Setup

1. Add the required environment variables to your `.env` file:

```env
MAILERSEND_API_KEY=your_mailersend_api_key_here
MAILERSEND_FROM_EMAIL=noreply@yourdomain.com
MAILERSEND_FROM_NAME=Your App Name
```

2. Install dependencies (Zod is required for validation):

```bash
pnpm add zod mailersend
```

3. Import the email service in your application:

```typescript
import { 
  emailService, 
  sendEmail, 
  sendWelcomeEmail, 
  sendPasswordResetEmail,
  EmailConfigSchema,
  WelcomeEmailDataSchema,
  PasswordResetEmailDataSchema
} from '@/app/_lib/mailersend';
```

## Usage Examples

### Basic Email Sending

```typescript
import { sendEmail } from '@/app/_lib/mailersend';

// Send a custom email
await sendEmail({
  to: [{ email: 'user@example.com', name: 'John Doe' }],
  subject: 'Welcome to our platform!',
  html: '<h1>Hello!</h1><p>Welcome to our platform.</p>',
  text: 'Hello! Welcome to our platform.'
});
```

### Welcome Email

```typescript
import { sendWelcomeEmail } from '@/app/_lib/mailersend';

// Send welcome email to new user
await sendWelcomeEmail(
  { email: 'newuser@example.com', name: 'Jane Smith' },
  {
    userName: 'Jane',
    loginUrl: 'https://yourapp.com/login'
  }
);
```

### Password Reset Email

```typescript
import { sendPasswordResetEmail } from '@/app/_lib/mailersend';

// Send password reset email
await sendPasswordResetEmail(
  { email: 'user@example.com', name: 'John Doe' },
  {
    userName: 'John',
    resetUrl: 'https://yourapp.com/reset-password?token=abc123',
    expirationTime: '1 hour'
  }
);
```

### Advanced Usage with Custom Configuration

```typescript
import { emailService } from '@/app/_lib/mailersend';

// Send email with custom from address and reply-to
await emailService.sendEmail({
  to: [
    { email: 'user1@example.com', name: 'User One' },
    { email: 'user2@example.com', name: 'User Two' }
  ],
  from: { email: 'support@yourdomain.com', name: 'Support Team' },
  replyTo: { email: 'noreply@yourdomain.com', name: 'No Reply' },
  subject: 'Important Update',
  html: '<h1>Update</h1><p>We have an important update for you.</p>',
  text: 'Update: We have an important update for you.'
});
```

## API Reference

### EmailService Class

The main service class that handles email operations.

#### Constructor
- Automatically initializes with environment variables
- Throws error if `MAILERSEND_API_KEY` is not provided

#### Methods

##### `sendEmail(config: EmailConfig): Promise<any>`
Send a custom email with full configuration control.

##### `sendWelcomeEmail(to, data): Promise<any>`
Send a pre-designed welcome email template.

##### `sendPasswordResetEmail(to, data): Promise<any>`
Send a pre-designed password reset email template.

### Zod Schemas & TypeScript Types

All types are derived from Zod schemas for runtime validation and compile-time type safety.

#### EmailConfigSchema
```typescript
const EmailConfigSchema = z.object({
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

type EmailConfig = z.infer<typeof EmailConfigSchema>;
```

#### WelcomeEmailDataSchema
```typescript
const WelcomeEmailDataSchema = z.object({
  userName: z.string().min(1, "User name is required"),
  loginUrl: z.string().url("Invalid login URL").optional()
});

type WelcomeEmailData = z.infer<typeof WelcomeEmailDataSchema>;
```

#### PasswordResetEmailDataSchema
```typescript
const PasswordResetEmailDataSchema = z.object({
  userName: z.string().min(1, "User name is required"),
  resetUrl: z.string().url("Invalid reset URL"),
  expirationTime: z.string().optional()
});

type PasswordResetEmailData = z.infer<typeof PasswordResetEmailDataSchema>;
```

#### EmailRecipientSchema & EmailSenderSchema
```typescript
const EmailRecipientSchema = z.object({
  email: z.string().email("Invalid email address"),
  name: z.string().optional()
});

const EmailSenderSchema = z.object({
  email: z.string().email("Invalid email address"),
  name: z.string().optional()
});

type EmailRecipient = z.infer<typeof EmailRecipientSchema>;
type EmailSender = z.infer<typeof EmailSenderSchema>;
```

## Validation & Error Handling

The service includes comprehensive validation and error handling using Zod:

### Runtime Validation
- **Environment Variables**: Validates API key and configuration on service initialization
- **Email Configuration**: Validates all email parameters before sending
- **Template Data**: Validates specific data for welcome and password reset emails
- **Email Addresses**: Validates email format using Zod's built-in email validation
- **URLs**: Validates login and reset URLs to ensure they are properly formatted

### Error Messages
- Detailed validation error messages with field-specific information
- Clear error paths showing exactly which field failed validation
- Meaningful error messages for debugging and development

### Validation Examples

```typescript
// This will throw a validation error
try {
  await sendEmail({
    to: [{ email: 'invalid-email' }], // Invalid email format
    subject: '', // Empty subject
    // Missing html or text content
  });
} catch (error) {
  console.error(error.message);
  // "Email configuration validation failed: to.0.email: Invalid email address, subject: Subject is required, html,text: Either HTML or text content must be provided"
}

// This will also throw a validation error
try {
  await sendWelcomeEmail(
    { email: 'user@example.com' },
    { userName: '' } // Empty user name
  );
} catch (error) {
  console.error(error.message);
  // "Welcome email data validation failed: data.userName: User name is required"
}
```

## Best Practices

1. **Environment Variables**: Always use environment variables for sensitive data like API keys
2. **Validation**: Let Zod handle validation - don't bypass the validation schemas
3. **Error Handling**: Wrap email sending in try-catch blocks and handle validation errors appropriately
4. **Type Safety**: Use the exported TypeScript types for better development experience
5. **Templates**: Use the pre-built templates for common email types
6. **Testing**: Test email functionality in development with test email addresses
7. **Logging**: Monitor email sending success/failure in production logs
8. **Schema Validation**: Use the exported Zod schemas for additional validation in your application logic

## Integration Examples

### In API Routes

```typescript
// app/api/auth/register/route.ts
import { sendWelcomeEmail } from '@/app/_lib/mailersend';

export async function POST(request: Request) {
  try {
    // ... user registration logic ...
    
    // Send welcome email
    await sendWelcomeEmail(
      { email: user.email, name: user.name },
      { userName: user.name, loginUrl: `${process.env.NEXTAUTH_URL}/login` }
    );
    
    return Response.json({ success: true });
  } catch (error) {
    console.error('Registration failed:', error);
    return Response.json({ error: 'Registration failed' }, { status: 500 });
  }
}
```

### In Server Actions

```typescript
// app/actions/password-reset.ts
import { sendPasswordResetEmail } from '@/app/_lib/mailersend';

export async function requestPasswordReset(email: string) {
  try {
    // ... generate reset token logic ...
    
    await sendPasswordResetEmail(
      { email },
      {
        userName: user.name,
        resetUrl: `${process.env.NEXTAUTH_URL}/reset-password?token=${token}`,
        expirationTime: '1 hour'
      }
    );
    
    return { success: true };
  } catch (error) {
    console.error('Password reset email failed:', error);
    throw new Error('Failed to send password reset email');
  }
}
```
