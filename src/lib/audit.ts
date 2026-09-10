import fs from 'node:fs'
import path from 'node:path'
import type { Config, AuditRecord } from './types'

/**
 * Append-only JSONL. Every auth decision, every file served and every write
 * lands here. The writes are the reason this file matters more than it did on
 * the read-only site: it is the record of what the agent actually changed.
 */

let stream: fs.WriteStream | null = null

export function makeAudit(config: Config) {
  function getStream() {
    if (!stream) {
      fs.mkdirSync(path.dirname(config.auditLog), { recursive: true, mode: 0o700 })
      stream = fs.createWriteStream(config.auditLog, { flags: 'a', mode: 0o600 })
    }
    return stream
  }

  return function audit(record: AuditRecord) {
    const line = JSON.stringify({ ts: new Date().toISOString(), ...record }) + '\n'
    try {
      getStream().write(line)
    } catch (err) {
      console.error('[audit] write failed', err)
    }
  }
}
