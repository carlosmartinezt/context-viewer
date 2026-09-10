import fs from 'node:fs/promises'
import fsSync from 'node:fs'
import path from 'node:path'
import { execFile } from 'node:child_process'
import { promisify } from 'node:util'
import { resolveWithin } from './safe'
import { errorCode, errorMessage } from './errors'
import type { Config, Audit, Entry, Kind, Tree, TreeNode } from './types'

const run = promisify(execFile)

export function kindOf(name: string): Kind {
  const ext = path.extname(name).toLowerCase()
  if (ext === '.html' || ext === '.htm') return 'html'
  if (ext === '.md' || ext === '.markdown') return 'markdown'
  if (ext === '.pdf') return 'pdf'
  if (['.png', '.jpg', '.jpeg', '.gif', '.webp', '.svg', '.avif'].includes(ext)) return 'image'
  if (['.txt', '.csv', '.json', '.js', '.ts', '.css', '.log', '.yml', '.yaml'].includes(ext)) return 'text'
  return 'other'
}

/**
 * The <title> an HTML note gave itself, or null if it has none.
 *
 * A note names itself better than its filename does ("Spain residency, 2026"
 * rather than es-residency-2026.html), so the browser tab says what the note
 * says. Only the head is searched: a body may hold an <svg><title>, which is
 * an accessible name for a graphic and not the name of the page. The lookahead
 * is the same one /_ctx/doc needs, since <head[^>]*> also matches <header>.
 */
export function htmlTitle(raw: string): string | null {
  const head = /<head(?=[\s>])[^>]*>([\s\S]*?)<\/head\s*>/i.exec(raw)
  const region = head ? head[1] : raw.split(/<body(?=[\s>])/i)[0]
  const found = /<title(?=[\s>])[^>]*>([\s\S]*?)<\/title\s*>/i.exec(region)
  if (!found) return null
  const text = found[1]
    .replace(/&(amp|lt|gt|quot|#0*39|apos|nbsp);/gi, (_, e: string) => {
      const k = e.toLowerCase()
      if (k === 'amp') return '&'
      if (k === 'lt') return '<'
      if (k === 'gt') return '>'
      if (k === 'quot') return '"'
      if (k === 'nbsp') return ' '
      return "'"
    })
    .replace(/\s+/g, ' ')
    .trim()
  return text || null
}

/** Text is what the agent may read and write. Everything else is bytes. */
export function isEditable(name: string): boolean {
  return ['html', 'markdown', 'text'].includes(kindOf(name))
}

export const contentTypes: Record<string, string> = {
  '.pdf': 'application/pdf',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.webp': 'image/webp',
  '.svg': 'image/svg+xml',
  '.avif': 'image/avif',
  '.txt': 'text/plain; charset=utf-8',
  '.csv': 'text/csv; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  // A note in a frame is a real page, so the stylesheet and the script it
  // links have to come back as a stylesheet and a script. Served from /_ctx/file,
  // which is inside the root and inside resolveWithin() like everything else.
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.ico': 'image/x-icon',
}

export function contentTypeFor(name: string): string {
  return contentTypes[path.extname(name).toLowerCase()] || 'application/octet-stream'
}

