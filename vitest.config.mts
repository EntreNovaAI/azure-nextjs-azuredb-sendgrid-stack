import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import tsconfigPaths from 'vite-tsconfig-paths'
 
export default defineConfig({
  plugins: [tsconfigPaths(), react()],
  test: {
    coverage: {
      provider: 'v8',          // or 'istanbul'
      reporter: ['text', 'html'], // 'text' shows in console, 'html' gives a browsable report
      reportsDirectory: './coverage', // default
      exclude: ['node_modules/', '.next/'], // ignore noise
    },
    environment: 'jsdom',
    setupFiles: ['./vitest.setup.ts'],
    globals: true,
    // Increase test timeout for async operations
    testTimeout: 10000,
    // Handle unhandled promise rejections gracefully
    onConsoleLog(log: string, type: 'stdout' | 'stderr'): boolean | void {
      // Filter out noisy jsdom warnings that don't affect tests
      if (log.includes('Could not parse CSS stylesheet') || 
          log.includes('Error: AggregateError')) {
        return false
      }
    },
    // Improve error reporting
    reporters: ['verbose'],
    // Disable threads for more stable test execution
    pool: 'forks',
    // Set resource limits
    poolOptions: {
      forks: {
        singleFork: true,
      },
    },
  },
})