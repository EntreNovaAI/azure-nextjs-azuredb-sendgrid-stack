'use client'

import { useState } from 'react'
import { useTheme } from 'next-themes'
import { getColors } from '@constants/colors'

interface PasswordInputProps {
  id: string
  label: string
  value: string
  onChange: (value: string) => void
  required?: boolean
  placeholder?: string
  showHint?: boolean
  hintText?: string
  className?: string
}

/**
 * PasswordInput Component
 * Reusable password input field with visibility toggle
 * Features eye icon (hidden) and glasses icon (visible)
 * Includes optional password requirements hint
 * Uses centralized color system from @constants/colors
 */
export function PasswordInput({
  id,
  label,
  value,
  onChange,
  required = false,
  placeholder = '••••••••',
  showHint = false,
  hintText = 'Must be at least 8 characters with uppercase, lowercase, number, and special character',
  className = ''
}: PasswordInputProps) {
  // Track password visibility state
  const [showPassword, setShowPassword] = useState(false)
  const { resolvedTheme } = useTheme()
  const colors = getColors(resolvedTheme === 'dark')

  return (
    <div className={className}>
      {/* Label - uses theme text colors */}
      <label htmlFor={id} className="block text-sm font-medium text-light-text dark:text-dark-text mb-1">
        {label}
      </label>

      {/* Input with toggle button - uses dynamic primary color for focus ring */}
      <div className="relative">
        <input
          id={id}
          type={showPassword ? 'text' : 'password'}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          required={required}
          className="w-full px-3 py-2 pr-10 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:border-transparent text-light-text dark:text-dark-text bg-light-bg dark:bg-dark-bg [&::-ms-reveal]:hidden [&::-ms-clear]:hidden"
          style={{
            '--focus-ring-color': colors.primary
          } as React.CSSProperties}
          onFocus={(e) => {
            e.currentTarget.style.boxShadow = `0 0 0 2px ${colors.primary}`
          }}
          onBlur={(e) => {
            e.currentTarget.style.boxShadow = ''
          }}
          placeholder={placeholder}
        />

        {/* Toggle visibility button with eye/glasses icons - uses theme text colors */}
        <button
          type="button"
          onClick={() => setShowPassword(!showPassword)}
          aria-label={showPassword ? 'Hide password' : 'Show password'}
          className="absolute inset-y-0 right-0 pr-3 flex items-center text-light-text-secondary dark:text-dark-text-secondary hover:text-light-text dark:hover:text-dark-text transition-colors"
        >
          {showPassword ? (
            <span className="text-2xl" title="Click to hide">👓</span>
          ) : (
            <span className="text-2xl" title="Click to show">👁️</span>
          )}
        </button>
      </div>

      {/* Optional hint text - uses theme text colors */}
      {showHint && (
        <p className="text-xs text-light-text-secondary dark:text-dark-text-secondary mt-1">
          {hintText}
        </p>
      )}
    </div>
  )
}

