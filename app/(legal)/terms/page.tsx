'use client'

import { useTheme } from 'next-themes'
import { MainLayout } from '@/src/layouts'
import { Card, CardContent, Separator } from '@components/ui'
import { getColors } from '@constants/colors'

/**
 * Terms of Service Page
 * Standard legal page that outlines the rules and guidelines for using the service.
 * Theme-aware gradient header, consistent with the rest of the app.
 */
export default function TermsOfServicePage() {
  const { resolvedTheme } = useTheme()
  const colors = getColors(resolvedTheme === 'dark')
  const lastUpdated = new Date().toLocaleDateString()

  return (
    <MainLayout>
      <div className="py-12">
        {/* Page header with brand gradient */}
        <div className="max-w-3xl mx-auto mb-6 text-center">
          <h1
            className="text-4xl md:text-5xl font-bold bg-gradient-to-r bg-clip-text text-transparent"
            style={{
              backgroundImage: `linear-gradient(to right, ${colors.primary}, ${colors.secondary}, ${colors.accent})`,
            }}
          >
            Terms of Service
          </h1>
          <p className="text-sm text-muted-foreground mt-2">Last updated: {lastUpdated}</p>
        </div>

        <Separator className="max-w-3xl mx-auto" />

        {/* Content container */}
        <div className="mt-8 max-w-3xl mx-auto space-y-6">
          <Card>
            <CardContent className="p-6 space-y-4">
              <section>
                <h2 className="text-xl font-semibold">Acceptance of Terms</h2>
                <p className="text-muted-foreground mt-2">
                  By accessing or using our services, you agree to be bound by these Terms. If
                  you do not agree, you may not use the service.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold">Accounts</h2>
                <p className="text-muted-foreground mt-2">
                  You are responsible for maintaining the confidentiality of your account and
                  password and for restricting access to your account. You agree to accept
                  responsibility for all activities that occur under your account.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold">Subscriptions and Billing</h2>
                <p className="text-muted-foreground mt-2">
                  Certain parts of the service are billed on a subscription basis. Billing is
                  handled by our payment provider. By subscribing, you authorize recurring
                  charges until you cancel as described in your plan.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold">Acceptable Use</h2>
                <p className="text-muted-foreground mt-2">
                  You agree not to misuse the service, including but not limited to interfering
                  with its normal operation or attempting to access it using a method other than
                  the interfaces and instructions we provide.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold">Termination</h2>
                <p className="text-muted-foreground mt-2">
                  We may suspend or terminate your access to the service at any time for any
                  reason, including violation of these Terms. You may stop using the service at
                  any time.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold">Limitation of Liability</h2>
                <p className="text-muted-foreground mt-2">
                  To the maximum extent permitted by law, we shall not be liable for any indirect
                  or consequential damages arising from your use of the service.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold">Changes to These Terms</h2>
                <p className="text-muted-foreground mt-2">
                  We may modify these Terms from time to time. We will post the updated Terms on
                  this page and update the date above. Your continued use of the service after
                  changes become effective constitutes acceptance.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold">Contact</h2>
                <p className="text-muted-foreground mt-2">
                  If you have any questions about these Terms, please contact us via the Contact
                  page.
                </p>
              </section>
            </CardContent>
          </Card>
        </div>
      </div>
    </MainLayout>
  )
}



