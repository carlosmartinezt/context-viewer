import fs from 'node:fs'
import path from 'node:path'
import type { Metadata, Viewport } from 'next'
import type { ReactNode } from 'react'

export const metadata: Metadata = {
  // A template, so a page sets only its own name and the tab still says which
  // app it belongs to. `default` is what a page that sets no title gets.
  title: { default: 'context-viewer', template: '%s — context-viewer' },
  robots: { index: false, follow: false },
  // iOS has no manifest support for install: it takes the app name and the
  // icon from these instead, off the share sheet's "Add to Home Screen".
  appleWebApp: { capable: true, title: 'context', statusBarStyle: 'default' },
  // Under /_ctx and not at /favicon.ico, which would shadow a file of that
  // name at the root of the tree. The PNG is for browsers without SVG icons.
  icons: {
    icon: [
      { url: '/_ctx/assets/icon.svg', type: 'image/svg+xml' },
      { url: '/_ctx/assets/favicon-32.png', sizes: '32x32', type: 'image/png' },
    ],
    apple: '/_ctx/assets/apple-touch-icon.png',
  },
}

/**
 * The desk tone, so the title bar of an installed window matches the app
 * rather than sitting in browser grey. Both are declared: a dark-themed
 * install should not get a light title bar.
 */
export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#f8fafd' },
    { media: '(prefers-color-scheme: dark)', color: '#1f1d1b' },
  ],
}

/**
 * Runs before paint, so a chosen theme does not flash the default first.
 * Inline and not a module on purpose: a module would be deferred and too late.
 * Two independent choices, the workbench's colours and the document's type.
 */
const THEME_SCRIPT = `try{var u=localStorage.getItem('cvUiTheme');
if(u)document.documentElement.setAttribute('data-ui-theme',u)}catch(e){}`

/**
 * public/custom.css is the extension point: drop a file there and it loads
 * after the shipped stylesheets, so anything specific to your own documents
 * lives in your copy and never in this repo. Checked per request, so adding
 * it needs no restart.
 */
function hasCustomCss(): boolean {
  return fs.existsSync(path.join(process.cwd(), 'public', '_assets', 'custom.css'))
}

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" data-ui-theme="chrome" suppressHydrationWarning>
      <head>
        <link rel="stylesheet" href="/_ctx/assets/themes.css" />
        <link rel="stylesheet" href="/_ctx/assets/viewer.css" />
        <link rel="stylesheet" href="/_ctx/assets/components.css" />
        <link rel="stylesheet" href="/_ctx/assets/chrome.css" />
        {hasCustomCss() ? <link rel="stylesheet" href="/_ctx/assets/custom.css" /> : null}
        <script dangerouslySetInnerHTML={{ __html: THEME_SCRIPT }} />
      </head>
      <body>{children}</body>
    </html>
  )
}
