import { vi } from 'vitest'
import '@testing-library/jest-dom/vitest'
import { config } from 'dotenv'
import path from 'path'

// Load environment variables from .env.example (safe, no secrets)
// Tests set their own env vars in beforeEach blocks, so we just need the structure
// This ensures required env var names are available, but with safe example values
const envExamplePath = path.resolve(process.cwd(), '.env.example')
config({ path: envExamplePath, override: false })

// Set default NEXTAUTH_URL if not already set
// NextAuth requires an absolute URL for API calls
// Individual tests will override this in their beforeEach blocks with test values
if (!process.env.NEXTAUTH_URL) {
  process.env.NEXTAUTH_URL = 'http://localhost:3000'
}

// Note: server-only is handled via alias in vitest.config.mts

// Mock Next.js fonts
vi.mock('next/font/google', () => ({
  Inter: vi.fn(() => ({
    className: 'font-inter',
    variable: '--font-inter',
  })),
  Space_Grotesk: vi.fn(() => ({
    className: 'font-space-grotesk',
    variable: '--font-space-grotesk',
  })),
  JetBrains_Mono: vi.fn(() => ({
    className: 'font-jetbrains-mono',
    variable: '--font-jetbrains-mono',
  })),
}))

// Mock Next.js navigation
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    back: vi.fn(),
    forward: vi.fn(),
    refresh: vi.fn(),
    prefetch: vi.fn(),
  }),
  useSearchParams: () => new URLSearchParams(),
  usePathname: () => '/',
}))

// Mock Next.js router (for pages router compatibility)
vi.mock('next/router', () => ({
  useRouter: () => ({
    route: '/',
    pathname: '/',
    query: {},
    asPath: '/',
    push: vi.fn(),
    replace: vi.fn(),
    back: vi.fn(),
    prefetch: vi.fn(),
  }),
}))

// Mock axios globally to prevent real HTTP requests
// This prevents AggregateError from jsdom's XMLHttpRequest
vi.mock('axios', () => ({
  default: {
    get: vi.fn(() => Promise.resolve({ data: {} })),
    post: vi.fn(() => Promise.resolve({ data: {} })),
    put: vi.fn(() => Promise.resolve({ data: {} })),
    delete: vi.fn(() => Promise.resolve({ data: {} })),
    patch: vi.fn(() => Promise.resolve({ data: {} })),
    isAxiosError: vi.fn(() => false),
    create: vi.fn(() => ({
      get: vi.fn(() => Promise.resolve({ data: {} })),
      post: vi.fn(() => Promise.resolve({ data: {} })),
      put: vi.fn(() => Promise.resolve({ data: {} })),
      delete: vi.fn(() => Promise.resolve({ data: {} })),
      patch: vi.fn(() => Promise.resolve({ data: {} })),
    })),
  },
}))

// Mock Stripe to prevent external API calls
vi.mock('@stripe/stripe-js', () => ({
  loadStripe: vi.fn(() => Promise.resolve(null)),
}))

// Mock Stripe React components
vi.mock('@stripe/react-stripe-js', () => ({
  EmbeddedCheckoutProvider: ({ children }: any) => children,
  EmbeddedCheckout: () => null,
  Elements: ({ children }: any) => children,
  CardElement: () => null,
  useStripe: () => ({
    confirmPayment: vi.fn(),
    createPaymentMethod: vi.fn(),
  }),
  useElements: () => ({
    getElement: vi.fn(),
  }),
}))

// Mock sessionStorage (used by browser APIs)
const mockSessionStorage = (() => {
  let store: Record<string, string> = {}
  
  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => {
      store[key] = value.toString()
    },
    removeItem: (key: string) => {
      delete store[key]
    },
    clear: () => {
      store = {}
    },
  }
})()

// Mock localStorage as well
const mockLocalStorage = (() => {
  let store: Record<string, string> = {}
  
  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => {
      store[key] = value.toString()
    },
    removeItem: (key: string) => {
      delete store[key]
    },
    clear: () => {
      store = {}
    },
  }
})()

// Assign mocks to global object
Object.defineProperty(global, 'sessionStorage', {
  value: mockSessionStorage,
})

Object.defineProperty(global, 'localStorage', {
  value: mockLocalStorage,
})

// Mock fetch globally to prevent any real HTTP requests
// All external API calls should be mocked at the service level
// This ensures tests never make real network calls, even accidentally
global.fetch = vi.fn((input: RequestInfo | URL, init?: RequestInit) => {
  // Convert relative URLs to absolute URLs for logging/debugging
  let url: string
  if (typeof input === 'string') {
    url = input.startsWith('http') ? input : `${process.env.NEXTAUTH_URL || 'http://localhost:3000'}${input}`
  } else if (input instanceof URL) {
    url = input.href
  } else {
    url = input.url.startsWith('http') ? input.url : `${process.env.NEXTAUTH_URL || 'http://localhost:3000'}${input.url}`
  }
  
  // Always return a mock response - never make real HTTP calls
  // For NextAuth API routes, return a mock response
  if (url.includes('/api/auth/')) {
    return Promise.resolve(new Response(JSON.stringify({}), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    }))
  }
  
  // For all other URLs, return a generic mock response
  // Individual tests should mock their specific services (Stripe, database, etc.)
  return Promise.resolve(new Response(JSON.stringify({}), {
    status: 200,
    headers: { 'Content-Type': 'application/json' }
  }))
}) as typeof fetch

// Suppress NextAuth client fetch errors in test environment
// These are expected when SessionProvider tries to fetch session
const originalConsoleError = console.error
console.error = (...args: any[]) => {
  const message = args[0]?.toString() || ''
  // Suppress NextAuth CLIENT_FETCH_ERROR in tests
  if (message.includes('CLIENT_FETCH_ERROR') || message.includes('Failed to parse URL')) {
    return
  }
  originalConsoleError(...args)
}