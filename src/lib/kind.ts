import type { Kind } from './types'

/*
 * What a filename is, decided by its extension alone. Its own module, with no
 * node imports, because the client needs the same answer the server gives:
 * the tree and the listing must know which files open in the workbench and
 * which are bytes for a new browser tab.
 */

export function kindOf(name: string): Kind {
  const dot = name.lastIndexOf('.')
  const ext = dot > 0 ? name.slice(dot).toLowerCase() : ''
  if (ext === '.html' || ext === '.htm') return 'html'
  if (ext === '.md' || ext === '.markdown') return 'markdown'
  if (ext === '.pdf') return 'pdf'
  if (['.png', '.jpg', '.jpeg', '.gif', '.webp', '.svg', '.avif'].includes(ext)) return 'image'
  if (['.txt', '.csv', '.json', '.js', '.ts', '.css', '.log', '.yml', '.yaml'].includes(ext)) return 'text'
  return 'other'
}

/**
 * Whether a file renders in a tab of the workbench. Everything else (PDFs,
 * images, anything unknown) is served raw by /_ctx/file and opened in a new
 * browser tab: navigating the workbench to it would be a full page load that
 * throws away the tabs, the tree and the agent's conversation.
 */
export function opensInWorkbench(name: string): boolean {
  return ['html', 'markdown', 'text'].includes(kindOf(name))
}