export function makeFiles(config: Config, audit: Audit) {
  const resolve = (segments: string[]) => resolveWithin(config.root, segments)
  const rel = (abs: string) => path.relative(config.root, abs).split(path.sep).join('/')

  // ── git ────────────────────────────────────────────────────────────────
  //
  // Optional throughout. The root may be any directory, so every git call is
  // best effort: if it is not a repo, or git is missing, the write still
  // happens and only the safety net is absent.

  // Keyed by root rather than a single flag: the settings page can change
  // config.root at runtime (see lib/settings.js), and a stale "yes" or "no"
  // from the previous root would silently commit into the wrong repo, or
  // silently stop committing into a real one.
  const repoCache = new Map()
  async function repo() {
    if (!repoCache.has(config.root)) {
      try {
        await run('git', ['rev-parse', '--is-inside-work-tree'], { cwd: config.root })
        repoCache.set(config.root, true)
      } catch {
        repoCache.set(config.root, false)
      }
    }
    return repoCache.get(config.root) && config.gitCommits
  }

  /** Commit whatever changed under these paths. Never throws at the caller. */
  async function commit(message: string, paths: string[]) {
    if (!(await repo())) return null
    try {
      await run('git', ['add', '--', ...paths], { cwd: config.root })
      const { stdout } = await run('git', ['status', '--porcelain', '--', ...paths], { cwd: config.root })
      if (!stdout.trim()) return null
      await run('git', ['commit', '-m', message, '--', ...paths], { cwd: config.root })
      const { stdout: sha } = await run('git', ['rev-parse', '--short', 'HEAD'], { cwd: config.root })
      return sha.trim()
    } catch (err) {
      console.error('[git] commit failed', errorMessage(err))
      return null
    }
  }

  /**
   * Creation dates, from git rather than the filesystem. Birthtime is the day
   * the tree landed on this box, which for anything written earlier reads as
   * later than the file's own mtime. The commit that first added a file is the
   * closest honest answer. One call per directory, cached until it changes.
   */
  const addedCache = new Map()
  async function gitAdded(abs: string, key: number) {
    const hit = addedCache.get(abs)
    if (hit && hit.key === key) return hit.dates
    const dates = new Map()
    if (await repo()) {
      try {
        const relDir = rel(abs) || '.'
        const prefix = relDir === '.' ? '' : relDir + '/'
        const { stdout } = await run(
          'git',
          ['-c', 'core.quotepath=false', 'log', '--diff-filter=A', '--format=%x00%aI', '--name-only', '--', relDir],
          { cwd: config.root, maxBuffer: 8 << 20 },
        )
        let when = ''
        for (const line of stdout.split('\n')) {
          if (line.startsWith('\0')) when = line.slice(1)
          else if (line.startsWith(prefix) && when) {
            // Newest first, so a later line wins: that is the first add.
            dates.set(line.slice(prefix.length).split('/')[0], when)
          }
        }
      } catch {
        // Not tracked, or no history for this path. Birthtime it is.
      }
    }
    addedCache.set(abs, { key, dates })
    return dates
  }

  // ── Reads ──────────────────────────────────────────────────────────────

  async function list(segments: string[]): Promise<Entry[]> {
    const abs = await resolve(segments)
    const dirents = await fs.readdir(abs, { withFileTypes: true })
    const st = await fs.stat(abs).catch(() => null)
    const added = await gitAdded(abs, st?.mtimeMs ?? 0)
    const entries = await Promise.all(
      dirents
        .filter((d) => !d.name.startsWith('.'))
        .filter((d) => d.isDirectory() || d.isFile())
        .map(async (d) => {
          const s = await fs.stat(path.join(abs, d.name)).catch(() => null)
          return {
            name: d.name,
            isDir: d.isDirectory(),
            size: s?.size ?? 0,
            created: added.get(d.name) || s?.birthtime.toISOString() || '',
            modified: s?.mtime.toISOString() || '',
            kind: (d.isDirectory() ? 'folder' : kindOf(d.name)) as Kind | 'folder',
          }
        }),
    )
    return entries
  }

  /**
   * The whole tree under the root, for the sidebar. Depth-first, directories
   * before files, dotfiles skipped like everywhere else.
   *
   * Capped, because "point it at any directory" includes directories with a
   * hundred thousand files in them, and the sidebar is rendered on every
   * page. The cap is a count of entries, not a depth limit, so a deep-but-
   * narrow tree still comes back whole. Whatever is cut off is reachable by
   * clicking into the folder, which lists it the normal way.
   */
  async function tree(limit = 4000): Promise<Tree> {
    let budget = limit
    async function walk(segments: string[]): Promise<{ nodes: TreeNode[]; truncated: boolean } | null> {
      if (budget <= 0) return null
      const entries = (await list(segments).catch(() => [])).sort((a, b) => {
        if (a.isDir !== b.isDir) return a.isDir ? -1 : 1
        return a.name.localeCompare(b.name)
      })
      const out: TreeNode[] = []
      for (const e of entries) {
        if (budget <= 0) return { nodes: out, truncated: true }
        budget -= 1
        const path = [...segments, e.name]
        out.push(e.isDir
          ? { name: e.name, path, isDir: true, children: (await walk(path))?.nodes ?? [] }
          : { name: e.name, path, isDir: false, kind: e.kind })
      }
      return { nodes: out, truncated: false }
    }
    const result = await walk([])
    return { nodes: result?.nodes ?? [], truncated: budget <= 0 }
  }

  async function read(segments: string[]) {
    const abs = await resolve(segments)
    return fs.readFile(abs, 'utf8')
  }

  // ── Writes ─────────────────────────────────────────────────────────────

  /** Write through a temp file in the same directory, so a crash cannot
   *  leave a note half written. */
  async function write(segments: string[], content: string, message?: string) {
    const abs = await resolve(segments)
    const tmp = path.join(path.dirname(abs), `.${path.basename(abs)}.tmp`)
    await fs.writeFile(tmp, content, 'utf8')
    await fs.rename(tmp, abs)
    const relPath = rel(abs)
    const sha = await commit(message || `viewer: edit ${relPath}`, [relPath])
    audit({ event: 'file.write', path: '/' + relPath, bytes: Buffer.byteLength(content), commit: sha })
    return { path: relPath, commit: sha }
  }

  async function rename(segments: string[], nextName: string) {
    if (!nextName || nextName.includes('/') || nextName.includes('\0') || nextName === '.' || nextName === '..') {
      throw new Error('Invalid name')
    }
    const abs = await resolve(segments)
    const target = await resolve([...segments.slice(0, -1), nextName])
    if (fsSync.existsSync(target)) throw new Error('A file with that name already exists')
    const from = rel(abs)
    const to = rel(target)
    await fs.rename(abs, target)
    const sha = await commit(`viewer: rename ${from} to ${to}`, [from, to])
    audit({ event: 'file.rename', path: '/' + from, to: '/' + to, commit: sha })
    return { from, to, commit: sha }
  }

  /**
   * Delete moves the file to the trash directory, which lives outside the root
   * by default. Inside it, a deleted note would stay in the git history, keep
   * turning up in search and still be one URL away.
   */
  async function trash(segments: string[]) {
    const abs = await resolve(segments)
    const relPath = rel(abs)
    const stamp = new Date().toISOString().replace(/[:.]/g, '-')
    const dest = path.join(config.trashDir, stamp, relPath)
    await fs.mkdir(path.dirname(dest), { recursive: true, mode: 0o700 })
    try {
      await fs.rename(abs, dest)
    } catch (err) {
      if (errorCode(err) !== 'EXDEV') throw err
      // Trash on another filesystem: copy, then remove.
      await fs.cp(abs, dest, { recursive: true })
      await fs.rm(abs, { recursive: true })
    }
    const sha = await commit(`viewer: delete ${relPath}`, [relPath])
    audit({ event: 'file.trash', path: '/' + relPath, trash: dest, commit: sha })
    return { path: relPath, trash: dest, commit: sha }
  }

  return { resolve, rel, list, tree, read, write, rename, trash, commit, repo }
}
