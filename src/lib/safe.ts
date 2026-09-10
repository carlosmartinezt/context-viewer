import fs from 'node:fs/promises'
import path from 'node:path'

export class OutsideRootError extends Error {}

/**
 * Turn URL segments into an absolute path inside `root`, or throw.
 * Rejects traversal, absolute segments and NUL bytes before touching disk,
 * then re-checks after realpath so a symlink cannot escape either.
 *
 * Every read and every write in this app goes through here. It is the only
 * thing standing between a crafted path and the rest of the disk, and it is
 * the reason the agent's tools cannot reach outside the root no matter what
 * the model decides to ask for. Do not add a second way to open a file.
 */
export async function resolveWithin(root: string, rawSegments: string[]): Promise<string> {
  // Next's root-level catch-all (the browse page) hands back segments still
  // percent-encoded for anything with a space or other reserved character in
  // it, while every other route in this app (nested under /_ctx/...) already
  // gets them decoded. Decoding again here is a no-op for those, and the
  // try/catch is there because a segment can legitimately contain a bare '%'
  // (a file named "50% off.txt"), which is not valid percent-encoding and
  // throws rather than silently mangling the name.
  const segments = rawSegments.map((s) => {
    try {
      return decodeURIComponent(s)
    } catch {
      return s
    }
  })
  for (const s of segments) {
    if (!s || s === '.' || s === '..' || s.includes('\0') || s.includes('/') || s.includes('\\')) {
      throw new OutsideRootError(`Rejected path segment: ${JSON.stringify(s)}`)
    }
    // Dotfiles and dot-directories are categorically off limits: listDir()
    // already hides them from every listing, and without this check that
    // hiding is cosmetic, not a boundary. The one that actually matters is
    // .git: reachable by direct path it serves .git/config over HTTP (a
    // remote URL, at minimum) and, worse, the agent's edit_file has no
    // extension filter, so an unguarded resolver would let it write
    // .git/hooks/post-commit. files.write() commits after every write, so a
    // planted hook runs on the very next one. Blocking dot-segments here,
    // in the one shared resolver, closes it for the browser, the file route
    // and every agent tool in a single place.
    if (s.startsWith('.')) {
      throw new OutsideRootError(`Rejected dotfile segment: ${JSON.stringify(s)}`)
    }
  }

  const realRoot = await fs.realpath(root)
  const candidate = path.resolve(realRoot, ...segments)
  if (candidate !== realRoot && !candidate.startsWith(realRoot + path.sep)) {
    throw new OutsideRootError('Resolved outside the root')
  }

  let real: string
  try {
    real = await fs.realpath(candidate)
  } catch {
    // Does not exist yet. The shape is already proven safe, so hand it back:
    // a write needs to be able to name a file that is not there.
    return candidate
  }
  if (real !== realRoot && !real.startsWith(realRoot + path.sep)) {
    throw new OutsideRootError('Symlink escapes the root')
  }
  return real
}

/** A relative path string ("a/b.html") to segments, for tool arguments. */
export function toSegments(relPath: string | null | undefined): string[] {
  return String(relPath || '')
    .split('/')
    .filter((s) => s !== '' && s !== '.')
}
