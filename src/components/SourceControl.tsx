'use client'

import { useCallback, useEffect, useState } from 'react'
import type { GitStatus, GitCommit } from '@/lib/types'
import { useDialog } from './Dialog'

type Status = GitStatus & { log?: GitCommit[] }

/**
 * Source control. Push is the one action that leaves the box, so it reports
 * the remote it is pushing to and asks first: commit on a tree of personal
 * documents is local and reversible, push is neither.
 */
export function SourceControl({ onCount }: { onCount: (n: number, branch: string) => void }) {
  const [git, setGit] = useState<Status | null>(null)
  const [message, setMessage] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const dialog = useDialog()

  const refresh = useCallback(async () => {
    try {
      const res = await fetch('/_ctx/api/git/status')
      const data = (await res.json()) as Status
      setGit(data)
      onCount(data.repo ? data.changes.length : 0, data.repo ? branchLabel(data) : 'not a repo')
    } catch {
      setGit({ repo: false })
      onCount(0, 'not a repo')
    }
  }, [onCount])

  useEffect(() => { void refresh() }, [refresh])

  const act = useCallback(async (action: 'commit' | 'push' | 'pull') => {
    if (action === 'push') {
      const ok = await dialog.confirm({
        title: 'Push to the remote?',
        body: 'Commits are local and reversible. This one leaves the box.',
        confirmLabel: 'Push',
      })
      if (!ok) return
    }
    setBusy(true)
    setError('')
    try {
      const res = await fetch(`/_ctx/api/git/${action}`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(action === 'commit' ? { message } : {}),
      })
      const data = (await res.json()) as { error?: string }
      if (!res.ok) throw new Error(data.error || 'Failed')
      if (action === 'commit') setMessage('')
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err))
    } finally {
      setBusy(false)
      void refresh()
    }
  }, [message, refresh])

  if (!git) return <p className="empty">Loading…</p>
  if (!git.repo) return <p className="empty">This directory is not a git repository.</p>

  return (
    <>
      <textarea
        rows={2}
        placeholder="Message (commits everything)"
        value={message}
        onChange={(e) => setMessage(e.target.value)}
      />
      <div className="actions">
        <button className="primary" disabled={busy} onClick={() => void act('commit')}>Commit</button>
        <button disabled={busy} onClick={() => void act('push')}>Push{git.ahead ? ` ${git.ahead}` : ''}</button>
        <button disabled={busy} onClick={() => void act('pull')}>Pull{git.behind ? ` ${git.behind}` : ''}</button>
      </div>
      {error ? <p className="cv-error">{error}</p> : null}
      <h3>Changes{git.changes.length ? ` (${git.changes.length})` : ''}</h3>
      {git.changes.length ? (
        <ul>
          {git.changes.map((c) => (
            <li key={c.path}>
              <span className="path" title={c.path}>{c.path}</span>
              <span className="status">{c.status}</span>
            </li>
          ))}
        </ul>
      ) : (
        <p className="empty">No changes.</p>
      )}
      <h3>History</h3>
      <div className="log">
        {(git.log ?? []).map((c) => (
          <div key={c.sha}>
            <span className="sha">{c.sha}</span> {c.subject}
            <br />
            {c.date} · {c.author}
          </div>
        ))}
      </div>
      {dialog.node}
    </>
  )
}

function branchLabel(g: Extract<GitStatus, { repo: true }>): string {
  return `${g.branch}${g.ahead ? ` ↑${g.ahead}` : ''}${g.behind ? ` ↓${g.behind}` : ''}`
}
