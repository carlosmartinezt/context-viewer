import { redirect } from 'next/navigation'
import { config } from '@/server/runtime'
import { hasAccount } from '@/lib/account'
import { SetupForm } from './SetupForm'

import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Set up' }

/**
 * Never prerendered. Whether an account exists is read from disk at request
 * time and changes the moment somebody completes this form, so a build-time
 * snapshot of it would keep offering setup to an instance that already has an
 * account.
 */
export const dynamic = 'force-dynamic'

/**
 * A door that closes behind whoever walks through it first. Once an account
 * exists this page is permanently inert, the same pattern most self-hosted
 * tools use for first-run setup.
 */
export default function SetupPage() {
  if (hasAccount(config)) redirect('/_ctx/login')
  return <SetupForm needsRoot={!config.root} />
}
