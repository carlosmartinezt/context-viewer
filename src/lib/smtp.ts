import net from 'node:net'
import tls from 'node:tls'
import type { Socket } from 'node:net'

/**
 * SMTP, hand-rolled, because the no-dependency rule is load-bearing and a
 * mail library is a large amount of other people's code sitting next to a
 * tree of personal documents. This is the subset that sends one small text message
 * to one server: EHLO, STARTTLS, AUTH, MAIL FROM, RCPT TO, DATA, QUIT.
 *
 * Not implemented on purpose: attachments, MIME multipart, HTML bodies,
 * connection pooling, queueing, DSN, pipelining. Alerts are plain text and
 * one recipient. If something here needs to grow, check first whether the
 * alert can shrink instead.
 *
 * Two transports:
 *   port 465  implicit TLS, encrypted from the first byte
 *   port 587  plaintext connect, then STARTTLS upgrade (the default)
 * Plaintext without an upgrade is refused: credentials and the subject line
 * of a security alert are not going out in the clear.
 */

const CRLF = '\r\n'

/**
 * One SMTP conversation. Replies are queued rather than delivered straight to
 * a waiter, because the server speaks first: on an implicit-TLS connection the
 * 220 greeting can land before the code that wants it has asked, and a reply
 * handed to nobody is a hang. So completed replies go into `replies` and
 * `expect()` drains that queue before it agrees to wait.
 */
interface Waiter {
  resolve: (reply: string) => void
  reject: (err: Error) => void
  expect: number[]
  label: string
}

function converse(socket: Socket) {
  const replies: string[] = []   // complete replies received but not yet consumed
  let waiter: Waiter | null = null   // set while someone is waiting for a reply
  let failure: Error | null = null   // set once, so a late expect() rejects rather than hangs
  let buffer = ''
  let done = false

  const fail = (err: unknown) => {
    const e = err instanceof Error ? err : new Error(String(err))
    if (failure) return
    failure = e
    if (waiter) { const w = waiter; waiter = null; w.reject(e) }
    if (!done) socket.destroy()
  }

  const settle = () => {
    if (!waiter || !replies.length) return
    const w = waiter
    // Guarded by the length check above, but the compiler cannot see that
    // through shift(), and a wrong assertion here would be a hang.
    const reply = replies.shift()
    if (reply === undefined) return
    waiter = null
    const code = Number(reply.slice(0, 3))
    if (w.expect && !w.expect.includes(code)) {
      return fail(new Error(`SMTP ${w.label} failed: ${reply.trim()}`))
    }
    w.resolve(reply)
  }

  socket.setEncoding('utf8')
  socket.on('error', fail)
  socket.on('close', () => { if (!done) fail(new Error('SMTP connection closed early')) })
  socket.on('data', (chunk: string) => {
    buffer += chunk
    // A reply ends with "250 text". "250-text" is a continuation line, which
    // is how EHLO returns its capability list, so the whole block is one reply.
    for (;;) {
      const lines = buffer.split(CRLF)
      let end = -1
      for (let i = 0; i < lines.length; i++) {
        if (/^\d{3} /.test(lines[i])) { end = i; break }
      }
      if (end < 0) return
      replies.push(lines.slice(0, end + 1).join(CRLF))
      buffer = lines.slice(end + 1).join(CRLF)
      settle()
    }
  })

  const expect = (codes: number[], label: string) => new Promise<string>((resolve, reject) => {
    if (failure) return reject(failure)
    waiter = { resolve, reject, expect: codes, label }
    settle()
  })

  const send = (line: string, codes: number[], label: string) => {
    const p = expect(codes, label)
    socket.write(line + CRLF)
    return p
  }

  return {
    expect,
    send,
    /** Hands the queue and the raw socket to the next conversation, used when
     *  STARTTLS replaces the socket underneath us. */
    finish: () => { done = true; socket.removeAllListeners('data'); socket.removeAllListeners('close'); socket.removeAllListeners('error') },
  }
}

/** Just the fields sending one message needs. The whole Config satisfies it,
 *  and so does the copy sendTest() makes with a different recipient. */
export interface MailSettings {
  smtpHost: string
  smtpPort: number
  smtpSecure?: string | boolean
  smtpUser: string
  smtpPass: string
  smtpFrom: string
  smtpTo: string
  smtpEhlo: string
  smtpTimeoutMs: number
}

function b64(s: string) { return Buffer.from(String(s), 'utf8').toString('base64') }

