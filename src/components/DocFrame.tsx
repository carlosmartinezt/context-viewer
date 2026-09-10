'use client'

import { useEffect, useRef } from 'react'
import { applyTheme, currentTheme } from './themes'

/**
 * A document, in a frame of its own.
 *
 * The note is a whole HTML file: it has a head, it links its own stylesheet,
 * and some of them define custom elements in their own script. Lifting the
 * body out and injecting it meant none of that ran, so a note looked one way
 * here and another way when you opened the file in a browser. A frame is a
 * real document boundary, so all of it runs, and it still cannot reach the
 * workbench around it.
 */
export function DocFrame({ path, mode }: { path: string; mode?: string }) {
  const ref = useRef<HTMLIFrameElement>(null)
  const src = `/_ctx/doc${path}${mode ? `?mode=${encodeURIComponent(mode)}` : ''}`
  // A note that brought its own HTML is served no theme, so its frame must not
  // be given one either: the ground behind it is the browser's, not the
  // workbench's. Everything else in a frame is a shell this app rendered, and
  // that follows the theme like the rest of the app. The route decides the
  // same thing from the same extension; there is nothing to import here that
  // does not drag node into the client.
  const note = mode !== 'source' && /\.html?$/i.test(path)

  // The frame reads the saved theme itself on load. This is for a theme
  // changed while it is already open, which its own script never sees.
  useEffect(() => {
    const frame = ref.current
    if (!frame || note) return
    const sync = () => {
      const doc = frame.contentDocument
      if (!doc) return
      doc.documentElement.setAttribute('data-ui-theme', currentTheme())
    }
    frame.addEventListener('load', sync)
    return () => frame.removeEventListener('load', sync)
  }, [src, note])

  return <iframe ref={ref} src={src} title={path} data-note={note ? '' : undefined} />
}

export { applyTheme }
