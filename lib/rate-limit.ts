/**
 * Simple in-memory rate limiter.
 * Tracks timestamps of actions per key and enforces a max count within a window.
 */
const store = new Map<string, number[]>()

// Clean up old entries every 10 minutes
setInterval(() => {
  const now = Date.now()
  for (const [key, timestamps] of store) {
    const filtered = timestamps.filter((t) => now - t < 60 * 60 * 1000)
    if (filtered.length === 0) store.delete(key)
    else store.set(key, filtered)
  }
}, 10 * 60 * 1000)

/**
 * Check if an action is allowed and record it.
 * @returns `true` if allowed, `false` if rate-limited.
 */
export function rateLimit(key: string, maxPerWindow: number, windowMs: number): boolean {
  const now = Date.now()
  const timestamps = (store.get(key) ?? []).filter((t) => now - t < windowMs)

  if (timestamps.length >= maxPerWindow) {
    return false
  }

  timestamps.push(now)
  store.set(key, timestamps)
  return true
}
