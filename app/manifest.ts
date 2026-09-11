import type { MetadataRoute } from 'next'

/**
 * Installable from Chrome's address bar, and from Safari's share sheet on iOS.
 *
 * Deliberately public: this route does not call requireSession(). Chrome reads
 * the manifest to decide whether the app can be installed at all, and a
 * manifest that redirects to the login page is a manifest it cannot read. It
 * gives away the app's name and its colours, and nothing else. In particular
 * it does not name the directory being served, which is the one fact the login
 * page is careful never to leak.
 *
 * start_url is the root rather than a saved path: the session decides where
 * you actually land, and a shortcut that opens someone's last document is a
 * shortcut that shows it to whoever picks the laptop up.
 */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'context-viewer',
    short_name: 'context',
    description: 'A lightweight file viewer with AI capabilities.',
    start_url: '/',
    scope: '/',
    display: 'standalone',
    // The desk, not the paper: it is what fills the window before anything is
    // open, and what the title bar takes its colour from.
    background_color: '#f8fafd',
    theme_color: '#f8fafd',
    orientation: 'any',
    icons: [
      { src: '/_ctx/assets/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
      { src: '/_ctx/assets/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
      // Android crops to whatever shape the launcher likes, so the maskable
      // copy keeps everything that matters inside the middle 80%.
      { src: '/_ctx/assets/icon-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
    ],
  }
}
