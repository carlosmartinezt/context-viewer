'use client'

import { useActionState } from 'react'
import { completeSetup, type FormState } from '@/server/actions/auth'

export function SetupForm({ needsRoot }: { needsRoot: boolean }) {
  const [state, action, pending] = useActionState<FormState, FormData>(completeSetup, {})
  const v = (name: string) => state.values?.[name] ?? ''

  return (
    <div className="cv-card">
      <h1>Set up this instance</h1>
      <p className="cv-hint">
        Whoever fills this in first gets the only account this instance will have. There is no
        second one and no way back to this screen.
      </p>
      <form action={action} autoComplete="off">
        {needsRoot ? (
          <label>
            Directory to serve
            <input
              type="text"
              name="rootDir"
              defaultValue={v('rootDir')}
              placeholder="~/notes"
              spellCheck={false}
              required
              autoFocus
            />
          </label>
        ) : null}
        <label>
          Username
          <input
            type="text"
            name="username"
            defaultValue={v('username')}
            autoComplete="username"
            autoFocus={!needsRoot}
            required
          />
        </label>
        <label>
          Password
          <input type="password" name="password" autoComplete="new-password" minLength={8} required />
          <span className="cv-hint">At least eight characters.</span>
        </label>
        <label>
          Confirm password
          <input type="password" name="confirmPassword" autoComplete="new-password" minLength={8} required />
        </label>

        {/* Optional on purpose. "npm start with nothing configured works on any
            server" is a promise this page keeps, so a mail server nobody has
            yet must not be a wall between someone and their files. */}
        <details className="cv-optional" open={Boolean(state.values?.smtpHost)}>
          <summary>Email me about security events (optional)</summary>
          <p className="cv-hint">
            Alerts for lockouts, logins from a new IP, settings changes and factory resets. Leave
            blank to skip: nothing is sent until a server is set.
          </p>
          <label>
            Send alerts to
            <input type="email" name="smtpTo" defaultValue={v('smtpTo')} placeholder="you@example.com" autoComplete="email" />
          </label>
          <label>
            SMTP server
            <input type="text" name="smtpHost" defaultValue={v('smtpHost')} placeholder="smtp.example.com" spellCheck={false} />
          </label>
          <label>
            Port
            <input type="number" name="smtpPort" defaultValue={v('smtpPort') || '587'} min={1} max={65535} />
            <span className="cv-hint">
              587 upgrades with STARTTLS, 465 is TLS from the first byte. Both are encrypted;
              plaintext is refused.
            </span>
          </label>
          <label>
            SMTP username
            <input type="text" name="smtpUser" defaultValue={v('smtpUser')} spellCheck={false} autoComplete="off" />
          </label>
          <label>
            SMTP password
            <input type="password" name="smtpPass" autoComplete="new-password" />
          </label>
          <label>
            From address
            <input type="email" name="smtpFrom" defaultValue={v('smtpFrom')} placeholder="context-viewer@example.com" />
            <span className="cv-hint">Defaults to the SMTP username if left blank.</span>
          </label>
        </details>

        {state.error ? <p className="cv-error">{state.error}</p> : null}
        <button type="submit" disabled={pending}>{pending ? 'Creating…' : 'Create account'}</button>
      </form>
    </div>
  )
}
