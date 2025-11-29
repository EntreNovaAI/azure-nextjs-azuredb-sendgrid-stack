'use client'

import { MainLayout } from '@/src/layouts'
import { Card, CardContent, CardHeader, CardTitle } from '@components/ui'
import { Check, Smartphone } from 'lucide-react'

/**
 * Mobile Success Page
 * Displayed after successful account creation from mobile app.
 * Tells user they can close the browser and return to the mobile app to login.
 * Simple, clear instructions with visual confirmation.
 */
export default function MobileSuccessPage() {
  return (
    <MainLayout showFooter={false}>
      <div className="flex min-h-[calc(100vh-100px)] flex-col items-center justify-center py-12 px-4">
        <div className="w-full max-w-md space-y-6">
          <Card>
            <CardHeader className="text-center">
              {/* Success checkmark icon */}
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-secondary/20">
                <Check className="h-8 w-8 text-secondary" strokeWidth={2} />
              </div>
              <CardTitle className="text-2xl text-primary">
                Account Created!
              </CardTitle>
            </CardHeader>
            <CardContent className="text-center space-y-4">
              {/* Main instruction message */}
              <p className="text-text/70">
                Your account has been successfully created.
              </p>
              
              {/* Return to app instructions */}
              <div className="rounded-lg bg-primary/10 p-4 border border-primary/20">
                <p className="font-medium text-text">
                  You can now close this browser and return to the app to sign in.
                </p>
              </div>

              {/* Mobile icon indicator */}
              <div className="pt-4 flex justify-center">
                <Smartphone className="h-12 w-12 text-text/30" strokeWidth={1.5} />
              </div>
              
              <p className="text-sm text-text/60">
                Use your email and password to sign in on the mobile app.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </MainLayout>
  )
}
