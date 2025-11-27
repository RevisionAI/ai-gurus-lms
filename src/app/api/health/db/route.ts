import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'

const TIMEOUT_MS = 5000

export async function GET() {
  const startTime = Date.now()

  try {
    // Create a timeout promise
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('Database connection timeout')), TIMEOUT_MS)
    })

    // Race between the query and timeout
    await Promise.race([
      prisma.$queryRaw`SELECT 1`,
      timeoutPromise,
    ])

    const responseTime = Date.now() - startTime

    return NextResponse.json({
      status: 'healthy',
      database: 'connected',
      timestamp: new Date().toISOString(),
      responseTime: `${responseTime}ms`,
    })
  } catch (error) {
    const responseTime = Date.now() - startTime

    // Do NOT expose credentials or sensitive error details
    const errorMessage = error instanceof Error
      ? (error.message.includes('timeout') ? 'Connection timeout' : 'Database connection failed')
      : 'Database connection failed'

    return NextResponse.json(
      {
        status: 'unhealthy',
        database: 'disconnected',
        error: errorMessage,
        timestamp: new Date().toISOString(),
        responseTime: `${responseTime}ms`,
      },
      { status: 503 }
    )
  }
}
