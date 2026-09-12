'use client'

import { useActionState } from 'react'
import { saveSettings, type SettingsState } from '@/server/actions/settings'

interface Alerts {
  enabled: boolean
  to: string
  host: string
  port: number
  secure: boolean
  user: string
  hasPass: boolean
  from: string
}

export function SettingsForms({
  readonly, username, root, model, maskedKey, alerts,
}: {
  /** A read-only instance refuses every write on the server (see
   *  lib/settings.ts). Disabling the forms here is presentation, not
   *  enforcement: it says so plainly instead of letting someone fill in a
   *  form that was always going to be refused. */
  readonly: boolean
  username: string
  root: string
  model: string
  maskedKey: string | null
  alerts: Alerts
}) {
  const [state, action, pending] = useActionState<SettingsState, FormData>(saveSettings, {})

  return (
    <article className="cv-content cv-settings">
      <h1>Settings</h1>

      {readonly ? (
        <p className="cv-hint cv-readonly">
          This instance is read-only. Nothing below can be changed, and the server refuses
          these writes whatever the page offers.
        </p>
      ) : null}

      <section>
        <h2>Account</h2>
        <p className="cv-hint">
          Signed in as <strong>{username}</strong>. Changing either field below requires the
          current password.
        </p>
        <form action={action}>
          <fieldset disabled={readonly}>
            <label>
              Current password
              <input type="password" name="currentPassword" autoComplete="current-password" required />
            </label>
            <label>
              <span>New username <span className="cv-optional">(optional)</span></span>
              <input type="text" name="newUsername" autoComplete="username" />
            </label>
            <label>
              <span>New password <span className="cv-optional">(optional)</span></span>
              <input type="password" name="newPassword" autoComplete="new-password" minLength={8} />
            </label>
            <button type="submit" disabled={pending}>Save</button>
          </fieldset>
        </form>
      </section>

      <section>
        <h2>Directory</h2>
        <p className="cv-hint">
          The tree this viewer serves. Changing it takes effect immediately, no restart.
        </p>
        <form action={action}>
          <fieldset disabled={readonly}>
            <label>
              Root directory
              <input type="text" name="rootDir" defaultValue={root} placeholder="~/notes" spellCheck={false} required />
            </label>
            <button type="submit" disabled={pending}>Save</button>
          </fieldset>
        </form>
      </section>

      <section>
        <h2>AI agent</h2>
        <p className="cv-hint">
          {maskedKey
            ? `Configured (key ${maskedKey}). Leave the key field blank to keep it, or check the box below to remove it.`
            : 'Not configured. The agent panel will say so until a key is set here.'}
        </p>
        <form action={action}>
          <fieldset disabled={readonly}>
            <label>
              Anthropic API key
              <input type="password" name="anthropicKey" placeholder={maskedKey ? 'unchanged' : 'sk-ant-...'} autoComplete="off" />
            </label>
            <label className="cv-checkbox">
              <input type="checkbox" name="clearKey" value="1" /> Remove the saved key
            </label>
            <label>
              Model
              <input type="text" name="model" defaultValue={model} spellCheck={false} />
            </label>
            <button type="submit" disabled={pending}>Save</button>
          </fieldset>
        </form>
      </section>

      <section>
        <h2>Security alerts</h2>
        <p className="cv-hint">
          {alerts.host
            ? `Sending to ${alerts.to} via ${alerts.host}:${alerts.port}. Leave the password blank to keep the saved one.`
            : 'Not configured. Nothing is sent until an SMTP server is set here.'}
        </p>
        <p className="cv-hint">
          Mail goes out on: a lockout after repeated failures, a login from an IP not seen before,
          a settings change, a new account, and a factory reset. Routine reads and single mistyped
          passwords are logged but never mailed.
        </p>
        <form action={action}>
          <fieldset disabled={readonly}>
            <label className="cv-checkbox">
              <input type="checkbox" name="alertsEnabled" value="1" defaultChecked={alerts.enabled} /> Send security alerts
            </label>
            <label>
              Send alerts to
              <input type="email" name="smtpTo" defaultValue={alerts.to} placeholder="you@example.com" />
            </label>
            <label>
              SMTP server
              <input type="text" name="smtpHost" defaultValue={alerts.host} placeholder="smtp.example.com" spellCheck={false} />
            </label>
            <label>
              Port
              <input type="number" name="smtpPort" defaultValue={alerts.port || 587} min={1} max={65535} />
            </label>
            <label className="cv-checkbox">
              <input type="checkbox" name="smtpSecure" value="1" defaultChecked={alerts.secure} /> TLS from the first byte (usually port 465)
            </label>
            <span className="cv-hint">
              Leave unchecked for STARTTLS, the usual choice on 587. Either way the connection is
              encrypted before credentials are sent; a server offering neither is refused.
            </span>
            <label>
              SMTP username
              <input type="text" name="smtpUser" defaultValue={alerts.user} spellCheck={false} autoComplete="off" />
            </label>
            <label>
              SMTP password
              <input type="password" name="smtpPass" placeholder={alerts.hasPass ? 'unchanged' : ''} autoComplete="new-password" />
            </label>
            <label>
              From address
              <input type="email" name="smtpFrom" defaultValue={alerts.from} placeholder="context-viewer@example.com" />
            </label>
            <button type="submit" disabled={pending}>Save</button>
            <button type="submit" name="testAlert" value="1" formNoValidate disabled={pending}>
              Save and send a test
            </button>
          </fieldset>
        </form>
      </section>

      {state.message ? (
        <p className={state.isError ? 'cv-error' : 'cv-ok'}>{state.message}</p>
      ) : null}
    </article>
  )
}
