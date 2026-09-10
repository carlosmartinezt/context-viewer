import readline from 'node:readline/promises'
import crypto from 'node:crypto'
import { hashPassword } from '../src/lib/auth.ts'

/** Prints the two secrets .env.local needs. Nothing is written for you: the
 *  file is yours to place, at mode 600. */
const rl = readline.createInterface({ input: process.stdin, output: process.stdout })
const password = await rl.question('New password: ')
rl.close()
console.log('\nPASSWORD_HASH=' + hashPassword(password))
console.log('SESSION_SECRET=' + crypto.randomBytes(32).toString('base64url'))
