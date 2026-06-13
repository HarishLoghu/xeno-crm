/**
 * Health Score System for Customer Lifecycle Management
 *
 * Decay Rules:
 *  -15  → 3 consecutive ignores (no open/click on last 3 messages)
 *  -10  → Unopened after 48 hours
 *  -20  → Unsubscribed
 *   -5  → Over-messaging (3+ messages in last 7 days)
 *
 * Growth Rules:
 *  +10  → Click
 *  +15  → Convert
 *   +5  → Open
 *  +20  → 30-day recovery (re-engaged after 30 days of inactivity)
 *
 * Labels:
 *  Healthy  → 75–100
 *  At Risk  → 40–74
 *  Burned   → 0–39
 */

export type HealthEvent =
  | 'open'
  | 'click'
  | 'convert'
  | 'ignore'
  | 'unsubscribe'
  | 'over_message'
  | 'unopened_48h'
  | 'recovery_30d'

export interface HealthContext {
  consecutiveIgnores?: number
  messagesSentLast7Days?: number
  lastEngagedAt?: Date | string | null
  hoursSinceLastMessage?: number
}

const DECAY_MAP: Record<string, number> = {
  ignore_3x: -15,
  unopened_48h: -10,
  unsubscribe: -20,
  over_message: -5,
}

const GROWTH_MAP: Record<string, number> = {
  click: 10,
  convert: 15,
  open: 5,
  recovery_30d: 20,
}

function clampScore(score: number): number {
  return Math.max(0, Math.min(100, score))
}

/**
 * Calculate the new health score based on an event and context.
 */
export function calculateHealthScore(
  currentScore: number,
  event: HealthEvent,
  context: HealthContext = {}
): number {
  let delta = 0

  switch (event) {
    case 'open':
      delta = GROWTH_MAP.open
      break

    case 'click':
      delta = GROWTH_MAP.click
      break

    case 'convert':
      delta = GROWTH_MAP.convert
      break

    case 'recovery_30d':
      delta = GROWTH_MAP.recovery_30d
      break

    case 'ignore': {
      const consecutiveIgnores = (context.consecutiveIgnores ?? 0) + 1
      if (consecutiveIgnores >= 3) {
        delta = DECAY_MAP.ignore_3x
      }
      break
    }

    case 'unopened_48h':
      delta = DECAY_MAP.unopened_48h
      break

    case 'unsubscribe':
      delta = DECAY_MAP.unsubscribe
      break

    case 'over_message': {
      const msgCount = context.messagesSentLast7Days ?? 0
      if (msgCount >= 3) {
        delta = DECAY_MAP.over_message
      }
      break
    }
  }

  return clampScore(currentScore + delta)
}

/**
 * Map a numeric health score to a human-readable label.
 */
export function getHealthLabel(score: number): string {
  if (score >= 75) return 'Healthy'
  if (score >= 40) return 'At Risk'
  return 'Burned'
}

/**
 * Determine whether a customer should be suppressed from campaigns.
 * Suppressed = Burned (score < 40).
 */
export function shouldSuppress(score: number): boolean {
  return score < 40
}
