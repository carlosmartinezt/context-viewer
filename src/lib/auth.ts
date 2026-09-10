import crypto from 'node:crypto'
import type { Config } from './types'

/**
 * Hand-rolled on node:crypto rather than a session library: scrypt for the
 * password, HMAC-SHA256 for the cookie, timing-safe compares. This path now
 * guards writes as well as reads, so the dependency surface stays at zero.
 *
 * Lifted from the site's lib/auth.ts, including the cookie format, so an
 * existing PASSWORD_HASH and SESSION_SECRET keep working here unchanged.
 */

export const SESSION_COOKIE = '__Host-cv_session'

/** What is inside a session cookie once its signature has been checked. */
export interface SessionPayload {
  sub: string
  sid: string
  iat: number
  exp: number
}

/**
 * Format: scrypt:N:r:p:saltB64:hashB64
 * Colon-separated, not the usual $-separated PHC string: some env loaders read
 * $16384 as a variable and silently truncate the hash into a login that always
 * fails. Colons have no such meaning and base64 never produces one.
 */
export function hashPassword(password: string): string {
  const N = 16384, r = 8, p = 1, keylen = 32
  const salt = crypto.randomBytes(16)
  const hash = crypto.scryptSync(password.normalize('NFKC'), salt, keylen, { N, r, p })
  return `scrypt:${N}:${r}:${p}:${salt.toString('base64')}:${hash.toString('base64')}`
}

export function verifyPassword(password: string, stored: string): boolean {
  try {
    const [scheme, nStr, rStr, pStr, saltB64, hashB64] = String(stored).split(':')
    if (scheme !== 'scrypt') return false
    const salt = Buffer.from(saltB64, 'base64')
    const expected = Buffer.from(hashB64, 'base64')
    const actual = crypto.scryptSync(password.normalize('NFKC'), salt, expected.length, {
      N: Number(nStr), r: Number(rStr), p: Number(pStr),
    })
    return crypto.timingSafeEqual(actual, expected)
  } catch {
    return false
  }
}

export function safeEqual(a: string, b: string): boolean {
  const ab = Buffer.from(String(a)), bb = Buffer.from(String(b))
  if (ab.length !== bb.length) {
    crypto.timingSafeEqual(ab, ab)
    return false
  }
  return crypto.timingSafeEqual(ab, bb)
}

export function createSession(config: Config) {
  const now = Math.floor(Date.now() / 1000)
  const payload = {
    sub: config.username,
    sid: crypto.randomBytes(16).toString('hex'),
    iat: now,
    exp: now + config.sessionTtlSeconds,
  }
  const body = Buffer.from(JSON.stringify(payload)).toString('base64url')
  const sig = crypto.createHmac('sha256', config.sessionSecret).update(body).digest('base64url')
  return { value: `${body}.${sig}`, maxAge: config.sessionTtlSeconds }
}

export function verifySession(config: Config, cookie: string | undefined): SessionPayload | null {
  if (!cookie) return null
  const dot = cookie.lastIndexOf('.')
  if (dot <= 0) return null
  const body = cookie.slice(0, dot)
  const sig = cookie.slice(dot + 1)
  const expected = crypto.createHmac('sha256', config.sessionSecret).update(body).digest('base64url')
  if (!safeEqual(sig, expected)) return null
  try {
    const payload = JSON.parse(Buffer.from(body, 'base64url').toString('utf8')) as SessionPayload
    if (typeof payload.exp !== 'number' || payload.exp < Math.floor(Date.now() / 1000)) return null
    if (!safeEqual(payload.sub, config.username)) return null
    return payload
  } catch {
    return null
  }
}

// ── Lockout ───────────────────────────────────────────────────────────────
// In-process, so a restart clears it. The audit log is the durable record.

const failures = new Map()

export function isLockedOut(ip: string) {
  const s = failures.get(ip)
  if (!s) return 0
  const now = Date.now()
  return s.lockedUntil > now ? Math.ceil((s.lockedUntil - now) / 1000) : 0
}

/** Returns true when this failure is the one that triggers the lockout. */
export function recordFailure(config: Config, ip: string) {
  const now = Date.now()
  const s = failures.get(ip)
  if (!s || now - s.first > config.failureWindowSeconds * 1000) {
    failures.set(ip, { count: 1, first: now, lockedUntil: 0 })
    return false
  }
  s.count += 1
  if (s.count >= config.maxFailures) {
    Object.assign(s, { lockedUntil: now + config.lockoutSeconds * 1000, count: 0, first: now })
    return true
  }
  return false
}

export function clearFailures(ip: string) {
  failures.delete(ip)
}

/**
 * Caddy is the only thing in front of us, so the last XFF hop is the truth.
 * Takes the forwarded headers rather than a request object, because the two
 * callers hold different things: a route handler has a Request, a server
 * component has the headers() store.
 */
export function clientIp(headers: { get(name: string): string | null }): string {
  const xff = headers.get('x-forwarded-for')
  if (xff) {
    const parts = xff.split(',').map((s) => s.trim()).filter(Boolean)
    if (parts.length) return parts[parts.length - 1]
  }
  return headers.get('x-real-ip') || 'unknown'
}
