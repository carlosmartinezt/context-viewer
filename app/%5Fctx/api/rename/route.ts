import { files } from '@/server/runtime'
import { handler } from '@/server/api'
import { toSegments } from '@/lib/safe'

export const POST = handler('/_ctx/api/rename', async (req) => {
  const { path, name } = (await req.json()) as { path?: string; name?: string }
  return files.rename(toSegments(path), String(name || ''))
})
