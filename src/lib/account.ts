import crypto from 'node:crypto'
import { hashPassword, verifyPassword } from './auth'
import { persist } from './settings'
import type { Config } from './types'
import type { Persisted } from './settings'

/**
 * The account: username and password hash. Empty means no account exists
 * yet, which is the state a fresh instance boots into. /_ctx/setup is the only
 * route that may create one, and it refuses once one exists — the same
 * first-visit-wins pattern Seq and a lot of other self-hosted tools use.
 * Changing the password afterward is a settings-page action that requires
 * the current one, not a second door into the same room.
 */

export function hasAccount(config: Config): boolean {
  return Boolean(config.username && config.passwordHash)
}

/**
 * Called once at boot, after applySettings() has already layered in a
 * persisted secret if one exists. A signing key with no account yet to
 * protect is still needed the moment someone completes /_ctx/setup, so a missing
 * one is generated and persisted immediately rather than waiting to be
 * asked. Nobody should have to run a command just to get a session cookie
 * to work.
 */
export function ensureSessionSecret(config: Config): void {
  if (config.sessionSecret) return
  const generated = crypto.randomBytes(32).toString('base64url')
  config.sessionSecret = generated
  persist(config, { sessionSecret: generated })
}

/**
 * Creates the one account this instance will ever have through /_ctx/setup.
 * Rechecked immediately before writing, after every other validation and
 * after the (synchronous, deliberately slow) password hash, which is the
 * point in the request where the smallest window for a second visitor to
 * win the same race remains. Throws rather than silently no-op, so the
 * caller's error handling is the only place "already set up" is decided.
 */
export function createAccount(config: Config, username: string, password: string): void {
  if (hasAccount(config)) throw new Error('An account already exists.')
  const u = String(username || '').trim()
  if (!u) throw new Error('Choose a username.')
  if (!password || password.length < 8) throw new Error('Password must be at least 8 characters.')

  const passwordHash = hashPassword(password)
  if (hasAccount(config)) throw new Error('An account already exists.')

  config.username = u
  config.passwordHash = passwordHash
  persist(config, { username: u, passwordHash })
}

/** Requires the current password, like changing a password on any account
 *  settings page does — the settings page is behind a session, but a
 *  session left open in an unlocked browser should not be enough on its own
 *  to hand the account to whoever is sitting at it. */
export function updateAccount(
  config: Config,
  { currentPassword, username, newPassword }: {
    currentPassword?: string
    username?: string
    newPassword?: string
  },
): string[] {
  if (!verifyPassword(String(currentPassword || ''), config.passwordHash)) {
    throw new Error('Current password is wrong.')
  }
  const patch: Persisted = {}
  if (username && username.trim() && username.trim() !== config.username) {
    config.username = username.trim()
    patch.username = config.username
  }
  if (newPassword) {
    if (newPassword.length < 8) throw new Error('New password must be at least 8 characters.')
    config.passwordHash = hashPassword(newPassword)
    patch.passwordHash = config.passwordHash
  }
  if (Object.keys(patch).length) persist(config, patch)
  return Object.keys(patch)
}
