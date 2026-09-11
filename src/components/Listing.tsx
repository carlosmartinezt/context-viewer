'use client'

import { useCallback, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import type { Entry } from '@/lib/types'
import { opensInWorkbench } from '@/lib/kind'
import { EntryIcon } from './icons'
import { useDialog } from './Dialog'

const COLUMNS: [keyof SortKeys, string][] = [
  ['name', 'name'],
  ['size', 'size'],
  ['created', 'created'],
  ['modified', 'modified'],
]

interface SortKeys { name: string; size: string; created: string; modified: string }

/**
 * A folder. This is the app's own UI rather than someone's document, so it is
 * rendered here as React and not in the document frame: rename and delete are
 * buttons that need to talk to the tree beside them.
 */
export function Listing({
  entries,
  base,
  sort,
  dir,
}: {
  entries: Entry[]
  base: string
  sort: string
  dir: string
}) {
  const router = useRouter()
  const [busy, setBusy] = useState('')
  const dialog = useDialog()

  const act = useCallback(async (action: 'rename' | 'delete', entry: Entry) => {
    const rel = (base === '/' ? '' : base).replace(/^\//, '') + (base === '/' ? '' : '/') + entry.name
    try {
      setBusy(entry.name)
      if (action === 'rename') {
        const next = await dialog.prompt({ title: 'Rename', value: entry.name })
        if (!next || next === entry.name) return
        await post('/_ctx/api/rename', { path: rel, name: next })
      } else {
        const ok = await dialog.confirm({
          title: `Move ${entry.name} to the trash?`,
          body: 'The trash lives outside the served directory, so it leaves the tree and the git history. It can be recovered by hand.',
          confirmLabel: 'Move to trash',
          danger: true,
        })
        if (!ok) return
        await post('/_ctx/api/delete', { path: rel })
      }
      router.refresh()
    } catch (err) {
      await dialog.alert({ title: 'That did not work', body: err instanceof Error ? err.message : String(err) })
    } finally {
      setBusy('')
    }
  }, [base, dialog, router])

  const here = base === '/' ? '' : base

  return (
    <article className="cv-content">
      <h1>{decodeURIComponent(here.split('/').filter(Boolean).pop() || 'root')}</h1>
      <table className="cv-index">
        <thead>
          <tr>
            {COLUMNS.map(([key, label]) => {
              const next = sort === key && dir === 'asc' ? 'desc' : 'asc'
              const arrow = sort === key ? (dir === 'desc' ? ' ↓' : ' ↑') : ''
              return (
                <th key={key} className={key === 'name' ? 'name' : 'num'}>
                  <Link href={`${here || '/'}?sort=${key}&dir=${next}`}>{label}{arrow}</Link>
                </th>
              )
            })}
            <th className="act" />
          </tr>
        </thead>
        <tbody>
          {entries.map((e) => {
            const href = `${here}/${encodeURIComponent(e.name)}`
            const label = (
              <>
                <EntryIcon name={e.name} isDir={e.isDir} />
                <span>{e.name}</span>
              </>
            )
            return (
              <tr key={e.name}>
                <td className="name">
                  {/* A <Link>, not an <a>: a plain link reloads the whole page
                      and the workbench around it. Files the workbench cannot
                      show go to their bytes in a new browser tab instead. */}
                  {e.isDir || opensInWorkbench(e.name)
                    ? <Link href={href}>{label}</Link>
                    : <a href={`/_ctx/file${href}`} target="_blank" rel="noopener">{label}</a>}
                </td>
                <td className="num">{formatSize(e.size)}</td>
                <td className="num">{formatDate(e.created)}</td>
                <td className="num">{formatDate(e.modified)}</td>
                <td className="act">
                  <button disabled={busy === e.name} onClick={() => void act('rename', e)}>rename</button>
                  <button disabled={busy === e.name} onClick={() => void act('delete', e)}>delete</button>
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
      {entries.length === 0 ? <p className="ctx-empty-hint">This folder is empty.</p> : null}
      {dialog.node}
    </article>
  )
}

function formatSize(bytes: number): string {
  if (!bytes) return ''
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`
}

function formatDate(iso: string): string {
  return iso ? iso.slice(0, 10) : ''
}

async function post(url: string, body: unknown): Promise<void> {
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  })
  const data = (await res.json().catch(() => ({}))) as { error?: string }
  if (!res.ok) throw new Error(data.error || `Request failed (${res.status})`)
}
