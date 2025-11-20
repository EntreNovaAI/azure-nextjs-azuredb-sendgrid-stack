'use client'

import { useSession } from 'next-auth/react'
import { usePathname } from 'next/navigation'
import { ThemeToggle } from '@components/shared'
import { LoginButton } from '@auth/components'
import PillNav, { type PillNavItem } from './_PillNav'

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
  const { data: session } = useSession()
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
      }
    ] : [])
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
          <LoginButton />
          <ThemeToggle />
        </>
      }
    />
  )
}

export default Navbar;