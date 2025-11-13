import { NextResponse } from 'next/server'

/**
 * Health Check Endpoint
 * 
 * This endpoint is used by Docker healthcheck to verify the container is running properly.
 * Returns 200 OK with status information.
 * 
 * @returns JSON response with health status
 */
export async function GET() {
  // You can add additional checks here:
  // - Database connectivity
  // - External service availability
  // - Memory usage
  // - Custom application health metrics
  
  try {
    return NextResponse.json(
      {
        status: 'healthy',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        environment: process.env.NODE_ENV,
      },
      { status: 200 }
    )
  } catch (error) {
    // If something goes wrong, return unhealthy status
    return NextResponse.json(
      {
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 503 }
    )
  }
}

