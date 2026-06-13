/**
 * Engagement Profile tracking per customer.
 *
 * Tracks per-channel open rates, best channel, best hour,
 * consecutive ignores, engagement timestamps, and total campaigns.
 */

export interface ChannelStats {
  sent: number
  opened: number
  clicked: number
  converted: number
  open_rate: number
}

export interface EngagementProfile {
  channels: Record<string, ChannelStats>
  best_channel: string | null
  best_hour: number | null
  consecutive_ignores: number
  last_engaged_at: string | null
  last_messaged_at: string | null
  total_campaigns: number
}

export type EngagementEvent =
  | 'sent'
  | 'delivered'
  | 'opened'
  | 'clicked'
  | 'converted'
  | 'failed'
  | 'ignored'

export function createDefaultProfile(): EngagementProfile {
  return {
    channels: {},
    best_channel: null,
    best_hour: null,
    consecutive_ignores: 0,
    last_engaged_at: null,
    last_messaged_at: null,
    total_campaigns: 0,
  }
}

function ensureChannel(profile: EngagementProfile, channel: string): void {
  if (!profile.channels[channel]) {
    profile.channels[channel] = {
      sent: 0,
      opened: 0,
      clicked: 0,
      converted: 0,
      open_rate: 0,
    }
  }
}

function recalcOpenRate(stats: ChannelStats): void {
  stats.open_rate = stats.sent > 0 ? Math.round((stats.opened / stats.sent) * 100) / 100 : 0
}

function findBestChannel(channels: Record<string, ChannelStats>): string | null {
  let best: string | null = null
  let bestRate = -1

  for (const [ch, stats] of Object.entries(channels)) {
    if (stats.sent >= 1 && stats.open_rate > bestRate) {
      bestRate = stats.open_rate
      best = ch
    }
  }

  return best
}

function extractHour(timestamp: string | Date): number {
  const d = typeof timestamp === 'string' ? new Date(timestamp) : timestamp
  return d.getHours()
}

/**
 * Update a customer's engagement profile based on an event.
 *
 * @param currentProfile - The existing engagement profile (JSON from DB)
 * @param event          - The engagement event type
 * @param channel        - The channel (email, sms, push, etc.)
 * @param timestamp      - When the event occurred
 * @returns              - The updated engagement profile
 */
export function updateEngagementProfile(
  currentProfile: unknown,
  event: EngagementEvent,
  channel: string,
  timestamp: string | Date
): EngagementProfile {
  // Parse existing profile or create default
  let profile: EngagementProfile

  if (currentProfile && typeof currentProfile === 'object' && 'channels' in (currentProfile as Record<string, unknown>)) {
    profile = JSON.parse(JSON.stringify(currentProfile)) as EngagementProfile
  } else if (typeof currentProfile === 'string') {
    try {
      const parsed = JSON.parse(currentProfile)
      profile = parsed.channels ? (parsed as EngagementProfile) : createDefaultProfile()
    } catch {
      profile = createDefaultProfile()
    }
  } else {
    profile = createDefaultProfile()
  }

  // Ensure channel stats exist
  ensureChannel(profile, channel)
  const channelStats = profile.channels[channel]
  const ts = typeof timestamp === 'string' ? timestamp : timestamp.toISOString()

  switch (event) {
    case 'sent':
      channelStats.sent += 1
      profile.last_messaged_at = ts
      profile.total_campaigns += 1
      recalcOpenRate(channelStats)
      break

    case 'delivered':
      // No stat changes beyond tracking
      break

    case 'opened':
      channelStats.opened += 1
      recalcOpenRate(channelStats)
      profile.consecutive_ignores = 0
      profile.last_engaged_at = ts
      profile.best_hour = extractHour(timestamp)
      break

    case 'clicked':
      channelStats.clicked += 1
      profile.consecutive_ignores = 0
      profile.last_engaged_at = ts
      profile.best_hour = extractHour(timestamp)
      break

    case 'converted':
      channelStats.converted += 1
      profile.consecutive_ignores = 0
      profile.last_engaged_at = ts
      break

    case 'failed':
      // Failed delivery doesn't count against engagement
      break

    case 'ignored':
      profile.consecutive_ignores += 1
      break
  }

  // Recalculate best channel
  profile.best_channel = findBestChannel(profile.channels)

  return profile
}
