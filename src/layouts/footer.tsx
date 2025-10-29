'use client'

import Link from 'next/link'
import { useTheme } from 'next-themes'
import { useEffect, useState } from 'react'
import { Separator } from '@components/ui/separator'
import { getColors } from '@constants/colors'

/**
 * Footer Component
 * Site-wide footer with links and copyright information
 * Adapts styling based on current theme (light/dark)
 * Uses centralized color system from @constants/colors
 * Implements mounted state to prevent hydration mismatches
 */
export function Footer() {
  const currentYear = new Date().getFullYear()
  const { resolvedTheme } = useTheme()
  // Track mounted state to prevent hydration mismatch
  const [mounted, setMounted] = useState(false)
  
  // Set mounted to true after component mounts on client
  useEffect(() => {
    setMounted(true)
  }, [])
  
  // Use light theme as default during SSR and initial render to prevent hydration errors
  const colors = getColors(mounted ? resolvedTheme === 'dark' : false)

  return (
    <footer className="w-full border-t bg-background">
      <div className="max-w-[1200px] mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-6">
          {/* Brand Section */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <span className="text-2xl">🚀</span>
              <h3 
                className="text-lg font-bold bg-gradient-to-r bg-clip-text text-transparent"
                style={{
                  backgroundImage: `linear-gradient(to right, ${colors.primary}, ${colors.secondary}, ${colors.accent})`
                }}
              >
                Azure Next Stack
              </h3>
            </div>
            <p className="text-sm text-muted-foreground">
              Secure subscription platform with Azure integration
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="font-semibold mb-3 text-sm">Quick Links</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
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
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>
                <Link href="#" className="hover:text-foreground transition-colors">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link href="#" className="hover:text-foreground transition-colors">
                  Terms of Service
                </Link>
              </li>
              <li>
                <Link href="#" className="hover:text-foreground transition-colors">
                  Contact
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <Separator className="mb-6" />

        {/* Copyright */}
        <div className="text-center text-sm text-muted-foreground">
          <p>&copy; {currentYear} Azure Next Stack. All rights reserved.</p>
        </div>
      </div>
    </footer>
  )
}

