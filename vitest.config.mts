import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import tsconfigPaths from 'vite-tsconfig-paths'
 
export default defineConfig({
  plugins: [tsconfigPaths(), react()],
  test: {
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