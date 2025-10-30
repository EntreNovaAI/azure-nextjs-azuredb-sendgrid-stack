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
}
module.exports = nextConfig

