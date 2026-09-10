import { config } from '@/server/runtime'
import { maskKey } from '@/lib/settings'
import { SettingsForms } from './SettingsForms'

import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Settings' }

/**
 * Settings is a document, not a page: it opens in a tab like any file. The
 * forms are ordinary forms posting to a server action, so they still work
 * with JavaScript switched off.
 */
export default function SettingsPage() {
  return (
    <SettingsForms
      username={config.username}
      root={config.root}
      model={config.model}
      maskedKey={maskKey(config.anthropicKey)}
      alerts={{
        enabled: config.alertsEnabled,
        to: config.smtpTo,
        host: config.smtpHost,
        port: config.smtpPort,
        secure: config.smtpSecure === true,
        user: config.smtpUser,
        hasPass: Boolean(config.smtpPass),
        from: config.smtpFrom,
      }}
    />
  )
}
