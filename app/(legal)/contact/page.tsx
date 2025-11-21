'use client'

import { MainLayout } from '@/src/layouts'
import { Button, Card, CardContent, Input, Label, Separator } from '@components/ui'

/**
 * Contact Page (Template)
 * Simple, styled contact form template using existing UI components.
 * This is non-functional by default; wire it to your API or email service as needed.
 */
export default function ContactPage() {
  const handleSubmit: React.FormEventHandler<HTMLFormElement> = (e) => {
    e.preventDefault()
    // Implement submission to your API/email service (e.g., SendGrid) here.
    // Keep this template minimal and focused on structure and styling.
    alert('This is a template form. Please implement submission logic.')
  }

  return (
    <MainLayout>
      <div className="pb-12 pt-24 md:pt-32">
        {/* Page header with brand gradient */}
        <div className="max-w-3xl mx-auto mb-6 text-center">
          <h1 className="text-4xl md:text-5xl font-bold bg-linear-to-r from-primary via-secondary to-accent bg-clip-text text-transparent">
            Contact
          </h1>
          <p className="text-sm text-muted-foreground mt-2">
            Have a question? Send us a message and we’ll get back to you.
          </p>
        </div>

        <Separator className="max-w-3xl mx-auto" />

        {/* Form card */}
        <div className="mt-8 max-w-3xl mx-auto">
          <Card>
            <CardContent className="p-6">
              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Name</Label>
                    <Input id="name" name="name" placeholder="Your name" required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input id="email" name="email" type="email" placeholder="you@example.com" required />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="subject">Subject</Label>
                  <Input id="subject" name="subject" placeholder="How can we help?" required />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="message">Message</Label>
                  {/* Using a styled textarea for consistency with inputs */}
                  <textarea
                    id="message"
                    name="message"
                    rows={6}
                    placeholder="Tell us a bit more..."
                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    required
                  />
                </div>

                <div className="flex justify-end">
                  <Button type="submit">Send Message</Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </MainLayout>
  )
}
