import 'server-only'
import { cookies, headers } from 'next/headers'
import { redirect } from 'next/navigation'
import { config, audit } from './runtime'
import { hasAccount } from '@/lib/account'
import { SESSION_COOKIE, verifySession, clientIp } from '@/lib/auth'
import type { SessionPayload } from '@/lib/auth'

/**
 * __Host- requires Secure, so the prefix goes only when we are behind TLS.
 * Set and read both go through here: naming them separately is how you get a
 * login that appears to work and then forgets you on the next request.
 */
export function cookieName(): string {
  return config.secureCookie ? SESSION_COOKIE : SESSION_COOKIE.replace('__Host-', '')
}

export async function currentSession(): Promise<SessionPayload | null> {
  const jar = await cookies()
  return verifySession(config, jar.get(cookieName())?.value)
}

/** Who is asking, for the audit log. */
export async function requester(): Promise<{ ip: string; ua: string }> {
  const h = await headers()
  return {
    ip: clientIp(h),
    ua: (h.get('user-agent') || 'unknown').slice(0, 200),
  }
}

/**
 * The single gate. Every page and every route handler calls this first,
 * rather than a middleware matcher: a matcher is one careless pattern away
 * from exposing a route, and this app can write as well as read. Deliberately
 * not middleware, for that reason and no other.
 *
 * A fresh instance has no account, and then /_ctx/setup is the only reachable
 * page: everything else would otherwise show a form for credentials that
 * cannot possibly be right.
 */
export async function requireSession(path = '/'): Promise<SessionPayload> {
  if (!hasAccount(config)) redirect('/_ctx/setup')
  const session = await currentSession()
  if (!session) {
    const { ip, ua } = await requester()
    audit({ event: 'auth.required', ip, ua, path })
    redirect('/_ctx/login')
  }
  return session
}

/** The same gate for the JSON API, which answers 401 rather than redirecting. */
export async function requireSessionJson(): Promise<SessionPayload | null> {
  if (!hasAccount(config)) return null
  return currentSession()
}

export function sessionCookieOptions(maxAge: number) {
  return {
    name: cookieName(),
    path: '/',
    httpOnly: true,
    sameSite: 'strict' as const,
    secure: config.secureCookie,
    maxAge,
  }
}
