import 'server-only'
import path from 'node:path'
import { loadEnv, makeConfig } from '@/lib/config'
import { applySettings } from '@/lib/settings'
import { ensureSessionSecret } from '@/lib/account'
import { makeAudit } from '@/lib/audit'
import { makeAlerts } from '@/lib/alerts'
import { makeFiles } from '@/lib/files'
import { makeAgent } from '@/lib/agent'
import { makeGit } from '@/lib/git'
import { errorMessage } from '@/lib/errors'
import type { AuditRecord } from '@/lib/types'

/**
 * The one place the app is wired together, built once per process.
 *
 * Next may evaluate a module more than once across its server bundles, and
 * two audit streams or two copies of a mutable config would be a real bug:
 * /_ctx/settings writes fields in place and every module reads them at call time,
 * so a second copy would serve stale settings until the next restart. Hanging
 * the instance off globalThis is the documented way to survive that and dev's
 * hot reloading at the same time.
 */
function build() {
  const appDir = process.cwd()
  loadEnv(appDir)
  const config = makeConfig(appDir)
  applySettings(config)
  ensureSessionSecret(config)

  const writeAudit = makeAudit(config)
  // Alerts hang off the audit call rather than off each call site: every event
  // worth mailing about is already being logged, and one wrapper means a new
  // audited event can never be one somebody forgot to alert on.
  const alerts = makeAlerts(config, writeAudit)
  const audit = (record: AuditRecord): void => {
    writeAudit(record)
    try {
      alerts.notify(record)
    } catch (err) {
      writeAudit({ event: 'alert.failed', ip: 'local', ua: 'runtime', reason: errorMessage(err) })
    }
  }

  // One files instance, shared. It caches whether the root is a git repo,
  // keyed by config.root precisely because the root can change under it, and
  // a second instance would mean a second cache going stale on its own.
  const files = makeFiles(config, audit)

  return {
    config,
    audit,
    alerts,
    files,
    agent: makeAgent(config, files, audit),
    git: makeGit(config, audit),
  }
}

const globalForRuntime = globalThis as unknown as { contextViewer?: ReturnType<typeof build> }

export const runtime = globalForRuntime.contextViewer ?? build()
globalForRuntime.contextViewer = runtime

export const { config, audit, alerts, files, agent, git } = runtime

/** What to call the root in the breadcrumb: the directory's own name. */
export function rootName(): string {
  return path.basename(config.root) || '/'
}
