/**
 * Redis Client Utilities
 *
 * Provides Redis client initialization and caching utilities for the admin dashboard.
 * Uses Upstash Redis for serverless environments with fail-open strategy.
 *
 * Environment variables:
 * - UPSTASH_REDIS_REST_URL: Upstash Redis REST endpoint
 * - UPSTASH_REDIS_REST_TOKEN: Upstash authentication token
 * - STATS_CACHE_TTL: Cache TTL in seconds (default: 300)
 */

import { Redis } from '@upstash/redis'

// ============================================
// Redis Client
// ============================================

let redis: Redis | null = null

/**
 * Get the Redis client instance (lazy initialization)
 * Returns null if Upstash credentials are not configured
 */
export function getRedisClient(): Redis | null {
  if (redis) return redis

  const url = process.env.UPSTASH_REDIS_REST_URL
  const token = process.env.UPSTASH_REDIS_REST_TOKEN

  // Return null if credentials not configured (allows development without Upstash)
  if (!url || !token) {
    console.warn('Redis credentials not configured - caching disabled')
    return null
  }

  redis = new Redis({ url, token })
  return redis
}

// ============================================
// Cache Keys
// ============================================

export const CACHE_KEYS = {
  ADMIN_STATS_DETAILED: 'admin:stats:detailed',
} as const

// ============================================
// Cache TTL
// ============================================

/**
 * Get cache TTL from environment or use default (300 seconds / 5 minutes)
 */
export function getStatsCacheTTL(): number {
  return parseInt(process.env.STATS_CACHE_TTL || '300', 10)
}

// ============================================
// Cache Operations
// ============================================

/**
 * Get cached value from Redis
 *
 * @param key - Cache key
 * @returns Cached value or null if not found/error
 */
export async function getCached<T>(key: string): Promise<T | null> {
  const client = getRedisClient()
  if (!client) return null

  try {
    const cached = await client.get(key)
    if (!cached) return null

    // Upstash Redis returns parsed JSON automatically
    return cached as T
  } catch (error) {
    console.error('Cache read failed:', error)
    return null
  }
}

/**
 * Set cached value in Redis with TTL
 *
 * @param key - Cache key
 * @param value - Value to cache
 * @param ttl - Time to live in seconds
 */
export async function setCached<T>(
  key: string,
  value: T,
  ttl?: number
): Promise<void> {
  const client = getRedisClient()
  if (!client) return

  const cacheTTL = ttl ?? getStatsCacheTTL()

  try {
    await client.setex(key, cacheTTL, JSON.stringify(value))
  } catch (error) {
    console.error('Cache write failed:', error)
  }
}

/**
 * Invalidate (delete) a cache key
 *
 * @param key - Cache key to invalidate
 */
export async function invalidateCache(key: string): Promise<void> {
  const client = getRedisClient()
  if (!client) return

  try {
    await client.del(key)
    console.log(`Cache invalidated: ${key}`)
  } catch (error) {
    console.error('Cache invalidation failed:', error)
  }
}

// ============================================
// Admin Stats Cache Helpers
// ============================================

/**
 * Invalidate admin stats cache
 * Call this after user/course/enrollment/submission mutations
 */
export async function invalidateAdminStats(): Promise<void> {
  await invalidateCache(CACHE_KEYS.ADMIN_STATS_DETAILED)
}
