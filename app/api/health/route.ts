import { NextResponse } from 'next/server';

export async function GET() {
  try {
    // Check database connection if needed
    // const db = await checkDatabaseConnection();
    
    return NextResponse.json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      // dbStatus: db ? 'connected' : 'disconnected',
    }, { status: 200 });
  } catch (error) {
    console.error('Health check failed:', error);
    return NextResponse.json(
      { 
        status: 'error',
        error: error instanceof Error ? error.message : 'Service Unavailable',
        timestamp: new Date().toISOString()
      },
      { status: 503 }
    );
  }
}

// Mark this route as edge-friendly for faster responses
export const runtime = 'edge';

// Optional: Add revalidation settings if needed
export const revalidate = 0; // No caching for health checks