/**
 * Headers are the one place a caller's string reaches the protocol, so
 * anything that could start a new header line is stripped. Without this a
 * subject containing a newline could inject Bcc: and turn an alert into a
 * relay.
 */
function headerSafe(value: string): string {
  return String(value).replace(/[\r\n]+/g, ' ').trim()
}

/** Lines beginning with a dot are escaped, or they end DATA early. */
function dotStuff(body: string): string {
  return String(body).replace(/\r?\n/g, CRLF).replace(/^\./gm, '..')
}

export async function sendMail(
  settings: MailSettings,
  { subject, text }: { subject: string; text: string },
): Promise<boolean> {
  const host = settings.smtpHost
  const port = Number(settings.smtpPort || 587)
  const user = settings.smtpUser || ''
  const pass = settings.smtpPass || ''
  const from = settings.smtpFrom || user
  const to = settings.smtpTo || ''
  if (!host || !from || !to) throw new Error('SMTP is not configured.')

  const timeoutMs = Number(settings.smtpTimeoutMs || 15000)
  // Implicit TLS is a property of the server, not of the port number. 465 is
  // the convention so it is the default, but a server on a non-standard port
  // is a real thing and guessing wrong means connecting in plaintext to a TLS
  // listener and hanging until the timeout.
  const implicitTls = settings.smtpSecure === undefined || settings.smtpSecure === null || settings.smtpSecure === ''
    ? port === 465
    : Boolean(settings.smtpSecure)

  let socket = implicitTls
    ? tls.connect({ host, port, servername: host })
    : net.connect({ host, port })
  socket.setTimeout(timeoutMs, () => socket.destroy(new Error('SMTP timed out')))

  await new Promise((resolve, reject) => {
    socket.once(implicitTls ? 'secureConnect' : 'connect', resolve)
    socket.once('error', reject)
  })

  let c = converse(socket)
  await c.expect([220], 'greeting')
  const ehloName = settings.smtpEhlo || 'localhost'
  let caps = await c.send(`EHLO ${headerSafe(ehloName)}`, [250], 'EHLO')

  if (!implicitTls) {
    if (!/STARTTLS/i.test(caps)) throw new Error('Server does not offer STARTTLS; refusing to send in the clear.')
    await c.send('STARTTLS', [220], 'STARTTLS')
    c.finish()
    const secure = tls.connect({ socket, servername: host })
    await new Promise((resolve, reject) => {
      secure.once('secureConnect', resolve)
      secure.once('error', reject)
    })
    socket = secure
    socket.setTimeout(timeoutMs, () => socket.destroy(new Error('SMTP timed out')))
    c = converse(socket)
    caps = await c.send(`EHLO ${headerSafe(ehloName)}`, [250], 'EHLO after STARTTLS')
  }

  if (user && pass) {
    if (/AUTH[ =-][^\r\n]*PLAIN/i.test(caps)) {
      await c.send(`AUTH PLAIN ${b64(`\0${user}\0${pass}`)}`, [235], 'AUTH PLAIN')
    } else if (/AUTH[ =-][^\r\n]*LOGIN/i.test(caps)) {
      await c.send('AUTH LOGIN', [334], 'AUTH LOGIN')
      await c.send(b64(user), [334], 'AUTH username')
      await c.send(b64(pass), [235], 'AUTH password')
    } else {
      throw new Error('Server offers no supported AUTH mechanism (PLAIN or LOGIN).')
    }
  }

  await c.send(`MAIL FROM:<${headerSafe(from)}>`, [250], 'MAIL FROM')
  await c.send(`RCPT TO:<${headerSafe(to)}>`, [250, 251], 'RCPT TO')
  await c.send('DATA', [354], 'DATA')

  const headers = [
    `From: ${headerSafe(from)}`,
    `To: ${headerSafe(to)}`,
    `Subject: ${headerSafe(subject)}`,
    `Date: ${new Date().toUTCString()}`,
    `Message-ID: <${Date.now()}.${Math.random().toString(36).slice(2)}@${headerSafe(ehloName)}>`,
    'MIME-Version: 1.0',
    'Content-Type: text/plain; charset=utf-8',
    'Auto-Submitted: auto-generated',
  ].join(CRLF)

  await c.send(`${headers}${CRLF}${CRLF}${dotStuff(text)}${CRLF}.`, [250], 'message body')
  socket.write(`QUIT${CRLF}`)
  c.finish()
  socket.end()
  return true
}
