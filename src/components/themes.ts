'use client'

/**
 * The colours of the workbench. Each name has a block in themes.css and
 * nothing else, except Chrome, which also has chrome.css. The first is the
 * default. Labels are only for the menu.
 */
export const UI_THEMES: [string, string][] = [
  ['chrome', 'Chrome'],
  ['light-plus', 'Light+'],
  ['quiet-light', 'Quiet Light'],
  ['dark-plus', 'Dark+'],
  ['dark-modern', 'Dark Modern'],
  ['abyss', 'Abyss'],
  ['monokai', 'Monokai'],
  ['monokai-dimmed', 'Monokai Dimmed'],
  ['kimbie-dark', 'Kimbie Dark'],
  ['red', 'Red'],
  ['tomorrow-night-blue', 'Tomorrow Night Blue'],
]

/**
 * The theme is set on the root element and remembered per browser. The
 * document lives in an iframe with its own root element, so it is set there
 * too: same origin, and the frame reads the same key on load anyway, so this
 * only matters for a change made while a document is already open.
 */
export function applyTheme(name: string): void {
  document.documentElement.setAttribute('data-ui-theme', name)
  try { localStorage.setItem('cvUiTheme', name) } catch {}
  document.querySelectorAll('iframe').forEach((frame) => {
    frame.contentDocument?.documentElement.setAttribute('data-ui-theme', name)
  })
}

export function currentTheme(): string {
  if (typeof document === 'undefined') return UI_THEMES[0][0]
  return document.documentElement.getAttribute('data-ui-theme') || UI_THEMES[0][0]
}

/**
 * The document style. Not a second theme axis, and deliberately not a list of
 * named looks: there is one switch, and it is off.
 *
 * A note that brought its own HTML renders here exactly as it renders in a
 * browser, which is the point of the frame. But plenty of HTML files were
 * never written to be read as a page at all, and for those the browser's own
 * default (Times, full pane width) is the one case where doing nothing looks
 * worse than doing something. "Basic" gives those a reading width, a familiar
 * face and sized headings, and nothing else.
 *
 * It reaches a note through doc-style.css, which is linked into every note and
 * is inert without the attribute below. It never touches the documents this
 * app renders itself (markdown, plain text, source): those have viewer.css.
 */
export const DOC_STYLES: [string, string][] = [
  ['none', 'None'],
  ['basic', 'Basic'],
]

/**
 * The frame reads the saved value itself on load, so this is for a change made
 * while a document is already open. `none` removes the attribute rather than
 * writing it, because the stylesheet keys off its presence.
 */
export function applyDocStyle(name: string): void {
  try { localStorage.setItem('cvDocStyle', name) } catch {}
  document.querySelectorAll('iframe').forEach((frame) => {
    const root = frame.contentDocument?.documentElement
    if (!root) return
    if (name === 'none') root.removeAttribute('data-doc-style')
    else root.setAttribute('data-doc-style', name)
  })
}

export function currentDocStyle(): string {
  try { return localStorage.getItem('cvDocStyle') || DOC_STYLES[0][0] } catch { return DOC_STYLES[0][0] }
}
