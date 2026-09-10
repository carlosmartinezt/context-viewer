import 'server-only'
import { requireSessionJson, requester } from './session'
import { checkOrigin, rejectOrigin } from './origin'
import { errorMessage } from '@/lib/errors'
import { OutsideRootError } from '@/lib/safe'

/**
 * One wrapper for every JSON endpoint: the session gate, the CSRF check for
 * anything that changes something, and a single place that turns a thrown
 * error into a status code. Handlers below can then just throw.
 *
 * Reading git state is a GET; everything else here changes something and has
 * to be a same-origin POST.
 */
export function handler(
  where: string,
  fn: (req: Request) => Promise<unknown>,
  { mutates = true }: { mutates?: boolean } = {},
) {
  return async (req: Request): Promise<Response> => {
    if (!(await requireSessionJson())) {
      return Response.json({ error: 'Not signed in' }, { status: 401 })
    }
    if (mutates) {
      const check = checkOrigin(req)
      if (!check.ok) {
        const { ip, ua } = await requester()
        return rejectOrigin(check, where, ip, ua)
      }
    }
    try {
      return Response.json(await fn(req))
    } catch (err) {
      // A path that resolved outside the root is not a bad request to explain,
      // it is a thing that does not exist.
      if (err instanceof OutsideRootError) {
        return Response.json({ error: 'Not found' }, { status: 404 })
      }
      return Response.json({ error: errorMessage(err) }, { status: 400 })
    }
  }
}
