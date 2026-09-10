import { agent } from '@/server/runtime'
import { requireSessionJson, requester } from '@/server/session'
import { checkOrigin, rejectOrigin } from '@/server/origin'
import { errorMessage } from '@/lib/errors'
import type { AgentEvent, ChatMessage } from '@/lib/types'

/**
 * The agent, streamed as server-sent events.
 *
 * Not wrapped in the JSON handler: this one answers with a stream rather than
 * a body, and it has to start sending before it knows whether the whole run
 * will succeed. An error part-way through is an event in the stream, not a
 * status code, because by then the browser already has a 200.
 */
export async function POST(req: Request): Promise<Response> {
  if (!(await requireSessionJson())) {
    return Response.json({ error: 'Not signed in' }, { status: 401 })
  }
  const check = checkOrigin(req)
  if (!check.ok) {
    const { ip, ua } = await requester()
    return rejectOrigin(check, '/_ctx/api/agent', ip, ua)
  }

  const body = (await req.json().catch(() => ({}))) as {
    prompt?: string
    path?: string
    history?: ChatMessage[]
  }

  const encoder = new TextEncoder()
  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      const emit = (event: AgentEvent) => {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(event)}\n\n`))
      }
      try {
        await agent.run(
          { prompt: String(body.prompt || ''), openPath: body.path, history: body.history },
          emit,
        )
      } catch (err) {
        emit({ type: 'error', message: errorMessage(err) })
      } finally {
        controller.close()
      }
    },
  })

  return new Response(stream, {
    headers: {
      'content-type': 'text/event-stream; charset=utf-8',
      'cache-control': 'no-store',
      connection: 'keep-alive',
      // Caddy flushes text/event-stream on sight, but say it anyway.
      'x-accel-buffering': 'no',
    },
  })
}
