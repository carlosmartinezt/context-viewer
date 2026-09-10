'use server'

import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { config, audit } from '@/server/runtime'
import { requester, sessionCookieOptions } from '@/server/session'
import { hasAccount, createAccount } from '@/lib/account'
import { setRoot, setAlerts } from '@/lib/settings'
import {
  verifyPassword, createSession, isLockedOut, recordFailure, clearFailures, safeEqual,
} from '@/lib/auth'
import { errorMessage } from '@/lib/errors'

export interface FormState {
  error?: string
  values?: Record<string, string>
}

/**
 * Both fields are required and both are checked, always. safeEqual on the
 * username and verifyPassword on the password both run whatever happens, so
 * neither the response time nor the message reveals which one was wrong.
 * Do not add an early return for an unknown username.
 */
export async function signIn(_prev: FormState, form: FormData): Promise<FormState> {
  const { ip, ua } = await requester()
  const username = String(form.get('username') || '')
  const password = String(form.get('password') || '')

  if (isLockedOut(ip)) {
    audit({ event: 'auth.lockout', ip, ua, username })
    return { error: 'Too many attempts. Try again later.', values: { username } }
  }

  const userOk = safeEqual(username, config.username)
  const passOk = verifyPassword(password, config.passwordHash)
  if (!userOk || !passOk) {
    recordFailure(config, ip)
    audit({ event: 'auth.failure', ip, ua, username })
    return { error: 'Wrong username or password.', values: { username } }
  }

  clearFailures(ip)
  const session = createSession(config)
  const jar = await cookies()
  jar.set({ ...sessionCookieOptions(session.maxAge), value: session.value })
  audit({ event: 'auth.success', ip, ua, username })
  redirect('/')
}

/**
 * Creates the one account this instance will ever have, and the directory it
 * serves if ROOT_DIR did not already fix one. Whoever completes this form
 * first gets the account, which is why the unit file and the README both say
 * to finish it before the port is reachable from anywhere but here.
 */
export async function completeSetup(_prev: FormState, form: FormData): Promise<FormState> {
  const { ip, ua } = await requester()
  if (hasAccount(config)) redirect('/_ctx/login')

  // Echoed back on failure so a typo in the password does not empty the eight
  // fields above it. The passwords themselves are never echoed.
  const keep = ['rootDir', 'username', 'smtpTo', 'smtpHost', 'smtpPort', 'smtpUser', 'smtpFrom']
  const values = Object.fromEntries(keep.map((k) => [k, String(form.get(k) || '')]))

  try {
    if (!config.root) await setRoot(config, String(form.get('rootDir') || ''))
    const password = String(form.get('password') || '')
    if (password !== String(form.get('confirmPassword') || '')) {
      throw new Error('Passwords do not match.')
    }
    // Alerts are optional, but a half-filled form is a mistake worth catching
    // here rather than at the first lockout nobody hears about.
    const smtpHost = String(form.get('smtpHost') || '').trim()
    const smtpTo = String(form.get('smtpTo') || '').trim()
    const wantsAlerts = Boolean(smtpHost || smtpTo)
    if (wantsAlerts && !smtpHost) throw new Error('Set an SMTP server, or clear the alert address to skip alerts.')
    if (wantsAlerts && !smtpTo) throw new Error('Set an address to send alerts to, or clear the SMTP server to skip alerts.')

    createAccount(config, String(form.get('username') || ''), password)
    if (wantsAlerts) {
      const smtpUser = String(form.get('smtpUser') || '')
      setAlerts(config, {
        smtpHost,
        smtpTo,
        smtpUser,
        smtpPort: String(form.get('smtpPort') || ''),
        smtpPass: String(form.get('smtpPass') || ''),
        smtpFrom: String(form.get('smtpFrom') || '').trim() || smtpUser.trim(),
        alertsEnabled: true,
      })
    }
  } catch (err) {
    return { error: errorMessage(err), values }
  }

  const session = createSession(config)
  const jar = await cookies()
  jar.set({ ...sessionCookieOptions(session.maxAge), value: session.value })
  audit({ event: 'setup.complete', ip, ua, username: config.username })
  redirect('/')
}

export async function signOut(): Promise<void> {
  const { ip, ua } = await requester()
  audit({ event: 'auth.logout', ip, ua })
  const jar = await cookies()
  jar.set({ ...sessionCookieOptions(0), value: '' })
  redirect('/_ctx/login')
}
