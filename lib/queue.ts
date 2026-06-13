/**
 * BullMQ Queue Setup
 *
 * Provides a shared queue and Redis connection for background job processing.
 * Gracefully handles missing Redis configuration.
 */

import { Queue, type ConnectionOptions } from 'bullmq'

let connection: ConnectionOptions | null = null
let campaignQueue: Queue | null = null

function getRedisConnection(): ConnectionOptions | null {
  const redisUrl = process.env.REDIS_URL

  if (!redisUrl) {
    console.warn('[Queue] REDIS_URL not configured. Background jobs disabled.')
    return null
  }

  try {
    const url = new URL(redisUrl)
    return {
      host: url.hostname,
      port: parseInt(url.port || '6379', 10),
      password: url.password || undefined,
      username: url.username !== 'default' ? url.username : undefined,
    }
  } catch (err) {
    console.error('[Queue] Invalid REDIS_URL:', err)
    return null
  }
}

/**
 * Get or create the Redis connection options.
 */
export function getConnection(): ConnectionOptions | null {
  if (!connection) {
    connection = getRedisConnection()
  }
  return connection
}

/**
 * Get or create the campaign queue.
 * Returns null if Redis is not configured.
 */
export function getCampaignQueue(): Queue | null {
  if (campaignQueue) return campaignQueue

  const conn = getConnection()
  if (!conn) return null

  try {
    campaignQueue = new Queue('campaign-send', { connection: conn })
    return campaignQueue
  } catch (err) {
    console.error('[Queue] Failed to create campaign queue:', err)
    return null
  }
}

/**
 * Add a campaign send job to the queue.
 * Falls back to synchronous processing if Redis is unavailable.
 */
export async function enqueueCampaignSend(campaignId: string): Promise<boolean> {
  const queue = getCampaignQueue()
  if (!queue) {
    console.warn('[Queue] Redis unavailable. Campaign will be processed synchronously.')
    return false
  }

  try {
    await queue.add(
      'send-campaign',
      { campaignId },
      {
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 2000,
        },
        removeOnComplete: 100,
        removeOnFail: 50,
      }
    )
    return true
  } catch (err) {
    console.error('[Queue] Failed to enqueue campaign send:', err)
    return false
  }
}

export { Queue }
