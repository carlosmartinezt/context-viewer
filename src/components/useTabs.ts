'use client'

import { useCallback, useEffect, useState } from 'react'

/**
 * The tab strip, remembered per browser like the tree's expanded folders, so a
 * refresh does not throw away everything you had open. Only the paths are
 * stored: titles are derived again on load.
 */

const KEY = 'cvTabs'

export interface Tab {
  path: string
  title: string
}

export function tabTitle(p: string): string {
  const [bare, query] = p.split('?')
  if (bare === '/_ctx/settings') return 'Settings'
  if (bare === '/_ctx/components') return 'Components'
  const name = decodeURIComponent(bare.split('/').filter(Boolean).pop() || 'root')
  return query?.includes('mode=source') ? `${name} (source)` : name
}

export function useTabs(active: string) {
  const [tabs, setTabs] = useState<Tab[]>([{ path: active, title: tabTitle(active) }])

  // Restore on mount, then keep the active path present in the strip. Opening
  // a file always adds a tab: VS Code's preview slot, where a single click
  // reuses the last tab, is deliberately not copied because it throws away the
  // file you were just looking at.
  useEffect(() => {
    setTabs((prev) => {
      let base = prev
      if (prev.length === 1 && prev[0].path === active) {
        try {
          const saved = localStorage.getItem(KEY)
          if (saved) base = (JSON.parse(saved) as string[]).map((p) => ({ path: p, title: tabTitle(p) }))
        } catch {}
      }
      const next = base.some((t) => t.path === active)
        ? base
        : [...base, { path: active, title: tabTitle(active) }]
      persist(next)
      return next
    })
  }, [active])

  const close = useCallback((path: string) => {
    setTabs((prev) => {
      const next = prev.filter((t) => t.path !== path)
      persist(next)
      return next
    })
  }, [])

  const closeMany = useCallback((keep: (t: Tab) => boolean) => {
    setTabs((prev) => {
      const next = prev.filter(keep)
      persist(next)
      return next
    })
  }, [])

  /** After a rename: follow the file rather than leaving a dead tab behind. */
  const rename = useCallback((from: string, to: string | null) => {
    setTabs((prev) => {
      const next = prev
        .map((t) => (t.path === from ? (to ? { path: to, title: tabTitle(to) } : null) : t))
        .filter((t): t is Tab => t !== null)
      persist(next)
      return next
    })
  }, [])

  return { tabs, close, closeMany, rename }
}

function persist(tabs: Tab[]): void {
  try { localStorage.setItem(KEY, JSON.stringify(tabs.map((t) => t.path))) } catch {}
}
