/** @type {import('next').NextConfig} */
const isDev = process.env.NODE_ENV === 'development'
const devOriginHost = (() => {
  try {
    const url = process.env.NEXTAUTH_URL || 'http://localhost:3000'
    return new URL(url).host
  } catch {
    return 'localhost:3000'
  }
})()

const nextConfig = {
  output: 'standalone',
  
  // Allow development origins dynamically
  // Uses NEXTAUTH_URL host in development, empty in production
  allowedDevOrigins: isDev ? [devOriginHost] : [],

  // Security headers for all routes
  // Provides secure-by-default configuration for the template
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          // Prevent clickjacking attacks
          { key: 'X-Frame-Options', value: 'DENY' },
          
          // Prevent MIME type sniffing
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          
          // Control referrer information leakage
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          
          // Enable XSS protection (legacy but still useful)
          { key: 'X-XSS-Protection', value: '1; mode=block' },
          
          // Restrict browser features (camera, microphone, geolocation)
          { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
          
          // Content Security Policy
          // Allows Stripe for checkout, Application Insights for monitoring
          // 'unsafe-inline' and 'unsafe-eval' required for Next.js hydration
          {
            key: 'Content-Security-Policy',
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-inline' 'unsafe-eval' js.stripe.com",
              "style-src 'self' 'unsafe-inline'",
              "img-src 'self' data: blob: *.stripe.com",
              "font-src 'self'",
              "connect-src 'self' *.stripe.com *.applicationinsights.azure.com",
              "frame-src js.stripe.com",
            ].join('; '),
          },
          // Note: HSTS (Strict-Transport-Security) is handled by Azure/hosting layer in production
        ],
      },
    ]
  },
}
module.exports = nextConfig

