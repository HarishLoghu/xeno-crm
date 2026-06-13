/**
 * Channel Router — picks the best channel for a given customer
 * based on their engagement profile and health score.
 *
 * Returns null if the customer should be suppressed entirely.
 */

import { shouldSuppress } from './health-score'
import type { EngagementProfile } from './engagement-profile'

const SUPPORTED_CHANNELS = ['email', 'sms', 'push'] as const
export type Channel = (typeof SUPPORTED_CHANNELS)[number]

const DEFAULT_CHANNEL: Channel = 'email'

interface CustomerForRouting {
  healthScore: number
  engagementProfile: unknown
}

function parseProfile(raw: unknown): EngagementProfile | null {
  if (!raw) return null

  if (typeof raw === 'string') {
    try {
      const parsed = JSON.parse(raw)
      return parsed.channels ? (parsed as EngagementProfile) : null
    } catch {
      return null
    }
  }

  if (typeof raw === 'object' && 'channels' in (raw as Record<string, unknown>)) {
    return raw as EngagementProfile
  }

  return null
}

/**
 * Pick the best channel for a customer based on their engagement profile.
 *
 * @param customer - Customer object with healthScore and engagementProfile
 * @returns The recommended channel, or null if the customer should be suppressed
 */
export function pickChannel(customer: CustomerForRouting): Channel | null {
  // Suppress burned customers
  if (shouldSuppress(customer.healthScore)) {
    return null
  }

  const profile = parseProfile(customer.engagementProfile)

  // No profile data → default to email
  if (!profile || !profile.channels || Object.keys(profile.channels).length === 0) {
    return DEFAULT_CHANNEL
  }

  // If the profile has a best_channel that we support, use it
  if (
    profile.best_channel &&
    SUPPORTED_CHANNELS.includes(profile.best_channel as Channel)
  ) {
    return profile.best_channel as Channel
  }

  // Otherwise, find the channel with the highest open rate among supported channels
  let bestChannel: Channel = DEFAULT_CHANNEL
  let bestOpenRate = -1

  for (const ch of SUPPORTED_CHANNELS) {
    const stats = profile.channels[ch]
    if (stats && stats.sent > 0 && stats.open_rate > bestOpenRate) {
      bestOpenRate = stats.open_rate
      bestChannel = ch
    }
  }

  return bestChannel
}
