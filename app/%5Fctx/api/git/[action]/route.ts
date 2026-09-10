import { git } from '@/server/runtime'
import { handler } from '@/server/api'

/**
 * Push is the one action that leaves the box, which is why the browser
 * confirms first: commit on a tree of personal documents is local and
 * reversible, push is neither. Pull is --ff-only, because a merge conflict is
 * not something this panel can sensibly resolve.
 */
export const GET = handler(
  '/_ctx/api/git/status',
  async (req) => {
    if (!new URL(req.url).pathname.endsWith('/status')) {
      throw new Error('Only status may be read with GET.')
    }
    return { ...(await git.status()), log: await git.log() }
  },
  { mutates: false },
)

export const POST = handler('/_ctx/api/git', async (req) => {
  const action = new URL(req.url).pathname.split('/').pop()
  if (action === 'commit') {
    const { message } = (await req.json().catch(() => ({}))) as { message?: string }
    return git.commit(String(message || ''))
  }
  if (action === 'push') return git.push()
  if (action === 'pull') return git.pull()
  throw new Error(`No such git action: ${action}`)
})
