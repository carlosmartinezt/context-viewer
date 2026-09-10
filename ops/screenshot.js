#!/usr/bin/env node
/**
 * Take the README screenshot, headless, with no dependencies.
 *
 * Drives Chrome over the DevTools Protocol using Node's built-in WebSocket,
 * because the one thing a plain `--screenshot` cannot do is arrive already
 * signed in, and every page worth showing is behind the login.
 *
 *   node ops/screenshot.js <url> <session-cookie-value> <out.png> [width] [height]
 *
 * Point it at an instance serving a directory you are happy to publish. The
 * shipped image shows this repo viewing its own source, deliberately: the
 * screenshot of a file browser is a screenshot of somebody's files.
 */

import { spawn } from 'node:child_process'
import fs from 'node:fs'

const [, , url, cookie, out, w = '1440', h = '900'] = process.argv
if (!url || !cookie || !out) {
  console.error('usage: screenshot.js <url> <cookie-value> <out.png> [width] [height]')
  process.exit(1)
}

const chrome = spawn('google-chrome', [
  '--headless=new',
  '--remote-debugging-port=9333',
  '--no-sandbox',
  '--hide-scrollbars',
  `--window-size=${w},${h}`,
  'about:blank',
], { stdio: 'ignore' })

const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

async function endpoint() {
  for (let i = 0; i < 40; i++) {
    try {
      const list = await fetch('http://127.0.0.1:9333/json').then((r) => r.json())
      const page = list.find((t) => t.type === 'page')
      if (page) return page.webSocketDebuggerUrl
    } catch {}
    await sleep(250)
  }
  throw new Error('Chrome did not come up')
}

const ws = new WebSocket(await endpoint())
await new Promise((r) => { ws.onopen = r })

let id = 0
const pending = new Map()
ws.onmessage = (e) => {
  const msg = JSON.parse(e.data)
  if (msg.id && pending.has(msg.id)) pending.get(msg.id)(msg.result)
}
const send = (method, params = {}) => new Promise((resolve) => {
  const n = ++id
  pending.set(n, resolve)
  ws.send(JSON.stringify({ id: n, method, params }))
})

const { host, protocol, pathname } = new URL(url)
await send('Network.enable')
await send('Network.setCookie', {
  name: protocol === 'https:' ? '__Host-cv_session' : 'cv_session',
  value: cookie,
  domain: host.split(':')[0],
  path: '/',
  secure: protocol === 'https:',
})
await send('Page.enable')
await send('Page.navigate', { url })
await sleep(2500)                     // fonts, the tree, and the minimap clone
const shot = await send('Page.captureScreenshot', { format: 'png' })
fs.writeFileSync(out, Buffer.from(shot.data, 'base64'))

ws.close()
chrome.kill()
console.log(`${out} (${(fs.statSync(out).size / 1024).toFixed(0)} KB) from ${pathname}`)
process.exit(0)
