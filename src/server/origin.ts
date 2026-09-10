import 'server-only'
import { config, audit } from './runtime'

/**
 * CSRF defence for the JSON API. A state-changing POST must come from our own
 * pages. Server Actions get this from Next itself (see serverActions
 * .allowedOrigins in next.config.ts); these routes are checked here.
 *
 * Sec-Fetch-Site first. The browser sets it, page script cannot spoof it, and
 * unlike Origin it is unaffected by the referrer policy, which is exactly the
 * trap the old check fell into: a 'no-referrer' policy made same-origin form
 * posts send `Origin: null` and the app rejected its own logins.
 *
 *   same-origin  our own page posting to us
 *   none         typed in the address bar or a bookmark
 *   same-site    a sibling subdomain, which is not us
 *   cross-site   somebody else
 *
 * Returns a reason rather than a bare false, because a 403 with nothing in
 * the log is unfixable from the outside.
 */
export interface OriginCheck {
  ok: boolean
  reason?: string
  origin?: string
  expected?: string
}

export function checkOrigin(req: Request): OriginCheck {
  const fetchSite = req.headers.get('sec-fetch-site')
  if (fetchSite) {
    if (fetchSite === 'same-origin' || fetchSite === 'none') return { ok: true }
    return {
      ok: false,
      reason: `Sec-Fetch-Site: ${fetchSite}`,
      origin: req.headers.get('origin') || '(none)',
      expected: 'a page on this site',
    }
  }

  const origin = req.headers.get('origin')
  if (!origin) return { ok: true } // Same-origin form posts may omit it.

  let originHost: string
  try {
    originHost = new URL(origin).host
  } catch {
    return { ok: false, reason: 'Unparseable Origin', origin, expected: 'this site' }
  }

  // Host is whatever the proxy in front decided to forward, so an explicitly
  // configured origin wins over it when there is one.
  const forwarded = (req.headers.get('x-forwarded-host') || '').split(',')[0].trim()
  const candidates = [
    config.publicOrigin ? safeHost(config.publicOrigin) : '',
    forwarded,
    req.headers.get('host') || '',
  ].filter(Boolean)

  if (candidates.some((h) => h === originHost)) return { ok: true }
  return {
    ok: false,
    reason: 'Origin does not match',
    origin,
    expected: candidates.join(' or ') || '(nothing)',
  }
}

/** Accepts either a bare host or a full URL in PUBLIC_ORIGIN. */
function safeHost(value: string): string {
  try {
    return new URL(value.includes('://') ? value : `https://${value}`).host
  } catch {
    return ''
  }
}

/** Rejects, and leaves enough behind in the log to tell why. */
export function rejectOrigin(check: OriginCheck, where: string, ip: string, ua: string): Response {
  audit({
    event: 'origin.rejected',
    ip, ua, where,
    reason: check.reason,
    origin: check.origin,
    expected: check.expected,
  })
  return Response.json(
    { error: `Bad origin: saw ${check.origin}, expected ${check.expected}` },
    { status: 403 },
  )
}
