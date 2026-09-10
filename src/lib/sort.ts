import type { Entry } from './types'

/** Folders first, then whichever column was asked for. */
export function sortEntries(entries: Entry[], sort: string, dir: string): Entry[] {
  const sign = dir === 'desc' ? -1 : 1
  return [...entries].sort((a, b) => {
    if (a.isDir !== b.isDir) return a.isDir ? -1 : 1
    if (sort === 'size') return sign * (a.size - b.size)
    if (sort === 'created' || sort === 'modified') return sign * String(a[sort]).localeCompare(String(b[sort]))
    return sign * a.name.localeCompare(b.name)
  })
}
