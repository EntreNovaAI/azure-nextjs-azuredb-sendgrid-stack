'use client'

import Link from 'next/link'
import Image from 'next/image'
import { useSession } from 'next-auth/react'
import { useTheme } from 'next-themes'
import { useEffect, useState } from 'react'
import { Menu } from 'lucide-react'
import { LoginButton } from '@auth/components'
import { 
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@components/ui'
import { ThemeToggle } from '@components/shared'
import { getColors } from '@constants/colors'

/**
 * Navbar Component
 * Main navigation bar with auth-aware menu items
 * Shows protected links only when user is authenticated
 * Includes theme toggle for dark/light mode switching
 * Uses centralized color system from @constants/colors
 * Implements mounted state to prevent hydration mismatches
 */
export function Navbar() {
  const { data: session } = useSession()
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
    <nav className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="max-w-[1200px] mx-auto px-2 sm:px-4 flex h-16 items-center justify-between gap-2">
        {/* Logo/Brand - responsive sizing with actual icon */}
        <Link href="/" className="flex items-center gap-1 sm:gap-2 hover:opacity-80 transition-opacity">
          {/* Use actual icon.png instead of emoji */}
          <Image 
            src="/icon.png" 
            alt="EntreNova Logo" 
            width={40} 
            height={40} 
            className="w-8 h-8 sm:w-10 sm:h-10"
          />
          <h1 
            className="text-base sm:text-2xl font-bold bg-gradient-to-r bg-clip-text text-transparent whitespace-nowrap"
            style={{
              backgroundImage: `linear-gradient(to right, ${colors.primary}, ${colors.secondary}, ${colors.accent})`
            }}
          >
            Azure Next Stack
          </h1>
        </Link>

        {/* Navigation Links - hidden on mobile, shown on tablet and up */}
        <div className="hidden md:flex items-center gap-6">
          <Link 
            href="/" 
            className="text-lg font-medium text-foreground/60 hover:text-foreground transition-colors"
          >
            Home
          </Link>
          
          {/* Show protected links only when authenticated */}
          {session && (
            <>
              <Link 
                href="/dashboard" 
                className="text-lg font-medium text-foreground/60 hover:text-foreground transition-colors"
              >
                Dashboard
              </Link>
              <Link 
                href="/profile" 
                className="text-lg font-medium text-foreground/60 hover:text-foreground transition-colors"
              >
                Profile
              </Link>
            </>
          )}
        </div>

        {/* Desktop: Auth Section with Theme Toggle */}
        <div className="hidden md:flex items-center gap-3">
          <LoginButton />
          <ThemeToggle />
        </div>

        {/* Mobile: Hamburger Menu */}
        <div className="flex md:hidden items-center gap-2">
          <ThemeToggle />
          <Sheet>
            <SheetTrigger asChild>
              <button className="p-2 hover:bg-accent rounded-md transition-colors">
                <Menu className="h-6 w-6" />
                <span className="sr-only">Open menu</span>
              </button>
            </SheetTrigger>
            <SheetContent side="right" className="w-[280px] sm:w-[320px]">
              <SheetHeader>
                <SheetTitle className="text-left">Menu</SheetTitle>
              </SheetHeader>
              <div className="flex flex-col gap-4 mt-6">
                {/* Navigation Links */}
                <Link 
                  href="/" 
                  className="text-lg font-medium text-foreground/80 hover:text-foreground transition-colors py-2"
                >
                  Home
                </Link>
                
                {/* Show protected links only when authenticated */}
                {session && (
                  <>
                    <Link 
                      href="/dashboard" 
                      className="text-lg font-medium text-foreground/80 hover:text-foreground transition-colors py-2"
                    >
                      Dashboard
                    </Link>
                    <Link 
                      href="/profile" 
                      className="text-lg font-medium text-foreground/80 hover:text-foreground transition-colors py-2"
                    >
                      Profile
                    </Link>
                  </>
                )}
                
                {/* Separator */}
                <div className="border-t my-2" />
                
                {/* Auth Section */}
                <div className="py-2">
                  <LoginButton />
                </div>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </nav>
  )
}

