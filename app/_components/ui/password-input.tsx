'use client'

import { useState } from 'react'

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
      {/* Label */}
      <label htmlFor={id} className="block text-sm font-medium text-gray-700 mb-1">
        {label}
      </label>

      {/* Input with toggle button */}
      <div className="relative">
        <input
          id={id}
          type={showPassword ? 'text' : 'password'}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          required={required}
          className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent text-black [&::-ms-reveal]:hidden [&::-ms-clear]:hidden"
          placeholder={placeholder}
        />

        {/* Toggle visibility button with eye/glasses icons */}
        <button
          type="button"
          onClick={() => setShowPassword(!showPassword)}
          aria-label={showPassword ? 'Hide password' : 'Show password'}
          className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-500 hover:text-gray-700 transition-colors"
        >
          {showPassword ? (
            <span className="text-2xl" title="Click to hide">👓</span>
          ) : (
            <span className="text-2xl" title="Click to show">👁️</span>
          )}
        </button>
      </div>

      {/* Optional hint text */}
      {showHint && (
        <p className="text-xs text-gray-500 mt-1">
          {hintText}
        </p>
      )}
    </div>
  )
}

