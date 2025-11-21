'use client'

import { Card, CardContent, Separator } from '@components/ui'

interface LegalDocumentProps {
  title: string
  lastUpdated: string
  content: React.ReactNode
}

/**
 * Legal Document Template
 *
 * Reusable component for legal pages (Privacy Policy, Terms, etc.).
 * Consistently styled with the theme's color palette using globals.css variables.
 *
 * @param title - The title of the legal document
 * @param lastUpdated - The date string to display
 * @param content - The main content (usually HTML/JSX) of the document
 */
export function LegalDocument({ title, lastUpdated, content }: LegalDocumentProps) {
  return (
    <div className="pb-12 pt-24 md:pt-32">
      {/* Page header with brand gradient */}
      <div className="max-w-3xl mx-auto mb-6 text-center">
        <h1 className="text-4xl md:text-5xl font-bold bg-linear-to-r from-primary via-secondary to-accent bg-clip-text text-transparent">
          {title}
        </h1>
        <p className="text-sm text-muted-foreground mt-2">Last updated: {lastUpdated}</p>
      </div>

      <Separator className="max-w-3xl mx-auto" />

      {/* Content container */}
      <div className="mt-8 max-w-3xl mx-auto space-y-6">
        <Card>
          <CardContent className="p-6 space-y-4">
            {content}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
