import fs from 'node:fs/promises'
import path from 'node:path'
import { files, audit } from '@/server/runtime'
import { requireSessionJson, requester } from '@/server/session'
import { contentTypeFor } from '@/lib/files'
import { OutsideRootError } from '@/lib/safe'

/**
 * Bytes for anything that is not a document: images, PDFs, downloads, and the
 * stylesheets and scripts a note links from inside its own frame.
 */
export async function GET(_req: Request, ctx: { params: Promise<{ path: string[] }> }) {
  if (!(await requireSessionJson())) return new Response('Not signed in', { status: 401 })

  const { path: segments } = await ctx.params
  const { ip, ua } = await requester()

  try {
    const abs = await files.resolve(segments)
    const stat = await fs.stat(abs).catch(() => null)
    if (!stat || stat.isDirectory()) return new Response('Not found', { status: 404 })

    audit({ event: 'file.serve', ip, ua, path: '/' + segments.join('/') })
    const body = await fs.readFile(abs)
    return new Response(new Uint8Array(body), {
      headers: {
        'content-type': contentTypeFor(path.basename(abs)),
        'cache-control': 'no-store',
      },
    })
  } catch (err) {
    if (err instanceof OutsideRootError) return new Response('Not found', { status: 404 })
    throw err
  }
}
