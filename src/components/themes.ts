'use client'

/**
 * Two axes, deliberately separate: the colours of the workbench and the
 * typography of the document. Each name has a block in themes.css and nothing
 * else. Labels are only for the menu.
 */
export const UI_THEMES: [string, string][] = [
  ['paper', 'Paper'],
  ['light-plus', 'Light+'],
  ['quiet-light', 'Quiet Light'],
  ['solarized-light', 'Solarized Light'],
  ['high-contrast-light', 'Light High Contrast'],
  ['dark-plus', 'Dark+'],
  ['dark-modern', 'Dark Modern'],
  ['abyss', 'Abyss'],
  ['monokai', 'Monokai'],
  ['monokai-dimmed', 'Monokai Dimmed'],
  ['solarized-dark', 'Solarized Dark'],
  ['kimbie-dark', 'Kimbie Dark'],
  ['red', 'Red'],
  ['tomorrow-night-blue', 'Tomorrow Night Blue'],
  ['high-contrast-dark', 'Dark High Contrast'],
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
