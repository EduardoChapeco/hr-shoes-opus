/**
 * rate-limiter.ts — Hr Shoes Commerce
 *
 * In-process token-bucket rate limiter keyed by IP address.
 * Used to protect auth endpoints against brute-force attacks.
 *
 * Design decisions:
 * - In-memory only (no Redis dependency). Resets on worker restart.
 *   This is acceptable for Cloudflare Workers where each isolate handles
 *   a subset of traffic; the goal is to slow down attackers, not guarantee
 *   perfect global state.
 * - Tracks FAILED attempts only. Successful logins reset the counter.
 * - Window is sliding (last N attempts within WINDOW_MS).
 */

const MAX_ATTEMPTS = 5;
const WINDOW_MS = 10 * 60 * 1000; // 10 minutes

interface AttemptRecord {
  timestamps: number[]; // timestamps of failed attempts within current window
}

const store = new Map<string, AttemptRecord>();

/** Prune expired timestamps from a record */
function pruneWindow(record: AttemptRecord, now: number): AttemptRecord {
  return {
    timestamps: record.timestamps.filter((t) => now - t < WINDOW_MS),
  };
}

/**
 * Check whether the given IP is currently rate-limited.
 * Returns `{ blocked: false }` if allowed, or
 * `{ blocked: true, retryAfterMs: number }` if blocked.
 */
export function checkRateLimit(ip: string): { blocked: boolean; retryAfterMs?: number } {
  const now = Date.now();
  const raw = store.get(ip);
  if (!raw) return { blocked: false };

  const record = pruneWindow(raw, now);
  store.set(ip, record);

  if (record.timestamps.length < MAX_ATTEMPTS) return { blocked: false };

  // Oldest failed attempt determines when the window expires
  const oldest = Math.min(...record.timestamps);
  const retryAfterMs = WINDOW_MS - (now - oldest);
  return { blocked: true, retryAfterMs: Math.max(retryAfterMs, 0) };
}

/**
 * Record a failed login attempt for the given IP.
 * Call this only after a confirmed authentication failure.
 */
export function recordFailedAttempt(ip: string): void {
  const now = Date.now();
  const raw = store.get(ip) ?? { timestamps: [] };
  const record = pruneWindow(raw, now);
  record.timestamps.push(now);
  store.set(ip, record);
}

/**
 * Clear the failed attempt counter for the given IP.
 * Call this after a successful login.
 */
export function resetAttempts(ip: string): void {
  store.delete(ip);
}

/**
 * Convert milliseconds to a human-readable "X minutos" / "X segundos" string.
 */
export function formatRetryAfter(ms: number): string {
  const seconds = Math.ceil(ms / 1000);
  if (seconds < 60) return `${seconds} segundo${seconds !== 1 ? "s" : ""}`;
  const minutes = Math.ceil(seconds / 60);
  return `${minutes} minuto${minutes !== 1 ? "s" : ""}`;
}
