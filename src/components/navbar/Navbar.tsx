'use client'

import { useSession, signOut } from 'next-auth/react'
import { usePathname } from 'next/navigation'
import { ThemeToggle } from '@components/shared'
import PillNav, { type PillNavItem } from '../ui/reactBits/PillNav'

/**
 * Navbar with PillNav Component
 * 
 * Modern navigation using PillNav with theme-aware styling
 * Automatically responds to light/dark mode via next-themes
 * 
 * Features:
 * - Auth-aware menu items (shows Dashboard/Profile when logged in)
 * - Active page indicator
 * - Theme toggle integration built into navigation bar
 * - Login/Logout button integrated into navigation bar
 * - Fully responsive with mobile menu
 * - Uses Tailwind CSS variables from globals.css
 * 
 * Usage:
 * Replace the Navbar import in your layout with this component
 * import { NavbarPillNav as Navbar } from '@layouts'
 */
export function Navbar() {
  const { data: session, status } = useSession()
  const pathname = usePathname()

  // Build navigation items based on auth state
  const navItems: PillNavItem[] = [
    {
      label: 'Home',
      href: '/',
      ariaLabel: 'Navigate to home page'
    },
    // Show protected routes only when authenticated
    ...(session ? [
      {
        label: 'Dashboard',
        href: '/dashboard',
        ariaLabel: 'Navigate to dashboard'
      },
      {
        label: 'Profile',
        href: '/profile',
        ariaLabel: 'Navigate to profile'
      },
      {
        label: 'Sign Out',
        href: '#',
        ariaLabel: 'Sign out of your account',
        onClick: () => signOut()
      }
    ] : [
      // Show Sign In only when NOT authenticated
      {
        label: 'Sign In/Up',
        href: '/auth/signup',
        ariaLabel: 'Sign in or create an account'
      }
    ])
  ]

  return (
    <PillNav
      logo="/icon.png"
      logoAlt="EntreNova Logo"
      items={navItems}
      activeHref={pathname}
      initialLoadAnimation={true}
      rightSlot={
        <>
          {/* Welcome message - hidden on mobile, with background matching pill nav */}
          {session && (
            <div className="hidden lg:flex items-center h-[42px] px-4 rounded-full bg-secondary mr-2">
              <p className="text-sm font-medium text-background">
                Welcome, <strong className="text">{session.user?.name || session.user?.email}</strong>!
              </p>
            </div>
          )}
          <ThemeToggle />
        </>
      }
    />
  )
}

export default Navbar;
