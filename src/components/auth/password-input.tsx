'use client'

import { useState } from 'react'
import { Eye, EyeOff } from 'lucide-react'

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
 * Uses global theme variables
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

  return (
    <div className={className}>
      {/* Label - uses theme text colors */}
      <label htmlFor={id} className="block text-sm font-medium text-text mb-1">
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
          className="w-full px-3 py-2 pr-10 border border-gray-300 dark:border-gray-700 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent text-text bg-background [&::-ms-reveal]:hidden [&::-ms-clear]:hidden placeholder:text-gray-400"
          placeholder={placeholder}
        />

        {/* Toggle visibility button with eye/glasses icons - uses theme text colors */}
        <button
          type="button"
          onClick={() => setShowPassword(!showPassword)}
          aria-label={showPassword ? 'Hide password' : 'Show password'}
          className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-500 dark:text-gray-400 hover:text-text transition-colors"
        >
          {showPassword ? (
            <EyeOff className="h-5 w-5" aria-hidden="true" />
          ) : (
            <Eye className="h-5 w-5" aria-hidden="true" />
          )}
        </button>
      </div>

      {/* Optional hint text - uses theme text colors */}
      {showHint && (
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
          {hintText}
        </p>
      )}
    </div>
  )
}

