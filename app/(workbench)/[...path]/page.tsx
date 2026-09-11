import { redirect, notFound } from 'next/navigation'
import fs from 'node:fs/promises'
import path from 'node:path'
import { files, audit } from '@/server/runtime'
import { requester } from '@/server/session'
import { kindOf, htmlTitle, opensInWorkbench } from '@/lib/files'
import { OutsideRootError } from '@/lib/safe'
import { Listing } from '@/components/Listing'
import { DocFrame } from '@/components/DocFrame'
import { sortEntries } from '@/lib/sort'
import type { Metadata } from 'next'

/** Enough of a file to hold its head. A note's <title> is in the first
    line or two; reading the whole of a megabyte of HTML to find it is not. */
const HEAD_BYTES = 64 * 1024

/** The <title> of the note at this path, if it is an HTML note that has one. */
async function noteTitle(segments: string[]): Promise<string | null> {
  let handle
  try {
    const abs = await files.resolve(segments)
    handle = await fs.open(abs, 'r')
    const { buffer, bytesRead } = await handle.read(Buffer.alloc(HEAD_BYTES), 0, HEAD_BYTES, 0)
    return htmlTitle(buffer.toString('utf8', 0, bytesRead))
  } catch {
    // Missing, outside the root, unreadable: the page itself reports all
    // three, and a title is not the place to find out.
    return null
  } finally {
    await handle?.close()
  }
}

/**
 * The tab says what you are looking at. Without this every page inherits the
 * root layout's 'context-viewer' and fourteen open tabs are indistinguishable.
 * Source view is marked, because the same file can be open twice.
 *
 * A rendered HTML note is titled by its own <title>, the same string a browser
 * would show if you opened the file directly, and the same one the note puts
 * in its <h1>. The filename is the fallback, and it stays the title in source
 * view: there you are looking at the file, not at the page it makes.
 */
export async function generateMetadata({ params, searchParams }: {
  params: Promise<{ path: string[] }>
  searchParams: Promise<Record<string, string | string[] | undefined>>
}): Promise<Metadata> {
  const { path: segments } = await params
  const query = await searchParams
  const name = decodeURIComponent(segments[segments.length - 1] ?? '')
  const source = query.mode === 'source'
  if (!source && kindOf(name) === 'html') {
    const title = await noteTitle(segments)
    if (title) return { title }
  }
  const suffix = source ? ' (source)' : ''
  return { title: name ? `${name}${suffix}` : undefined }
}

/**
 * Everything in the tree: a folder is a listing, a file is a document.
 * Anything that is not text redirects to /_ctx/file, which serves bytes. The
 * tree and the listing link such files straight there in a new tab, so this
 * redirect is only for a URL typed or pasted in.
 */
export default async function BrowsePage({
  params,
  searchParams,
}: {
  params: Promise<{ path: string[] }>
  searchParams: Promise<Record<string, string | string[] | undefined>>
}) {
  const { path: segments } = await params
  const query = await searchParams
  const href = '/' + segments.map(encodeURIComponent).join('/')
  const { ip, ua } = await requester()

  let abs: string
  try {
    abs = await files.resolve(segments)
  } catch (err) {
    if (err instanceof OutsideRootError) {
      audit({ event: 'denied', ip, ua, path: href, reason: err.message })
      notFound()
    }
    throw err
  }

  const stat = await fs.stat(abs).catch(() => null)
  if (!stat) {
    audit({ event: 'notfound', ip, ua, path: href })
    notFound()
  }

  if (stat.isDirectory()) {
    const sort = typeof query.sort === 'string' ? query.sort : 'name'
    const dir = typeof query.dir === 'string' ? query.dir : 'asc'
    const entries = sortEntries(await files.list(segments), sort, dir)
    return <Listing entries={entries} base={href} sort={sort} dir={dir} />
  }

  const name = path.basename(abs)
  if (!opensInWorkbench(name)) {
    redirect('/_ctx/file' + href)
  }

  audit({ event: 'read', ip, ua, path: href })
  const mode = typeof query.mode === 'string' ? query.mode : undefined
  return <DocFrame path={href} mode={mode} />
}
