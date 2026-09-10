import { files } from '@/server/runtime'
import { handler } from '@/server/api'
import { toSegments } from '@/lib/safe'

export const POST = handler('/_ctx/api/delete', async (req) => {
  const { path } = (await req.json()) as { path?: string }
  return files.trash(toSegments(path))
})
