import type { Kind } from '@/lib/types'

/**
 * File icons. One outline, tinted per type, plus a mark for the few worth
 * telling apart at a glance. Not a full icon theme: enough that the eye can
 * find the html among the markdown.
 */
const FILE_TYPES: Record<string, [string, string]> = {
  html: ['#c2703a', 'M4.5 6.5 2.5 8l2 1.5M9.5 6.5 11.5 8l-2 1.5'],
  htm: ['#c2703a', 'M4.5 6.5 2.5 8l2 1.5M9.5 6.5 11.5 8l-2 1.5'],
  md: ['#4a7fb5', 'M4 10V6l2 2 2-2v4'],
  markdown: ['#4a7fb5', 'M4 10V6l2 2 2-2v4'],
  pdf: ['#b4453a', 'M4.5 9.5h5'],
  json: ['#9a8b3a', 'M5 6c-1 0-1 2-1 2s0 2 1 2M9 6c1 0 1 2 1 2s0 2-1 2'],
  css: ['#5a7ab5', 'M4 6h5M4 8h5M4 10h5'],
  js: ['#9a8b3a', 'M6 6v3.5a1 1 0 0 1-2 0'],
  ts: ['#4a7fb5', 'M4 6h5M6.5 6v4'],
  png: ['#4a8a5c', 'M4 10l2-2 1.5 1.5L9.5 8'],
  jpg: ['#4a8a5c', 'M4 10l2-2 1.5 1.5L9.5 8'],
  jpeg: ['#4a8a5c', 'M4 10l2-2 1.5 1.5L9.5 8'],
  svg: ['#4a8a5c', 'M4 10l2-2 1.5 1.5L9.5 8'],
}

export function FileIcon({ name }: { name: string }) {
  const ext = (name.split('.').pop() || '').toLowerCase()
  const [colour, mark] = FILE_TYPES[ext] ?? ['#8a8378', '']
  return (
    <svg className="ctx-icon" viewBox="0 0 16 16" fill="none" stroke={colour} strokeWidth="1.2">
      <path d="M4 2h5l3 3v9H4z" opacity="0.55" />
      {mark ? <path d={mark} /> : null}
    </svg>
  )
}

/** The folder mark, drawn the same in the tree and in a folder listing. */
export function FolderIcon() {
  return (
    <svg className="ctx-icon ctx-folder" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.2">
      <path d="M2 4.5h4l1 1.5h7v7H2z" />
    </svg>
  )
}

export function EntryIcon({ name, isDir }: { name: string; isDir: boolean }) {
  return isDir ? <FolderIcon /> : <FileIcon name={name} />
}

export const ACTIVITY_ICONS = {
  explorer: <path d="M3 4h6l2 2h10v13H3z" />,
  scm: (
    <>
      <circle cx="6" cy="6" r="2.5" />
      <circle cx="6" cy="18" r="2.5" />
      <circle cx="17" cy="9" r="2.5" />
      <path d="M6 8.5v7M17 11.5c0 4-5 2-11 4" />
    </>
  ),
  settings: (
    <>
      <circle cx="12" cy="12" r="3" />
      <path d="M12 2v3M12 19v3M2 12h3M19 12h3M5 5l2 2M17 17l2 2M19 5l-2 2M7 17l-2 2" />
    </>
  ),
  // Two arcs with arrowheads, drawn open at opposite corners so the gap reads
  // as motion. It spins while a refresh is in flight, so the arrowheads are
  // what makes the direction legible.
  refresh: (
    <>
      <path d="M20 12a8 8 0 1 1-2.34-5.66" />
      <path d="M20 4v4.5h-4.5" />
    </>
  ),
}

export type { Kind }
