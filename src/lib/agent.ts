import path from 'node:path'
import { toSegments } from './safe'
import { isEditable } from './files'
import type { Config, Audit, Entry, AgentEvent, ChatMessage } from './types'
import { errorMessage } from './errors'
import type { makeFiles } from './files'

type Files = ReturnType<typeof makeFiles>
type ToolInput = Record<string, string | undefined>

/**
 * What a tool hands back. The writing tools return an object so the caller
 * can tell "the write landed" from "the tool refused": only a truthy
 * `changed` means the file on disk actually moved, and reporting a change
 * that did not happen would tell the browser to reload for nothing.
 */
type ToolResult = string | { message: string; changed?: string }

/** A message in the Messages API's shape: text, or a list of blocks. */
interface ApiMessage {
  role: 'user' | 'assistant'
  content: string | ApiBlock[]
}

type ApiBlock =
  | { type: 'text'; text: string }
  | { type: 'tool_use'; id: string; name: string; input: ToolInput }
  | { type: 'tool_result'; tool_use_id: string; content: string }

/**
 * The agent, as a few hundred lines of fetch against the Messages API. No SDK
 * and no framework, for the same reason the auth is hand-rolled: this thing
 * can write to the tree, so the less code between the model and the disk the
 * better.
 *
 * Every tool goes through files.js, which goes through resolveWithin(), so the
 * agent physically cannot read or write outside ROOT_DIR. That property is
 * what makes it safe to point this at any directory, and it is worth keeping:
 * a tool that takes an absolute path, or shells out, throws it away.
 */

const TOOLS = [
  {
    name: 'list_dir',
    description: 'List files and folders at a path relative to the root. Use "" for the root itself.',
    input_schema: {
      type: 'object',
      properties: { path: { type: 'string', description: 'Relative path, e.g. "01_projects"' } },
      required: ['path'],
    },
  },
  {
    name: 'read_file',
    description: 'Read a text file (HTML, markdown, text) relative to the root.',
    input_schema: {
      type: 'object',
      properties: { path: { type: 'string' } },
      required: ['path'],
    },
  },
  {
    name: 'search',
    description: 'Case-insensitive search across the tree. Returns matching files with one line of context each.',
    input_schema: {
      type: 'object',
      properties: { query: { type: 'string' } },
      required: ['query'],
    },
  },
  {
    name: 'edit_file',
    description:
      'Replace an exact string in a file. old_string must appear exactly once. Prefer this over write_file for an existing file: it cannot lose the rest of the document.',
    input_schema: {
      type: 'object',
      properties: {
        path: { type: 'string' },
        old_string: { type: 'string' },
        new_string: { type: 'string' },
      },
      required: ['path', 'old_string', 'new_string'],
    },
  },
  {
    name: 'write_file',
    description: 'Write a whole file, creating it if needed. Replaces the entire contents.',
    input_schema: {
      type: 'object',
      properties: { path: { type: 'string' }, content: { type: 'string' } },
      required: ['path', 'content'],
    },
  },
]

function systemPrompt(config: Config, openPath: string | undefined): string {
  return `You are the assistant inside a context viewer: a small web app serving one directory of documents.

The root is a directory of files the user owns. Content is mostly HTML documents. Learn how this tree is organised by listing it before you assume anything.

How to work:
- Read before you answer. The answer is usually already in a file, and guessing from memory is how you end up confidently wrong about something that matters.
- Use search and list_dir to find the right file rather than assuming a path.
- When asked to change something, make the edit with edit_file and say in one line what you changed. Do not paste the whole document back.
- Keep the existing structure and conventions of a page you edit. These pages are read by a person, not just by you.
- Dates absolute, never "last week". URLs verbatim, query strings included.
- Plain words, short sentences, no filler. No em dashes: comma, colon, full stop or parentheses.

Writes are committed to git where the root is a repository, so an edit is recoverable. Deleting and renaming are not yours to do: they are buttons in the listing, and if one is needed, say so and let the user click it.

${openPath ? `The user is looking at: ${openPath}` : 'The user is looking at the file listing.'}`
}

/** The blocks the Messages API streams back, as this file assembles them. */
type Block =
  | { type: 'text'; text: string }
  | { type: 'tool_use'; id: string; name: string; json: string }

