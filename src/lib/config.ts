import path from 'node:path'
import fs from 'node:fs'

/**
 * Everything the viewer needs, from the environment, with defaults that make
 * sense for one person on one box.
 *
 * Nothing here is required any more. The first visit to a fresh instance
 * walks through /_ctx/setup (root directory, username, password), and the agent's
 * key and model are a settings-page field, not an env var to look up. Env
 * vars are still read and still win when present — a scripted or containered
 * deployment can seed all of this with no browser involved — but a person
 * running this by hand never has to.
 */

function env(name: string, fallback = ''): string {
  const v = process.env[name]
  return v === undefined || v === '' ? fallback : v
}

/** Load .env.local as plain KEY=value. No dotenv, no expansion, no surprises. */
export function loadEnv(dir: string): void {
  const file = path.join(dir, '.env.local')
  if (!fs.existsSync(file)) return
  for (const line of fs.readFileSync(file, 'utf8').split('\n')) {
    const t = line.trim()
    if (!t || t.startsWith('#')) continue
    const eq = t.indexOf('=')
    if (eq < 1) continue
    const key = t.slice(0, eq).trim()
    let value = t.slice(eq + 1).trim()
    if (value.startsWith('"') && value.endsWith('"')) value = value.slice(1, -1)
    if (process.env[key] === undefined) process.env[key] = value
  }
}

export function makeConfig(appDir: string) {
  const root = env('ROOT_DIR')
  // The one directory that cannot itself be a setting: settings.json, the
  // trash and the audit log all live under here, so it has to be resolvable
  // before any of those can be read. `_data`, next to the code, needs nobody
  // to configure anything to get a working instance.
  const dataDir = env('DATA_DIR', path.join(appDir, '_data'))
  return {
    appDir,
    /** The tree being served. Nothing outside it is ever read or written.
     *  Mutable at runtime: /_ctx/setup and /_ctx/settings change this in place, and
     *  every module closes over this same object rather than a copy. */
    root: root ? path.resolve(root) : '',
    dataDir,
    /**
     * Trash sits outside the root on purpose. Inside it, a deleted note would
     * stay in the git history, keep showing up in search, and still be one URL
     * away. Out here it is gone from the tree but recoverable by hand.
     */
    trashDir: env('TRASH_DIR', path.join(dataDir, 'trash')),
    auditLog: env('AUDIT_LOG', path.join(dataDir, 'audit.jsonl')),
    port: Number(env('PORT', '3064')),
    host: env('HOST', '127.0.0.1'),

    /** Set by /_ctx/setup, or by env for a scripted deployment. Empty means no
     *  account exists yet: see lib/account.js. */
    username: env('USERNAME', ''),
    passwordHash: env('PASSWORD_HASH', ''),
    /** Generated on first boot if not given, and persisted: see
     *  lib/account.js's ensureSessionSecret(). Nobody should have to run a
     *  command just to get a signing key. */
    sessionSecret: env('SESSION_SECRET', ''),
    sessionTtlSeconds: Number(env('SESSION_TTL_SECONDS', String(60 * 60 * 12))),
    maxFailures: Number(env('MAX_FAILURES', '5')),
    failureWindowSeconds: Number(env('FAILURE_WINDOW_SECONDS', '900')),
    lockoutSeconds: Number(env('LOCKOUT_SECONDS', '900')),
    /** The address browsers actually use, when a proxy rewrites Host. Only
     *  needed if the origin check rejects a legitimate form post: the error
     *  page says so and names the origin it saw. */
    publicOrigin: env('PUBLIC_ORIGIN', ''),
    /** Set when the app is behind TLS, so the cookie can carry __Host-. */
    secureCookie: env('SECURE_COOKIE', 'true') !== 'false',

    /** Writes are committed when the root is a git repo. Off makes them plain. */
    gitCommits: env('GIT_COMMITS', 'true') !== 'false',

    /** When set, every write, rename, delete and git mutation is refused at
     *  the one place they all go through (files.ts), regardless of what the
     *  UI offers. For a demo instance pointed at content nobody should be
     *  able to change. */
    readonly: env('READONLY', 'false') === 'true',

    /** Set by the settings page, or by env for a scripted deployment. */
    anthropicKey: env('ANTHROPIC_API_KEY', ''),
    /** Overridable so the agent can be pointed at a gateway, or at a stub. */
    apiUrl: env('ANTHROPIC_BASE_URL', 'https://api.anthropic.com') + '/v1/messages',
    model: env('MODEL', 'claude-opus-5'),

    /** Security alerts by email. All optional: with no smtpHost nothing is
     *  ever sent and every other feature works unchanged. Set at /_ctx/setup or
     *  /_ctx/settings, or by env for a scripted deployment. */
    alertsEnabled: env('ALERTS_ENABLED', 'true') !== 'false',
    smtpHost: env('SMTP_HOST', ''),
    smtpPort: Number(env('SMTP_PORT', '587')),
    /** Implicit TLS. Unset means "decide by port": 465 yes, anything else
     *  STARTTLS. Set it explicitly for a server on a non-standard port. */
    /** Genuinely three-valued: '' means "decide by port", true/false is an
     *  explicit choice saved from the settings page. */
    smtpSecure: env('SMTP_SECURE', '') as string | boolean,
    smtpUser: env('SMTP_USER', ''),
    smtpPass: env('SMTP_PASS', ''),
    smtpFrom: env('SMTP_FROM', ''),
    smtpTo: env('SMTP_TO', ''),
    smtpEhlo: env('SMTP_EHLO', 'localhost'),
    smtpTimeoutMs: Number(env('SMTP_TIMEOUT_MS', '15000')),
    alertThrottleSeconds: Number(env('ALERT_THROTTLE_SECONDS', '300')),
    maxTurns: Number(env('AGENT_MAX_TURNS', '12')),
  }
}
