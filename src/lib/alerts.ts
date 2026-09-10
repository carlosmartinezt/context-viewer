import fs from 'node:fs'
import { sendMail } from './smtp'
import type { Config, Audit, AuditRecord } from './types'

/**
 * Which audit events are worth waking someone up for, and the throttling that
 * keeps that promise honest.
 *
 * The audit log records everything; this records almost nothing. The log
 * showed 180KB of `auth.required` from bots in a day, so alerting on "someone
 * hit the door" would be a mail loop, not a warning. What is left is the set
 * where the honest answer to "was that you?" might be no:
 *
 *   auth.lockout          repeated failures from one IP tripped the lockout
 *   auth.success.new_ip   a login succeeded from an IP never seen before
 *   setup.complete        an account was created (only ever legitimate once)
 *   account.factory_reset every setting was wiped from a shell
 *   settings.changed      the root, the account or the key was changed
 *
 * Plain `auth.failure` is not here: one fat-fingered password should not send
 * mail, and five of them become a lockout, which does.
 */
const ALERT_EVENTS = new Set([
  'auth.lockout',
  'auth.success.new_ip',
  'setup.complete',
  'account.factory_reset',
  'settings.changed',
])

const SUBJECTS: Record<string, string> = {
  'auth.lockout': 'Login locked out after repeated failures',
  'auth.success.new_ip': 'Login from a new IP address',
  'setup.complete': 'An account was created',
  'account.factory_reset': 'Settings were factory reset',
  'settings.changed': 'Settings were changed',
}

export function makeAlerts(config: Config, audit: Audit) {
  // Which IPs have logged in successfully before. In-process, seeded from the
  // audit log at boot, so a restart does not alert on every familiar address.
  const knownIps = new Set<string>()
  // event -> last sent, so a flapping condition sends once and then rests.
  const lastSent = new Map<string, number>()
  let seeded = false

  function seedFromLog() {
    if (seeded) return
    seeded = true
    try {
      const raw = fs.readFileSync(config.auditLog, 'utf8')
      for (const line of raw.split('\n')) {
        if (!line.includes('auth.success')) continue
        try {
          const rec = JSON.parse(line)
          if (rec.event === 'auth.success' && rec.ip) knownIps.add(rec.ip)
        } catch {}
      }
    } catch {}
  }

  function configured() {
    return Boolean(config.alertsEnabled && config.smtpHost && config.smtpFrom && config.smtpTo)
  }

  function throttled(event: string): boolean {
    const now = Date.now()
    const window = Number(config.alertThrottleSeconds || 300) * 1000
    const prev = lastSent.get(event) || 0
    if (now - prev < window) return true
    lastSent.set(event, now)
    return false
  }

  function body(record: AuditRecord): string {
    const lines = [
      `Event:    ${record.event}`,
      `Time:     ${new Date().toISOString()}`,
      record.username ? `Username: ${record.username}` : '',
      record.ip ? `IP:       ${record.ip}` : '',
      record.ua ? `Agent:    ${record.ua}` : '',
      record.fields ? `Fields:   ${[record.fields].flat().join(', ')}` : '',
      record.reason ? `Reason:   ${record.reason}` : '',
      '',
      'This is an automated alert from context-viewer.',
      'The full record is in the audit log on the server.',
      config.alertsEnabled ? 'Turn these off in /_ctx/settings.' : '',
    ]
    return lines.filter(Boolean).join('\n')
  }

  /**
   * Fire and forget, always. A mail server being slow or down must never
   * make a login hang or a page fail to render, so nothing here is awaited
   * by the request path and every failure ends in the audit log instead of
   * an exception.
   */
  function notify(record: AuditRecord): void {
    let event = record.event
    if (event === 'auth.success') {
      seedFromLog()
      if (record.ip && !knownIps.has(record.ip)) {
        knownIps.add(record.ip)
        event = 'auth.success.new_ip'
      } else {
        if (record.ip) knownIps.add(record.ip)
        return
      }
    }
    if (!ALERT_EVENTS.has(event)) return
    if (!configured()) return
    if (throttled(event)) return

    const subject = `[context-viewer] ${SUBJECTS[event] || event}`
    sendMail(config, { subject, text: body({ ...record, event }) })
      .then(() => audit({ event: 'alert.sent', ip: 'local', ua: 'lib/alerts.js', alert: event }))
      .catch((err) => audit({ event: 'alert.failed', ip: 'local', ua: 'lib/alerts.js', alert: event, reason: err.message }))
  }

  return { notify, sendTest: (to?: string) => sendMail({ ...config, smtpTo: to || config.smtpTo }, {
    subject: '[context-viewer] Test alert',
    text: 'If you are reading this, alerts are configured correctly.\n\nSent from /_ctx/settings.',
  }) }
}
