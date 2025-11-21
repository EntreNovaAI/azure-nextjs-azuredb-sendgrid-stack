'use client'

import Link from 'next/link'
import { Separator } from '@components/ui'

/**
 * Footer Component
 * Site-wide footer with links and copyright information
 * Uses CSS variables for theming via globals.css
 */
export function Footer() {
  const currentYear = new Date().getFullYear()

  return (
    <footer className="w-full border-t bg-background">
      <div className="max-w-[1200px] mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-6">
          {/* Brand Section */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <span className="text-2xl">🚀</span>
              <h3 className="text-lg font-bold bg-linear-to-r from-primary via-secondary to-accent bg-clip-text text-transparent">
                Azure Next Stack
              </h3>
            </div>
            <p className="text-sm opacity-70">
              Secure subscription platform with Azure integration
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="font-semibold mb-3 text-sm">Quick Links</h4>
            <ul className="space-y-2 text-sm opacity-70">
              <li>
                <Link href="/" className="hover:text-foreground transition-colors">
                  Home
                </Link>
              </li>
              <li>
                <Link href="/dashboard" className="hover:text-foreground transition-colors">
                  Dashboard
                </Link>
              </li>
              <li>
                <Link href="/profile" className="hover:text-foreground transition-colors">
                  Profile
                </Link>
              </li>
            </ul>
          </div>

          {/* Legal Links */}
          <div>
            <h4 className="font-semibold mb-3 text-sm">Legal</h4>
            <ul className="space-y-2 text-sm opacity-70">
              <li>
                <Link href="/privacy" className="hover:text-foreground transition-colors">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link href="/terms" className="hover:text-foreground transition-colors">
                  Terms of Service
                </Link>
              </li>
              <li>
                <Link href="/contact" className="hover:text-foreground transition-colors">
                  Contact
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <Separator className="mb-6" />

        {/* Copyright */}
        <div className="text-center text-sm opacity-70">
          <p>&copy; {currentYear} Azure Next Stack. All rights reserved.</p>
        </div>
      </div>
    </footer>
  )
}

export default Footer;
