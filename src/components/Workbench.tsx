'use client'

import { useCallback, useEffect, useRef, useState, useTransition } from 'react'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import type { ReactNode } from 'react'
import type { Tree as TreeData } from '@/lib/types'
import { Tree } from './Tree'
import { Minimap } from './Minimap'
import { AgentPanel } from './AgentPanel'
import { useDialog } from './Dialog'
import { SourceControl } from './SourceControl'
import { useTabs, tabTitle } from './useTabs'
import { UI_THEMES, applyTheme, currentTheme } from './themes'
import { ACTIVITY_ICONS, EntryIcon } from './icons'

/**
 * VS Code's shape: activity bar, sidebar, tabs, breadcrumbs, minimap, a bottom
 * panel for the agent, a status bar. That is what people already know for
 * "browse a directory and read what is in it", so it needs no explaining.
 *
 * This is a layout, so it survives navigation: the tab strip, the tree's open
 * folders and the agent's conversation are all still here after moving between
 * files, and only `children` (the document pane) changes.
 */

interface Target { path: string; name: string; isDir: boolean }

export function Workbench({
  tree,
  root,
  children,
}: {
  tree: TreeData
  root: string
  children: ReactNode
}) {
  const router = useRouter()
  // The layout is not told the pathname, and does not need to be: this is a
  // client component, so it reads the address itself and re-reads it on every
  // navigation, which is exactly what "which tab is active" depends on.
  const pathname = usePathname()
  const search = useSearchParams()
  const mode = search.get('mode')
  const currentPath = mode ? `${pathname}?mode=${mode}` : pathname
  const { tabs, close, closeMany, rename } = useTabs(currentPath)
  const [view, setView] = useState<'explorer' | 'scm'>('explorer')
  const [sidebarHidden, setSidebarHidden] = useState(false)
  const [panelHidden, setPanelHidden] = useState(true)
  const [minimapHidden, setMinimapHidden] = useState(false)
  const [menu, setMenu] = useState<'none' | 'root' | 'ui'>('none')
  const [rowMenu, setRowMenu] = useState<{ target: Target; x: number; y: number } | null>(null)
  const [tabMenu, setTabMenu] = useState<{ path: string; x: number; y: number } | null>(null)
  const [changes, setChanges] = useState(0)
  const [branch, setBranch] = useState('')
  const [revision, setRevision] = useState(0)
  // The path a delete or a rename is moving us off. The tree is refreshed on
  // the other side of that navigation, never in the same tick as it.
  const [leaving, setLeaving] = useState<string | null>(null)
  const paneRef = useRef<HTMLDivElement>(null)
  const activeTabRef = useRef<HTMLAnchorElement>(null)
  // isPending is the real thing, not a timer: the spin stops when the server
  // has actually sent a new tree, so a slow refresh looks slow instead of
  // looking finished and wrong.
  const [refreshing, startRefresh] = useTransition()
  const dialog = useDialog()

  const open = useCallback((href: string) => { router.push(href) }, [router])

  /** The other half of afterFileChange: the push has landed, so now the
   *  layout can be asked for a tree with the deleted file gone from it. */
  useEffect(() => {
    if (leaving === null || pathname === leaving) return
    setLeaving(null)
    router.refresh()
  }, [leaving, pathname, router])

  /**
   * The strip scrolls, and a tab opened past its right edge would otherwise
   * be added somewhere you cannot see. 'nearest' rather than 'center' so a
   * tab that is already visible does not slide around under the pointer.
   */
  useEffect(() => {
    activeTabRef.current?.scrollIntoView({ block: 'nearest', inline: 'nearest' })
  }, [currentPath, tabs.length])

  /**
   * Registered from the workbench and nowhere else, so it exists only for
   * someone who is signed in. It caches nothing (see public/sw.js); it is
   * what lets Chrome offer "install this app".
   */
  useEffect(() => {
    if (!('serviceWorker' in navigator)) return
    navigator.serviceWorker.register('/sw.js').catch(() => {})
  }, [])

  // The minimap is remembered per browser; the panel is not, because it is
  // something you reach for rather than something already open when you arrive.
  useEffect(() => {
    try { setMinimapHidden(localStorage.getItem('cvMinimap') === 'false') } catch {}
  }, [])

  // A framed document asks the workbench to open links, since navigating the
  // frame itself would leave the tabs and the URL pointing at the old file.
  useEffect(() => {
    const onMessage = (e: MessageEvent) => {
      if (e.origin !== location.origin) return
      if (e.data?.type === 'ctx:open') open(String(e.data.path))
      if (e.data?.type === 'ctx:blur') { setMenu('none'); setRowMenu(null); setTabMenu(null) }
    }
    addEventListener('message', onMessage)
    return () => removeEventListener('message', onMessage)
  }, [open])

  useEffect(() => {
    /**
     * Dismiss decides by where the click landed, not by whether something
     * stopped it on the way here. It cannot use stopPropagation: React
     * attaches its own handlers to `document` in the App Router, so a menu
     * button's onClick and this listener sit on the same node, and
     * stopPropagation only stops propagation to *other* nodes. React opened
     * the menu, this ran a moment later on the same node, and closed it
     * again, so the gear appeared dead. The old build worked only because
     * its toggle listener was on the button itself, a different node.
     */
    const dismiss = (e?: Event) => {
      const el = e?.target as Element | null
      if (el?.closest?.('[data-menu], [data-menu-toggle]')) return
      setMenu('none'); setRowMenu(null); setTabMenu(null)
    }
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') dismiss() }
    document.addEventListener('click', dismiss)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('click', dismiss)
      document.removeEventListener('keydown', onKey)
    }
  }, [])

  /**
   * After a rename or a delete: move off a file that is no longer there rather
   * than reloading the URL of the thing just deleted, and refresh the tree.
   *
   * The order is load-bearing. The tree comes from the layout, so re-reading
   * the directory is router.refresh(); but a refresh issued in the same tick
   * as a push is the one that loses. Deleting the file you were looking at
   * navigated to the parent listing, which the router served with the layout
   * it already had, and the deleted file sat in the sidebar until a reload.
   * So: navigate first, refresh once the navigation has landed.
   */
  const afterFileChange = useCallback((oldPath: string, newPath: string | null) => {
    const href = '/' + oldPath.split('/').map(encodeURIComponent).join('/')
    const moved = newPath ? '/' + newPath.split('/').map(encodeURIComponent).join('/') : null
    rename(href, moved)
    if (currentPath.split('?')[0] === href) {
      open(moved ?? (href.split('/').slice(0, -1).join('/') || '/'))
      setLeaving(currentPath.split('?')[0])
    } else {
      router.refresh()
    }
  }, [currentPath, open, rename, router])

  const act = useCallback(async (action: string, target: Target) => {
    try {
      if (action === 'open') return open('/' + target.path.split('/').map(encodeURIComponent).join('/'))
      if (action === 'source') return open('/' + target.path.split('/').map(encodeURIComponent).join('/') + '?mode=source')
      if (action === 'copy') return void navigator.clipboard.writeText(target.path)
      if (action === 'rename') {
        const next = await dialog.prompt({ title: 'Rename', value: target.name })
        if (!next || next === target.name) return
        const out = await post<{ to: string }>('/_ctx/api/rename', { path: target.path, name: next })
        afterFileChange(target.path, out.to)
      }
      if (action === 'delete') {
        const ok = await dialog.confirm({
          title: `Move ${target.name} to the trash?`,
          body: 'The trash lives outside the served directory, so it leaves the tree and the git history. It can be recovered by hand.',
          confirmLabel: 'Move to trash',
          danger: true,
        })
        if (!ok) return
        await post('/_ctx/api/delete', { path: target.path })
        afterFileChange(target.path, null)
      }
    } catch (err) {
      await dialog.alert({ title: 'That did not work', body: err instanceof Error ? err.message : String(err) })
    }
  }, [afterFileChange, dialog, open])

  const crumbs = currentPath.split('?')[0].split('/').filter(Boolean)

  return (
    <div className={`ctx-workbench${sidebarHidden ? ' sidebar-hidden' : ''}`}>
      <nav className="ctx-activity">
        {(['explorer', 'scm'] as const).map((v) => (
          <button
            key={v}
            data-view={v}
            aria-selected={view === v}
            title={v === 'explorer' ? 'Explorer' : 'Source control'}
            onClick={() => {
              if (view === v) setSidebarHidden((h) => !h)
              else { setView(v); setSidebarHidden(false) }
            }}
          >
            <svg viewBox="0 0 24 24">{ACTIVITY_ICONS[v]}</svg>
            {v === 'scm' && changes > 0 ? <span className="ctx-badge">{changes}</span> : null}
          </button>
        ))}
        <span className="spacer" />
        <button
          title="Preferences"
          data-menu-toggle
          onClick={() => setMenu((m) => (m === 'none' ? 'root' : 'none'))}
        >
          <svg viewBox="0 0 24 24">{ACTIVITY_ICONS.settings}</svg>
        </button>
      </nav>

      {/* Themes and the minimap live behind the gear rather than cluttering the
          toolbar, the way VS Code buries everything behind the gear. */}
      <div className="ctx-menu ctx-root-menu" data-menu hidden={menu === 'none'} onClick={(e) => e.stopPropagation()}>
        <button data-menu-item onClick={() => { open('/_ctx/settings'); setMenu('none') }}>Settings</button>
        <button data-menu-item onClick={() => { open('/_ctx/components'); setMenu('none') }}>Components</button>
        <div className="ctx-submenu">
          <button data-menu-item onClick={() => setMenu(menu === 'ui' ? 'root' : 'ui')}>
            Theme<span>›</span>
          </button>
          <div className="ctx-menu ctx-themes" hidden={menu !== 'ui'}>
            {UI_THEMES.map(([name, label]) => (
              <button
                key={name}
                aria-selected={currentTheme() === name}
                onClick={() => { applyTheme(name); setMenu('none'); setRevision((r) => r + 1) }}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
        <button
          data-menu-item
          onClick={() => {
            setMinimapHidden((h) => {
              try { localStorage.setItem('cvMinimap', String(h)) } catch {}
              return !h
            })
            setMenu('none')
          }}
        >
          Minimap<span>{minimapHidden ? '' : '✓'}</span>
        </button>
      </div>

      <aside className="ctx-sidebar">
        <h2>
          <span>{view === 'scm' ? 'Source control' : 'Explorer'}</span>
          <span className="root">{root}</span>
          {/* The tree is rendered on the server, so re-reading the directory
              is router.refresh(): it re-runs the page and swaps the tree in
              without touching the tabs, the agent panel or which folders are
              open, all of which live in the client. A full reload would throw
              those away, which is the whole reason this is a button and not
              an instruction to press F5. */}
          <button
            className="ctx-refresh"
            title="Refresh"
            aria-label="Refresh"
            data-spinning={refreshing ? '' : undefined}
            disabled={refreshing}
            onClick={() => startRefresh(() => router.refresh())}
          >
            <svg viewBox="0 0 24 24">{ACTIVITY_ICONS.refresh}</svg>
          </button>
        </h2>
        <div className="ctx-view" hidden={view !== 'explorer'}>
          <Tree
            nodes={tree.nodes}
            truncated={tree.truncated}
            currentPath={currentPath.split('?')[0]}
            onOpen={open}
            onContextMenu={(target, x, y) => setRowMenu({ target, x, y })}
          />
        </div>
        <div className="ctx-view ctx-scm" hidden={view !== 'scm'}>
          <SourceControl onCount={(n, b) => { setChanges(n); setBranch(b) }} />
        </div>
      </aside>
      <div className="ctx-resize-x" />

      <section className="ctx-editor">
        <div className="ctx-tabs">
          {tabs.map((t) => (
            <a
              key={t.path}
              className="ctx-tab"
              href={t.path}
              title={decodeURIComponent(t.path)}
              aria-selected={t.path === currentPath}
              ref={t.path === currentPath ? activeTabRef : undefined}
              onClick={(e) => { e.preventDefault(); open(t.path) }}
              onContextMenu={(e) => { e.preventDefault(); setTabMenu({ path: t.path, x: e.clientX, y: e.clientY }) }}
            >
              {/* A tab for a folder gets the folder mark. The old build cloned
                  the icon out of the tree row; deriving it from the name keeps
                  the mapping in one place and works for a folder that is not
                  currently visible in the tree. */}
              <EntryIcon name={t.title} isDir={!t.title.includes('.')} />
              <span className="label">{t.title}</span>
              <button
                className="close"
                aria-label={`Close ${t.title}`}
                onClick={(e) => {
                  e.preventDefault()
                  e.stopPropagation()
                  close(t.path)
                  if (t.path === currentPath) {
                    const rest = tabs.filter((x) => x.path !== t.path)
                    open(rest.length ? rest[rest.length - 1].path : '/')
                  }
                }}
              >
                ×
              </button>
            </a>
          ))}
        </div>

        <div className="ctx-breadcrumbs">
          <span data-crumbs>
            <a href="/" onClick={(e) => { e.preventDefault(); open('/') }}>{root}</a>
            {crumbs.map((part, i) => (
              <span key={i} style={{ display: 'contents' }}>
                <span>›</span>
                <a
                  href={'/' + crumbs.slice(0, i + 1).join('/')}
                  onClick={(e) => { e.preventDefault(); open('/' + crumbs.slice(0, i + 1).join('/')) }}
                >
                  {decodeURIComponent(part)}
                </a>
              </span>
            ))}
          </span>
        </div>

        <div className="ctx-surface">
          <div className="ctx-doc" ref={paneRef}>{children}</div>
          <Minimap paneRef={paneRef} hidden={minimapHidden} revision={revision} />
        </div>
      </section>

      <div className="ctx-resize-y" style={{ gridColumn: '2 / -1' }} />
      <AgentPanel
        hidden={panelHidden}
        onClose={() => setPanelHidden(true)}
        openPath={currentPath}
        onChanged={() => { router.refresh(); setRevision((r) => r + 1) }}
      />

      <footer className="ctx-status">
        {/* The agent lives here rather than in the toolbar. It is the app's
            one action, and the status bar is where VS Code keeps the things
            you toggle. aria-expanded, because the button is the only way to
            know whether the panel below is open. */}
        <button
          className="ctx-agent-button"
          title="Ask the agent"
          aria-expanded={!panelHidden}
          onClick={() => setPanelHidden((h) => !h)}
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true">
            <rect x="4" y="8" width="16" height="11" rx="2.5" />
            <path d="M12 4.5V8M9.5 3.2h5" />
            <circle cx="9" cy="13" r="1.2" fill="currentColor" stroke="none" />
            <circle cx="15" cy="13" r="1.2" fill="currentColor" stroke="none" />
            <path d="M9.5 16.2h5M1.8 11.5v4M22.2 11.5v4" />
          </svg>
          <span>Agent</span>
        </button>
        <span>{branch}</span>
        <span className="right">{decodeURIComponent(currentPath)}</span>
      </footer>

      {dialog.node}

      {/* One context menu for the tree, moved to the pointer, rather than one
          menu per row. File-only items hide themselves on a folder. */}
      {rowMenu ? (
        <div
          className="ctx-menu ctx-context"
          data-menu
          style={{ left: rowMenu.x, top: rowMenu.y }}
          onClick={(e) => e.stopPropagation()}
        >
          {[
            ['open', 'Open', true],
            ['source', 'View source', true],
            ['copy', 'Copy path', false],
            ['rename', 'Rename', false],
            ['delete', 'Delete', false],
          ].map(([action, label, fileOnly]) => (
            <button
              key={action as string}
              hidden={Boolean(fileOnly) && rowMenu.target.isDir}
              className={action === 'delete' ? 'danger' : undefined}
              onClick={() => { setRowMenu(null); void act(action as string, rowMenu.target) }}
            >
              {label as string}
            </button>
          ))}
        </div>
      ) : null}

      {tabMenu ? (
        <div
          className="ctx-menu ctx-context"
          data-menu
          style={{ left: tabMenu.x, top: tabMenu.y }}
          onClick={(e) => e.stopPropagation()}
        >
          <button onClick={() => { close(tabMenu.path); setTabMenu(null) }}>Close</button>
          <button onClick={() => { closeMany((t) => t.path === tabMenu.path); setTabMenu(null) }}>Close others</button>
          <button
            onClick={() => {
              const i = tabs.findIndex((t) => t.path === tabMenu.path)
              closeMany((t) => tabs.indexOf(t) <= i)
              setTabMenu(null)
            }}
          >
            Close to the right
          </button>
          <button onClick={() => { closeMany(() => false); setTabMenu(null); open('/') }}>Close all</button>
          <button
            onClick={() => {
              void navigator.clipboard.writeText(decodeURIComponent(tabMenu.path.split('?')[0]).replace(/^\//, ''))
              setTabMenu(null)
            }}
          >
            Copy path
          </button>
        </div>
      ) : null}
    </div>
  )
}

async function post<T = unknown>(url: string, body: unknown): Promise<T> {
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  })
  const data = (await res.json().catch(() => ({}))) as { error?: string }
  if (!res.ok) throw new Error(data.error || `Request failed (${res.status})`)
  return data as T
}

export { tabTitle }
