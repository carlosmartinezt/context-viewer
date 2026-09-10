import path from 'node:path'
import readline from 'node:readline/promises'
import { fileURLToPath } from 'node:url'
import { loadEnv, makeConfig } from '../src/lib/config.ts'
import { applySettings, persist } from '../src/lib/settings.ts'
import { hashPassword } from '../src/lib/auth.ts'

/**
 * The way back in when the password is gone. Local only: it needs the shell
 * account that owns _data/, which is the same trust boundary the settings
 * file already has, so it is no weaker a door than `cat settings.json`.
 *
 * Deliberately not a route. A "forgot password" endpoint on an app with one
 * account and no mail server is a second way in for everyone, to fix a
 * problem the owner can already solve from a shell.
 *
 * It resets the password and nothing else. The username is printed rather
 * than changed, because the usual reason to run this is having forgotten
 * which one it was.
 */
// Same three lines the server boots with, in the same order, so this script
// reads exactly the settings the running app does.
const appDir = path.dirname(path.dirname(fileURLToPath(import.meta.url)))
loadEnv(appDir)
const config = makeConfig(appDir)
applySettings(config)

if (!config.username) {
  console.log('No account exists. Start the app and it will boot into /_ctx/setup.')
  process.exit(0)
}

console.log(`Account: ${config.username}`)
const rl = readline.createInterface({ input: process.stdin, output: process.stdout })
const password = await rl.question('New password (at least 8 characters): ')
rl.close()

if (!password || password.length < 8) {
  console.error('\nToo short. Nothing was changed.')
  process.exit(1)
}

persist(config, { passwordHash: hashPassword(password) })
console.log(`\nPassword reset for ${config.username}.`)
console.log('Restart the app if it is running: systemctl --user restart context-viewer')
