import type { makeConfig } from './config'

/**
 * The config object, inferred from the one place it is built. It is shared and
 * mutable on purpose: /_ctx/setup and /_ctx/settings write to these fields in place,
 * and every module reads them at call time rather than closing over a copy, so
 * a change is live everywhere with no restart.
 */
export type Config = ReturnType<typeof makeConfig>

/** One line of the append-only audit log. */
export interface AuditRecord {
  event: string
  ip?: string
  ua?: string
  path?: string
  [field: string]: unknown
}

export type Audit = (record: AuditRecord) => void

/** What kindOf() decides a filename is. Drives which route serves it and how
 *  the document pane renders it. */
export type Kind = 'html' | 'markdown' | 'text' | 'image' | 'pdf' | 'other'

/** What a directory listing knows about one entry. The two dates are ISO
 *  strings, not numbers: they are formatted for display and never compared. */
export interface Entry {
  name: string
  isDir: boolean
  size: number
  created: string
  modified: string
  kind: Kind | 'folder'
}

/** A node in the explorer tree. A folder has children, a file has a kind. */
export type TreeNode =
  | { name: string; path: string[]; isDir: true; children: TreeNode[] }
  | { name: string; path: string[]; isDir: false; kind: Kind | 'folder' }

export interface Tree {
  nodes: TreeNode[]
  truncated: boolean
}

export interface GitChange {
  path: string
  status: string
}

export interface GitCommit {
  sha: string
  date: string
  author: string
  subject: string
}

export type GitStatus =
  | { repo: false }
  | {
      repo: true
      branch: string
      changes: GitChange[]
      ahead: number
      behind: number
      upstream: string
    }

/** What the agent streams back to the browser, one event per SSE frame. */
export type AgentEvent =
  | { type: 'text'; delta: string }
  | { type: 'tool'; name: string }
  | { type: 'changed'; path: string }
  | { type: 'done' }
  | { type: 'error'; message: string }

export interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
}
