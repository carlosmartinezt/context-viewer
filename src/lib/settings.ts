import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import type { Config } from './types'

/**
 * The handful of settings worth changing without editing a file and
 * restarting: which directory is served, and the agent's API key and model.
 * Persisted as JSON in DATA_DIR, outside whatever ROOT_DIR happens to be, so
 * switching the served tree can never make this file (or its neighbor, the
 * trash) part of what a viewer browses.
 *
 * Only keys a person has actually saved through the settings page live in
 * this file. Anything absent falls back to the environment, so `.env.local`
 * keeps working exactly as before for someone who never opens the page.
 */

function settingsPath(config: Config): string {
  return path.join(config.dataDir, 'settings.json')
}

/**
 * The shape of settings.json. Deliberately not Partial<Config>: the stored
 * key for the served directory is `rootDir`, while the live config field is
 * `root`, and every other name here matches only by coincidence. Writing it
 * out is what stops the two drifting.
 */
export interface Persisted {
  rootDir?: string
  anthropicKey?: string
  model?: string
  username?: string
  passwordHash?: string
  sessionSecret?: string
  smtpHost?: string
  smtpUser?: string
  smtpPass?: string
  smtpFrom?: string
  smtpTo?: string
  smtpEhlo?: string
  smtpPort?: number
  smtpSecure?: boolean
  alertsEnabled?: boolean
}

/** Shared with account.ts, which persists into the same file: one JSON store
 *  for everything a running instance has been configured with, rather than a
 *  settings file and a separate account file that can drift apart. */
export function readPersisted(config: Config): Persisted {
  try {
    return JSON.parse(fs.readFileSync(settingsPath(config), 'utf8'))
  } catch {
    return {}
  }
}

export function persist(config: Config, patch: Persisted): void {
  const current = readPersisted(config)
  const next = { ...current, ...patch }
  fs.mkdirSync(config.dataDir, { recursive: true, mode: 0o700 })
  fs.writeFileSync(settingsPath(config), JSON.stringify(next, null, 2), { mode: 0o600 })
}

/**
 * Called once at boot, after makeConfig(): layers persisted settings over the
 * env-derived defaults and mutates `config` in place. Every module holds the
 * same config object, not a copy, so this is the only place that needs to
 * know persisted settings exist.
 *
 * A missing root or account is no longer a boot failure: /_ctx/setup handles
 * both, so an instance with nothing configured yet still starts and serves
 * that one page.
 */
export function applySettings(config: Config): void {
  const saved = readPersisted(config)
  if (saved.rootDir) config.root = saved.rootDir
  if (typeof saved.anthropicKey === 'string') config.anthropicKey = saved.anthropicKey
  // Alert settings, loaded the same way as every other persisted field. Like
  // sessionSecret, these must load here and nowhere else, so no caller can
  // end up with a different view of them than the running server has.
  const text = ['smtpHost', 'smtpUser', 'smtpPass', 'smtpFrom', 'smtpTo', 'smtpEhlo'] as const
  for (const key of text) {
    const value = saved[key]
    if (typeof value === 'string') config[key] = value
  }
  if (typeof saved.smtpPort === 'number') config.smtpPort = saved.smtpPort
  if (typeof saved.smtpSecure === 'boolean') config.smtpSecure = saved.smtpSecure
  if (typeof saved.alertsEnabled === 'boolean') config.alertsEnabled = saved.alertsEnabled
  if (saved.model) config.model = saved.model
  if (saved.username) config.username = saved.username
  if (saved.passwordHash) config.passwordHash = saved.passwordHash
  if (saved.sessionSecret) config.sessionSecret = saved.sessionSecret
}

/** Expands a leading ~ the way a shell would, since that is what someone will
 *  type into the field. Everything else must already be absolute: resolving
 *  a bare relative path against the app's own directory would silently point
 *  the viewer at itself instead of what was meant. */
function expandHome(p: string): string {
  if (p === '~') return os.homedir()
  if (p.startsWith('~/')) return path.join(os.homedir(), p.slice(2))
  return p
}

/**
 * Validates and applies a new root, or throws with a message fit to show the
 * person who typed it. Does not touch the settings file until the directory
 * is confirmed to exist, so a typo cannot leave the app pointed at nothing.
 */
export async function setRoot(config: Config, rawPath: string): Promise<void> {
  const expanded = expandHome(String(rawPath || '').trim())
  if (!path.isAbsolute(expanded)) {
    throw new Error('Use an absolute path, or one starting with ~ (e.g. ~/notes).')
  }
  const real = await fs.promises.realpath(expanded).catch(() => {
    throw new Error(`No such directory: ${expanded}`)
  })
  const st = await fs.promises.stat(real)
  if (!st.isDirectory()) throw new Error(`Not a directory: ${real}`)
  await fs.promises.access(real, fs.constants.R_OK).catch(() => {
    throw new Error(`Not readable: ${real}`)
  })
  config.root = real
  persist(config, { rootDir: real })
}

/** Empty string clears the key (disables the agent) rather than being
 *  ignored, so "save with the field blank" is a deliberate way to turn it
 *  off, not a no-op that silently keeps the old key. */
export function setAnthropicKey(config: Config, key: string): void {
  config.anthropicKey = String(key || '').trim()
  persist(config, { anthropicKey: config.anthropicKey })
}

export function setModel(config: Config, model: string): void {
  const trimmed = String(model || '').trim()
  if (!trimmed) return
  config.model = trimmed
  persist(config, { model: trimmed })
}

/** For the settings page: never the key itself, just enough to confirm it is
 *  set without putting a secret back into rendered HTML. */
export function maskKey(key: string): string | null {
  if (!key) return null
  return key.length <= 8 ? '••••' : `${key.slice(0, 3)}…${key.slice(-4)}`
}

/** What the two alert forms may send. Every field is optional: the settings
 *  page posts the whole form, /_ctx/setup posts only what was filled in. */
export interface AlertPatch {
  smtpHost?: string
  smtpUser?: string
  smtpFrom?: string
  smtpTo?: string
  smtpEhlo?: string
  smtpPass?: string
  smtpPort?: string | number
  smtpSecure?: boolean
  alertsEnabled?: boolean
}

/** Alert settings, from /_ctx/setup or /_ctx/settings. A blank password means "leave
 *  the stored one alone", so the settings form does not have to re-send a
 *  secret it never displays. */
export function setAlerts(config: Config, patch: AlertPatch): string[] {
  const fields: Persisted = {}
  const text = ['smtpHost', 'smtpUser', 'smtpFrom', 'smtpTo', 'smtpEhlo'] as const
  for (const key of text) {
    const value = patch[key]
    if (typeof value === 'string') fields[key] = config[key] = value.trim()
  }
  if (patch.smtpPass) fields.smtpPass = config.smtpPass = patch.smtpPass
  if (patch.smtpPort) fields.smtpPort = config.smtpPort = Number(patch.smtpPort)
  if (typeof patch.smtpSecure === 'boolean') fields.smtpSecure = config.smtpSecure = patch.smtpSecure
  if (typeof patch.alertsEnabled === 'boolean') fields.alertsEnabled = config.alertsEnabled = patch.alertsEnabled
  if (Object.keys(fields).length) persist(config, fields)
  return Object.keys(fields)
}
