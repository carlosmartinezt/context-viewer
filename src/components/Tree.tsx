'use client'

import { useEffect, useState, useCallback } from 'react'
import type { TreeNode } from '@/lib/types'
import { EntryIcon } from './icons'

/**
 * The explorer. Every node is rendered up front so expanding is instant and
 * needs no round trip, and which folders are open is remembered per browser:
 * the server only knows to open the path you arrived on, so without this a
 * reload collapsed the tree and you lost your place.
 */

const KEY = 'cvExpanded'

function readExpanded(): Set<string> {
  try {
    const raw = localStorage.getItem(KEY)
    return new Set<string>(raw ? (JSON.parse(raw) as string[]) : [])
  } catch {
    return new Set()
  }
}

export function Tree({
  nodes,
  truncated,
  currentPath,
  onOpen,
  onContextMenu,
}: {
  nodes: TreeNode[]
  truncated: boolean
  currentPath: string
  onOpen: (href: string) => void
  onContextMenu: (row: { path: string; name: string; isDir: boolean }, x: number, y: number) => void
}) {
  const [expanded, setExpanded] = useState<Set<string>>(() => new Set())

  // Read on mount, not during render: localStorage does not exist on the
  // server and reading it while rendering would make the two disagree.
  useEffect(() => {
    const saved = readExpanded()
    // The folders on the path you arrived at stay open whatever was saved.
    const parts = currentPath.split('/').filter(Boolean)
    for (let i = 1; i <= parts.length; i++) saved.add(parts.slice(0, i).join('/'))
    setExpanded(saved)
  }, [currentPath])

  const toggle = useCallback((path: string) => {
    setExpanded((prev) => {
      const next = new Set(prev)
      if (next.has(path)) next.delete(path)
      else next.add(path)
      try { localStorage.setItem(KEY, JSON.stringify([...next])) } catch {}
      return next
    })
  }, [])

  return (
    <>
      <ul className="ctx-tree">
        {nodes.map((n) => (
          <Row
            key={n.path.join('/')}
            node={n}
            depth={0}
            expanded={expanded}
            toggle={toggle}
            currentPath={currentPath}
            onOpen={onOpen}
            onContextMenu={onContextMenu}
          />
        ))}
      </ul>
      {truncated ? <p className="more">too many files to list them all</p> : null}
    </>
  )
}

function Row({
  node,
  depth,
  expanded,
  toggle,
  currentPath,
  onOpen,
  onContextMenu,
}: {
  node: TreeNode
  depth: number
  expanded: Set<string>
  toggle: (path: string) => void
  currentPath: string
  onOpen: (href: string) => void
  onContextMenu: (row: { path: string; name: string; isDir: boolean }, x: number, y: number) => void
}) {
  const rel = node.path.join('/')
  const href = '/' + node.path.map(encodeURIComponent).join('/')
  // Indent is depth alone, as a custom property the stylesheet multiplies by
  // --ctx-indent, so the rows and the guide lines cannot drift apart.
  const style = { '--i': depth } as React.CSSProperties
  const menu = (e: React.MouseEvent) => {
    e.preventDefault()
    onContextMenu({ path: rel, name: node.name, isDir: node.isDir }, e.clientX, e.clientY)
  }
  const dots = (
    /* data-menu-toggle, or the workbench's dismiss handler closes this menu in
       the same tick it opens: both listeners sit on document. */
    <button
      className="ctx-dots"
      aria-label="Actions"
      data-menu-toggle
      onClick={(e) => {
        e.preventDefault()
        e.stopPropagation()
        const r = (e.target as HTMLElement).getBoundingClientRect()
        onContextMenu({ path: rel, name: node.name, isDir: node.isDir }, r.right, r.bottom)
      }}
    >
      ⋮
    </button>
  )

  if (!node.isDir) {
    return (
      <li>
        {/* Every row is twisty, icon, name, in that order. A file's twisty slot
            is empty rather than absent: that is what lines the names up. */}
        <a
          className="ctx-row"
          style={style}
          href={href}
          title={rel}
          aria-current={href === currentPath ? 'page' : undefined}
          onClick={(e) => {
            if (e.metaKey || e.ctrlKey || e.button !== 0) return
            e.preventDefault()
            onOpen(href)
          }}
          onContextMenu={menu}
        >
          <span className="spacer" />
          <EntryIcon name={node.name} isDir={false} />
          <span className="name">{node.name}</span>
          {dots}
        </a>
      </li>
    )
  }

  const open = expanded.has(rel)
  return (
    <li>
      <div
        className="ctx-row"
        style={style}
        title={rel}
        aria-expanded={open}
        onClick={() => toggle(rel)}
        onContextMenu={menu}
      >
        <svg className="ctx-chevron" viewBox="0 0 24 24">
          <path d="M9 6l6 6-6 6" />
        </svg>
        <EntryIcon name={node.name} isDir />
        <span className="name">{node.name}</span>
        {dots}
      </div>
      <ul style={{ '--d': depth } as React.CSSProperties} hidden={!open}>
        {node.children.map((c) => (
          <Row
            key={c.path.join('/')}
            node={c}
            depth={depth + 1}
            expanded={expanded}
            toggle={toggle}
            currentPath={currentPath}
            onOpen={onOpen}
            onContextMenu={onContextMenu}
          />
        ))}
      </ul>
    </li>
  )
}
