'use server'

import { cookies } from 'next/headers'
import { revalidatePath } from 'next/cache'
import { config, audit, alerts } from '@/server/runtime'
import { requireSessionJson, requester, sessionCookieOptions } from '@/server/session'
import { updateAccount } from '@/lib/account'
import { setRoot, setAnthropicKey, setModel, setAlerts } from '@/lib/settings'
import { createSession } from '@/lib/auth'
import { errorMessage } from '@/lib/errors'

export interface SettingsState {
  message?: string
  isError?: boolean
}

/**
 * One action for all four forms. Each form posts only its own fields, so the
 * presence of a field is what decides which section was saved: the alert form
 * is detected by a field only it has, or saving the account form would clear
 * the SMTP settings it never submitted.
 */
export async function saveSettings(_prev: SettingsState, form: FormData): Promise<SettingsState> {
  if (!(await requireSessionJson())) return { message: 'Not signed in.', isError: true }
  const { ip, ua } = await requester()
  const changed: string[] = []
  let error = ''
  const str = (name: string) => String(form.get(name) || '')

  // Changing the username or the password requires the current password, even
  // behind a session: a session left open in an unlocked browser should not be
  // enough on its own to hand the account to whoever is sitting at it.
  if (form.has('currentPassword')) {
    try {
      const fields = updateAccount(config, {
        currentPassword: str('currentPassword'),
        username: str('newUsername'),
        newPassword: str('newPassword'),
      })
      changed.push(...fields)
      // The cookie's payload is checked against config.username, so a bare
      // username change would log out the very request that made it. A fresh
      // cookie goes back in the same response.
      if (fields.includes('username')) {
        const session = createSession(config)
        const jar = await cookies()
        jar.set({ ...sessionCookieOptions(session.maxAge), value: session.value })
      }
    } catch (err) {
      error = errorMessage(err)
    }
  }

  if (!error && form.has('rootDir')) {
    const next = str('rootDir')
    if (next.trim() && next.trim() !== config.root) {
      try {
        await setRoot(config, next)
        changed.push('rootDir')
      } catch (err) {
        error = errorMessage(err)
      }
    }
  }

  if (!error && form.has('anthropicKey')) {
    // Blank means "leave it alone": the field is never pre-filled with the
    // real value, so a blank submit is what happens when someone changes only
    // the model. Clearing it is a separate, deliberate checkbox.
    const key = str('anthropicKey').trim()
    if (key) { setAnthropicKey(config, key); changed.push('anthropicKey') }
    if (form.get('clearKey') === '1') { setAnthropicKey(config, ''); changed.push('anthropicKey (cleared)') }
    const model = str('model').trim()
    if (model && model !== config.model) { setModel(config, model); changed.push('model') }
  }

  if (!error && (form.has('smtpHost') || form.has('alertsEnabled'))) {
    const fields = setAlerts(config, {
      smtpHost: str('smtpHost'),
      smtpPort: str('smtpPort'),
      smtpUser: str('smtpUser'),
      smtpPass: str('smtpPass'),
      smtpTo: str('smtpTo'),
      smtpFrom: str('smtpFrom').trim() || str('smtpUser').trim(),
      smtpSecure: form.get('smtpSecure') === '1',
      alertsEnabled: form.get('alertsEnabled') === '1',
    })
    // Reported as one name: these include a password, and the audit log is not
    // the place to enumerate which of them moved.
    if (fields.length) changed.push('alerts')
  }

  if (changed.length) audit({ event: 'settings.changed', ip, ua, fields: changed })

  // Sent after saving, so the test exercises what was stored rather than what
  // was typed. Awaited, unlike a real alert: someone is sitting in front of it
  // waiting to be told whether it worked.
  let testResult = ''
  if (!error && form.get('testAlert') === '1') {
    try {
      await alerts.sendTest(config.smtpTo)
      testResult = `Test alert sent to ${config.smtpTo}.`
    } catch (err) {
      error = `Saved, but the test failed: ${errorMessage(err)}`
    }
  }

  revalidatePath('/', 'layout')
  const saved = changed.length ? `Saved: ${changed.join(', ')}.` : ''
  return {
    message: error || [saved, testResult].filter(Boolean).join(' ') || 'Nothing to save.',
    isError: Boolean(error),
  }
}
