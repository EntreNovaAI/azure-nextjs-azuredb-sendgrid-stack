'use client'

import * as React from 'react'
import { Moon, Sun } from 'lucide-react'
import { useTheme } from 'next-themes'

import { Button, DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@components/ui'

/**
 * Theme Toggle Component
 * Simple toggle between light and dark modes
 * Uses next-themes and integrates with simplified theme system
 */
export function ThemeToggle() {
  const { setTheme } = useTheme()

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        {/* Simple icon button using theme colors */}
        <Button 
          variant="outline" 
          size="icon"
          className="bg-background border-secondary hover:bg-primary hover:border-primary transition-colors"
        >
          {/* Sun icon for light mode */}
          <Sun className="h-5 w-5 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0 text-text" />
          {/* Moon icon for dark mode */}
          <Moon className="absolute h-5 w-5 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100 text-text" />
          <span className="sr-only">Toggle theme</span>
        </Button>
      </DropdownMenuTrigger>
      {/* Dropdown menu using theme colors */}
      <DropdownMenuContent 
        align="end"
        className="bg-background border-secondary"
      >
        <DropdownMenuItem 
          onClick={() => setTheme('light')}
          className="hover:bg-accent focus:bg-accent cursor-pointer"
        >
          Light
        </DropdownMenuItem>
        <DropdownMenuItem 
          onClick={() => setTheme('dark')}
          className="hover:bg-accent focus:bg-accent cursor-pointer"
        >
          Dark
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

