import { redirect } from 'next/navigation'
import { config } from '@/server/runtime'
import { currentSession } from '@/server/session'
import { hasAccount } from '@/lib/account'
import { LoginForm } from './LoginForm'

import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Sign in' }

/**
 * A fresh instance has no account, and then /_ctx/setup is the only page there is:
 * a login form for credentials that cannot exist yet helps nobody.
 */
export default async function LoginPage() {
  if (!hasAccount(config)) redirect('/_ctx/setup')
  if (await currentSession()) redirect('/')
  return <LoginForm />
}
