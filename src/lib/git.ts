import { execFile } from 'node:child_process'
import { promisify } from 'node:util'
import type { Config, Audit } from './types'

const run = promisify(execFile)

/**
 * Source control, enough of it to mirror the panel VS Code puts in the
 * sidebar: what changed, commit it, push, pull, and the recent history.
 *
 * Every call is `git` with an argument array, never a shell string, and every
 * path argument comes after `--`. Nothing here takes a path from the browser:
 * commit stages the whole tree, which is what "commit all" means in that
 * panel, and is the only shape of commit this UI offers.
 */
export function makeGit(config: Config, audit: Audit) {
  const at = () => ({ cwd: config.root, maxBuffer: 8 << 20 })

  async function git(...args: string[]) {
    const { stdout } = await run('git', args, at())
    return stdout
  }

  async function isRepo() {
    try {
      await git('rev-parse', '--is-inside-work-tree')
      return true
    } catch {
      return false
    }
  }

  async function status() {
    if (!(await isRepo())) return { repo: false }

    const [porcelain, branch] = await Promise.all([
      git('status', '--porcelain=v1'),
      git('rev-parse', '--abbrev-ref', 'HEAD').catch(() => 'HEAD\n'),
    ])

    const changes = []
    for (const line of porcelain.split('\n')) {
      if (!line.trim()) continue
      // XY<space>path, where XY is the two-letter index/worktree status.
      changes.push({ status: line.slice(0, 2).trim() || '?', path: line.slice(3) })
    }

    // How far ahead or behind the upstream, when there is one.
    let ahead = 0
    let behind = 0
    let upstream = null
    try {
      upstream = (await git('rev-parse', '--abbrev-ref', '@{upstream}')).trim()
      const counts = await git('rev-list', '--left-right', '--count', 'HEAD...@{upstream}')
      const [a, b] = counts.trim().split(/\s+/).map(Number)
      ahead = a || 0
      behind = b || 0
    } catch {
      // No upstream configured. Push will say so rather than guessing one.
    }

    return { repo: true, branch: branch.trim(), changes, ahead, behind, upstream }
  }

  async function log(limit = 20) {
    if (!(await isRepo())) return []
    const out = await git(
      'log', `-${limit}`, '--date=short',
      '--format=%h%x00%ad%x00%an%x00%s',
    ).catch(() => '')
    return out.split('\n').filter(Boolean).map((line) => {
      const [sha, date, author, subject] = line.split('\0')
      return { sha, date, author, subject }
    })
  }

  async function commit(message: string) {
    const text = String(message || '').trim()
    if (!text) throw new Error('Write a commit message first.')
    if (!(await isRepo())) throw new Error('This directory is not a git repository.')
    await git('add', '-A')
    const staged = await git('diff', '--cached', '--name-only')
    if (!staged.trim()) throw new Error('Nothing to commit.')
    await git('commit', '-m', text)
    const sha = (await git('rev-parse', '--short', 'HEAD')).trim()
    audit({ event: 'git.commit', message: text, commit: sha })
    return { commit: sha, files: staged.trim().split('\n').length }
  }

  /**
   * Push is the one action here that leaves the machine. It is deliberately
   * not silent: it reports the remote it is pushing to so the person clicking
   * it can see where these files are about to go.
   */
  async function push() {
    if (!(await isRepo())) throw new Error('This directory is not a git repository.')
    const { upstream, ahead } = await status()
    if (!upstream) throw new Error('No upstream branch is configured for this branch.')
    if (!ahead) return { pushed: 0, upstream }
    const remote = upstream.split('/')[0]
    const url = (await git('remote', 'get-url', remote).catch(() => '')).trim()
    await git('push')
    audit({ event: 'git.push', upstream, url, commits: ahead })
    return { pushed: ahead, upstream, url }
  }

  async function pull() {
    if (!(await isRepo())) throw new Error('This directory is not a git repository.')
    // --ff-only: a merge commit or a conflict is not something this panel can
    // sensibly resolve, so refuse rather than leave the tree half merged.
    const out = await git('pull', '--ff-only').catch((err) => {
      throw new Error(String(err.stderr || err.message).split('\n')[0])
    })
    audit({ event: 'git.pull' })
    return { output: out.trim() }
  }

  return { status, log, commit, push, pull }
}
