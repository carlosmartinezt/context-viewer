'use client'

import { useActionState } from 'react'
import { signIn, type FormState } from '@/server/actions/auth'

/**
 * An ordinary form posting to a server action, so it still works with
 * JavaScript switched off. The error sits above the button, where you are
 * already looking, and the button says the same word the heading does.
 */
export function LoginForm() {
  const [state, action, pending] = useActionState<FormState, FormData>(signIn, {})

  return (
    <div className="cv-card">
      <h1>Sign in</h1>
      <form action={action}>
        <label>
          Username
          <input
            type="text"
            name="username"
            defaultValue={state.values?.username ?? ''}
            autoComplete="username"
            autoFocus
            required
          />
        </label>
        <label>
          Password
          <input type="password" name="password" autoComplete="current-password" required />
        </label>
        {state.error ? <p className="cv-error">{state.error}</p> : null}
        <button type="submit" disabled={pending}>{pending ? 'Signing in…' : 'Sign in'}</button>
      </form>
    </div>
  )
}
