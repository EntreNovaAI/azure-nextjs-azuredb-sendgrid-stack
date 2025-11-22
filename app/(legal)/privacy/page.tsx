'use client'

import { MainLayout } from '@/src/layouts'
import { LegalDocument } from '@components/sections'

/**
 * Privacy Policy Page
 * Standard legal page describing how we collect, use, and protect data.
 * Uses the reusable LegalDocument template for consistent styling.
 * Wrapped with MainLayout for consistent structure and styling across the app.
 */
export default function PrivacyPolicyPage() {
  const lastUpdated = new Date().toLocaleDateString()

  return (
    <MainLayout navbarOverlay={false}>
      <LegalDocument
        title="Privacy Policy"
        lastUpdated={lastUpdated}
        content={
          <>
            <section>
              <h2 className="text-xl font-semibold">Introduction</h2>
              <p className="text-muted-foreground mt-2">
                This Privacy Policy explains how we collect, use, and protect your personal
                information when you use our services. By using our platform, you agree to the
                collection and use of information in accordance with this policy.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold">Information We Collect</h2>
              <ul className="list-disc pl-5 text-muted-foreground mt-2 space-y-1">
                <li>Account information (name, email, authentication data)</li>
                <li>Billing information processed securely via our payment provider</li>
                <li>Usage data and device information for performance and security</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold">How We Use Information</h2>
              <ul className="list-disc pl-5 text-muted-foreground mt-2 space-y-1">
                <li>Provide and maintain the service</li>
                <li>Process subscriptions and manage billing</li>
                <li>Improve, personalize, and expand our services</li>
                <li>Detect, prevent, and address technical issues and abuse</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold">Data Retention</h2>
              <p className="text-muted-foreground mt-2">
                We retain personal data only for as long as necessary to provide the service
                and fulfill the purposes outlined in this policy, unless a longer retention
                period is required by law.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold">Security</h2>
              <p className="text-muted-foreground mt-2">
                We implement appropriate technical and organizational measures to protect your
                information. However, no method of transmission or storage is 100% secure, and
                we cannot guarantee absolute security.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold">Your Rights</h2>
              <p className="text-muted-foreground mt-2">
                Depending on your jurisdiction, you may have rights to access, correct, delete,
                or restrict processing of your personal data. Contact us to exercise these rights.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold">Contact</h2>
              <p className="text-muted-foreground mt-2">
                If you have any questions about this Privacy Policy, please reach out to us via
                the Contact page.
              </p>
            </section>
          </>
        }
      />
    </MainLayout>
  )
}
