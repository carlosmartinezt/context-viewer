import fs from 'node:fs'
import path from 'node:path'
import readline from 'node:readline/promises'
import { fileURLToPath } from 'node:url'
import { loadEnv, makeConfig } from '../src/lib/config.ts'
import { applySettings } from '../src/lib/settings.ts'

/**
 * The way back in when the password is gone: forget every setting, so the
 * next visit boots into /_ctx/setup and the whole first-run flow happens in the
 * browser. Account, root directory, agent key, model and session secret all
 * go at once.
 *
 * Local only, and that is the point. An online "reset everything" is a door
 * anyone can open; this one needs the shell account that owns _data/, which
 * is the same trust boundary settings.json already sits behind.
 *
 * Two things it deliberately does NOT touch:
 *   - the tree it was serving. Resetting the app must never reach into a
 *     directory of personal documents. It forgets the path, it does not follow it.
 *   - the audit log and the trash. The log is the durable security record of
 *     what happened, including this reset, and the trash holds documents
 *     someone deleted but may still want. Neither is a setting.
 */
const appDir = path.dirname(path.dirname(fileURLToPath(import.meta.url)))
loadEnv(appDir)
const config = makeConfig(appDir)
applySettings(config)

const settingsFile = path.join(config.dataDir, 'settings.json')
if (!fs.existsSync(settingsFile)) {
  console.log('Nothing to reset: no settings.json. The app is already unconfigured.')
  process.exit(0)
}

console.log('Factory reset will forget:')
console.log(`  account         ${config.username || '(none)'}`)
console.log(`  root directory  ${config.root || '(none)'}`)
console.log(`  agent key       ${config.anthropicKey ? 'set' : '(none)'}`)
console.log(`  model           ${config.model || '(none)'}`)
console.log('  session secret  (every open session is signed out)')
console.log('\nIt will NOT touch:')
console.log(`  ${config.root || 'the served tree'}  (the documents themselves)`)
console.log(`  ${path.join(config.dataDir, 'audit.jsonl')}  (the audit log)`)
console.log(`  ${config.trashDir}  (the trash)`)

const rl = readline.createInterface({ input: process.stdin, output: process.stdout })
const answer = await rl.question('\nType "reset" to confirm: ')
rl.close()

if (answer.trim() !== 'reset') {
  console.error('\nNot confirmed. Nothing was changed.')
  process.exit(1)
}

// Written before the delete, not after: if the process dies mid-way the log
// still shows a reset was attempted. The username is recorded because after
// this line there is nothing left that remembers it.
// Appended synchronously, not through makeAudit(): that writes to a stream,
// and a script this short can exit before the stream flushes.
fs.mkdirSync(path.dirname(config.auditLog), { recursive: true, mode: 0o700 })
fs.appendFileSync(config.auditLog, JSON.stringify({
  ts: new Date().toISOString(),
  event: 'account.factory_reset',
  ip: 'local',
  ua: 'ops/factory-reset.js',
  username: config.username || '(none)',
  rootDir: config.root || '(none)',
}) + '\n', { mode: 0o600 })

// A backup, because "I meant the other instance" is a thing that happens and
// the agent key in particular is not something you can retype from memory.
const backup = `${settingsFile}.${new Date().toISOString().replace(/[:.]/g, '-')}.bak`
fs.copyFileSync(settingsFile, backup)
fs.chmodSync(backup, 0o600)
fs.rmSync(settingsFile)

console.log(`\nReset. Previous settings saved to:\n  ${backup}`)
console.log('\nRestart the app, then open it in a browser:')
console.log('  systemctl --user restart context-viewer')
console.log('Every page will redirect to /_ctx/setup, where you create the account')
console.log('and choose the directory to serve, as if for the first time.')