/** Only the fields this file reads off the stream. */
interface StreamEvent {
  type: string
  index: number
  content_block?: { type: string; id: string; name: string }
  delta?: { type?: string; text?: string; partial_json?: string; stop_reason?: string }
}

export function makeAgent(config: Config, files: Files, audit: Audit) {
  async function runTool(name: string, input: ToolInput): Promise<ToolResult> {
    if (name === 'list_dir') {
      const entries = await files.list(toSegments(input.path))
      return entries
        .map((e: Entry) => `${e.isDir ? 'dir ' : '    '}${e.name}${e.isDir ? '/' : ''}\t${e.size}\t${e.modified.slice(0, 10)}`)
        .join('\n') || '(empty)'
    }
    if (name === 'read_file') {
      const segments = toSegments(input.path)
      if (!isEditable(segments[segments.length - 1] || '')) return 'Not a text file.'
      const text = await files.read(segments)
      return text.length > 120000 ? text.slice(0, 120000) + '\n... (truncated)' : text
    }
    if (name === 'search') {
      return search(input.query ?? '')
    }
    if (name === 'edit_file') {
      const segments = toSegments(input.path)
      // Same guard write_file uses. Without it, a string-replace lands on
      // whatever bytes are at that path: an image or a PDF gets silently
      // corrupted rather than refused, since old_string/new_string are text.
      if (!isEditable(segments[segments.length - 1] || '')) return { message: 'Refusing: not a text file.' }
      const before = await files.read(segments)
      const count = before.split(input.old_string ?? '').length - 1
      if (count === 0) return { message: 'old_string not found. Read the file and match it exactly.' }
      if (count > 1) return { message: `old_string appears ${count} times. Include more surrounding text so it is unique.` }
      const after = before.replace(input.old_string ?? '', input.new_string ?? '')
      const res = await files.write(segments, after, `viewer: edit ${input.path}`)
      return { message: `Edited ${res.path}${res.commit ? ` (commit ${res.commit})` : ''}.`, changed: res.path }
    }
    if (name === 'write_file') {
      const segments = toSegments(input.path)
      if (!isEditable(segments[segments.length - 1] || '')) return { message: 'Refusing: not a text file.' }
      const res = await files.write(segments, input.content ?? '', `viewer: write ${input.path}`)
      return { message: `Wrote ${res.path}${res.commit ? ` (commit ${res.commit})` : ''}.`, changed: res.path }
    }
    return `Unknown tool: ${name}`
  }

  /** A plain walk. rg would be faster, but a dependency-free tree of notes is
   *  small enough that correctness beats speed here. */
  async function search(query: string) {
    const needle = String(query || '').toLowerCase()
    if (!needle) return 'Empty query.'
    const hits: string[] = []
    async function walk(segments: string[]): Promise<void> {
      if (hits.length >= 40) return
      const entries = await files.list(segments).catch(() => [])
      for (const e of entries) {
        if (hits.length >= 40) return
        const next = [...segments, e.name]
        if (e.isDir) {
          await walk(next)
        } else if (isEditable(e.name) && e.size < 2_000_000) {
          const text = await files.read(next).catch(() => '')
          const i = text.toLowerCase().indexOf(needle)
          if (i >= 0) {
            const line = text.slice(Math.max(0, i - 60), i + 120).replace(/\s+/g, ' ').trim()
            hits.push(`${next.join('/')}: ...${line}...`)
          }
        }
      }
    }
    await walk([])
    return hits.length ? hits.join('\n') : 'No matches.'
  }

  /**
   * One turn of conversation, streamed to `emit`. Loops while the model asks
   * for tools, up to config.maxTurns, so a runaway agent stops on its own.
   */
  async function run(
    { prompt, openPath, history = [] }: { prompt: string; openPath?: string; history?: ChatMessage[] },
    emit: (event: AgentEvent) => void,
  ): Promise<void> {
    if (!config.anthropicKey) {
      emit({ type: 'error', message: 'No ANTHROPIC_API_KEY set. Add one to .env.local and restart.' })
      return
    }
    const messages: ApiMessage[] = [...history, { role: 'user', content: prompt }]
    audit({ event: 'agent.prompt', path: openPath || '/', chars: prompt.length })

    for (let turn = 0; turn < config.maxTurns; turn++) {
      const res = await fetch(config.apiUrl, {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          'x-api-key': config.anthropicKey,
          'anthropic-version': '2023-06-01',
        },
        body: JSON.stringify({
          model: config.model,
          max_tokens: 4096,
          stream: true,
          system: systemPrompt(config, openPath),
          tools: TOOLS,
          messages,
        }),
      })
      if (!res.ok) {
        emit({ type: 'error', message: `API ${res.status}: ${(await res.text()).slice(0, 300)}` })
        return
      }

      const blocks: Block[] = []
      let stopReason: string | null = null
      await readSse(res, (event: StreamEvent) => {
        if (event.type === 'content_block_start' && event.content_block) {
          const start = event.content_block
          blocks[event.index] = start.type === 'tool_use'
            ? { type: 'tool_use', id: start.id, name: start.name, json: '' }
            : { type: 'text', text: '' }
          if (start.type === 'tool_use') emit({ type: 'tool', name: start.name })
        } else if (event.type === 'content_block_delta' && event.delta) {
          const b = blocks[event.index]
          if (!b) return
          if (event.delta.type === 'text_delta' && b.type === 'text') {
            b.text += event.delta.text ?? ''
            emit({ type: 'text', delta: event.delta.text ?? '' })
          } else if (event.delta.type === 'input_json_delta' && b.type === 'tool_use') {
            b.json += event.delta.partial_json ?? ''
          }
        } else if (event.type === 'message_delta') {
          stopReason = event.delta?.stop_reason || stopReason
        }
      })

      const content: ApiBlock[] = blocks.filter(Boolean).map((b) =>
        b.type === 'tool_use'
          ? { type: 'tool_use', id: b.id, name: b.name, input: safeJson(b.json) }
          : { type: 'text', text: b.text },
      )
      messages.push({ role: 'assistant', content })

      const calls = content.filter((b) => b.type === 'tool_use')
      if (stopReason !== 'tool_use' || calls.length === 0) {
        emit({ type: 'done' })
        return
      }

      const results: ApiBlock[] = []
      for (const call of calls) {
        let out: ToolResult
        try {
          out = await runTool(call.name, call.input || {})
        } catch (err) {
          out = { message: `Error: ${errorMessage(err)}` }
        }
        // edit_file/write_file return { message, changed? }; every other tool
        // returns a plain string. Only a truthy `changed` means the write
        // actually landed, which is what the browser uses to decide whether
        // to reload the note it has open. Reporting "changed" for a call the
        // tool refused (wrong path, no match, not a text file) would tell the
        // user a file moved when it did not.
        const text = typeof out === 'string' ? out : out.message
        if (typeof out === 'object' && out.changed) emit({ type: 'changed', path: out.changed })
        results.push({ type: 'tool_result', tool_use_id: call.id, content: text })
      }
      messages.push({ role: 'user', content: results })
    }
    emit({ type: 'error', message: 'Stopped: too many tool turns.' })
  }

  return { run }
}

function safeJson(s: string): ToolInput {
  try {
    return s ? JSON.parse(s) : {}
  } catch {
    return {}
  }
}

/** Minimal SSE reader for the Anthropic stream. */
async function readSse(res: Response, onEvent: (event: StreamEvent) => void): Promise<void> {
  // A 200 with no body is not something the API does, but fetch's types allow
  // it and a crash here would take the whole conversation down.
  if (!res.body) throw new Error('The API returned no body to stream.')
  const reader = res.body.getReader()
  const decoder = new TextDecoder()
  let buffer = ''
  for (;;) {
    const { done, value } = await reader.read()
    if (done) break
    buffer += decoder.decode(value, { stream: true })
    let i
    while ((i = buffer.indexOf('\n\n')) >= 0) {
      const chunk = buffer.slice(0, i)
      buffer = buffer.slice(i + 2)
      for (const line of chunk.split('\n')) {
        if (!line.startsWith('data:')) continue
        const data = line.slice(5).trim()
        if (!data || data === '[DONE]') continue
        try {
          onEvent(JSON.parse(data))
        } catch {
          // A partial frame is not worth killing the stream over.
        }
      }
    }
  }
}
