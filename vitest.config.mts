// @ts-check
/// <reference types="node" />
import { defineConfig } from 'vitest/config'
// @ts-ignore - Package has types but TypeScript can't resolve in .mts context
import react from '@vitejs/plugin-react'
import tsconfigPaths from 'vite-tsconfig-paths'
import path from 'path'
 
export default defineConfig({
  plugins: [
    tsconfigPaths({
      projects: ['./tsconfig.test.json']
    }),
    react()
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './'),
      '@src': path.resolve(__dirname, './src'),
      '@lib': path.resolve(__dirname, './src/lib'),
      '@components': path.resolve(__dirname, './src/components'),
      '@ui': path.resolve(__dirname, './src/components/ui'),
      '@reactBits': path.resolve(__dirname, './src/components/ui/reactBits'),
      '@constants': path.resolve(__dirname, './src/constants'),
      '@app': path.resolve(__dirname, './app'),
      '@auth': path.resolve(__dirname, './app/auth'),
      '@api': path.resolve(__dirname, './app/(api)/api'),
      '@dashboard': path.resolve(__dirname, './app/(product)/dashboard'),
      // Mock server-only package for tests
      'server-only': path.resolve(__dirname, './vitest.setup.ts'),
    },
  },
  test: {
    // Exclude E2E tests - these are run with Playwright, not Vitest
    exclude: ['**/tests/e2e/**/*.spec.ts', '**/node_modules/**', '**/.next/**'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html'],
      reportsDirectory: './coverage',
      exclude: ['node_modules/', '.next/'],
    },
    environment: 'jsdom',
    setupFiles: ['./vitest.setup.ts'],
    globals: true,
    testTimeout: 10000,
    // Handle unhandled promise rejections gracefully
    onConsoleLog(log: string, type: 'stdout' | 'stderr'): boolean | void {
      // Filter out noisy jsdom warnings that don't affect tests
      if (log.includes('Could not parse CSS stylesheet') || 
          log.includes('Error: AggregateError')) {
        return false
      }
    },
    // Improve error reporting - using 'default' instead of 'verbose' for v4 compatibility
    reporters: ['default'],
    // Use pool with proper configuration for v4
    pool: 'forks',
  },
})