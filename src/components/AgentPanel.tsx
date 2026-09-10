'use client'

import { useCallback, useRef, useState } from 'react'
import type { AgentEvent, ChatMessage } from '@/lib/types'

interface Line {
  cls: 'me' | 'claude' | 'tool' | 'err'
  text: string
}

/**
 * The agent, as a terminal in the bottom panel. Streams over SSE, and when a
 * tool reports that it changed the file on screen, the document reloads.
 */
export function AgentPanel({
  hidden,
  onClose,
  openPath,
  onChanged,
}: {
  hidden: boolean
  onClose: () => void
  openPath: string
  onChanged: () => void
}) {
  const [lines, setLines] = useState<Line[]>([])
  const [busy, setBusy] = useState(false)
  const historyRef = useRef<ChatMessage[]>([])
  const logRef = useRef<HTMLDivElement>(null)
  const boxRef = useRef<HTMLTextAreaElement>(null)

  const scroll = useCallback(() => {
    const log = logRef.current
    if (log) log.scrollTop = log.scrollHeight
  }, [])

  const ask = useCallback(async () => {
    const box = boxRef.current
    const prompt = box?.value.trim()
    if (!prompt || busy) return
    if (box) box.value = ''
    setBusy(true)
    setLines((prev) => [...prev, { cls: 'me', text: prompt }, { cls: 'claude', text: '' }])
    scroll()

    let answer = ''
    let changed = false
    try {
      const res = await fetch('/_ctx/api/agent', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ prompt, path: openPath, history: historyRef.current }),
      })
      if (!res.ok || !res.body) {
        setLines((prev) => [...prev, { cls: 'err', text: `Request failed (${res.status})` }])
        return
      }
      await readStream(res, (event) => {
        if (event.type === 'text') {
          answer += event.delta
          // The assistant's line is the last one added; replace it in place
          // rather than appending a line per token.
          setLines((prev) => {
            const next = [...prev]
            for (let i = next.length - 1; i >= 0; i--) {
              if (next[i].cls === 'claude') { next[i] = { cls: 'claude', text: answer }; break }
            }
            return next
          })
        } else if (event.type === 'tool') {
          setLines((prev) => [...prev, { cls: 'tool', text: `· ${event.name}` }])
        } else if (event.type === 'changed') {
          changed = true
          setLines((prev) => [...prev, { cls: 'tool', text: `· edited ${event.path}` }])
        } else if (event.type === 'error') {
          setLines((prev) => [...prev, { cls: 'err', text: event.message }])
        }
        scroll()
      })
      historyRef.current.push({ role: 'user', content: prompt }, { role: 'assistant', content: answer })
      if (changed) onChanged()
    } finally {
      setBusy(false)
    }
  }, [busy, onChanged, openPath, scroll])

  return (
    <aside className="ctx-panel" hidden={hidden}>
      <header>
        <span className="title">Agent</span>
        <span className="hint">Enter to send, Shift+Enter for a new line</span>
        <button onClick={onClose} aria-label="Close">×</button>
      </header>
      <div className="ctx-log" ref={logRef}>
        {lines.map((l, i) => (
          <div key={i} className={`ctx-line ${l.cls}`}>{l.text}</div>
        ))}
      </div>
      <form
        className="ctx-prompt"
        onSubmit={(e) => { e.preventDefault(); void ask() }}
      >
        <textarea
          ref={boxRef}
          rows={2}
          placeholder="Ask about these files, or ask for an edit"
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); void ask() }
          }}
        />
        <button type="submit" disabled={busy}>{busy ? '…' : 'Send'}</button>
      </form>
    </aside>
  )
}

/** Minimal SSE reader: one JSON event per `data:` frame. */
async function readStream(res: Response, onEvent: (event: AgentEvent) => void): Promise<void> {
  if (!res.body) return
  const reader = res.body.getReader()
  const decoder = new TextDecoder()
  let buffer = ''
  for (;;) {
    const { done, value } = await reader.read()
    if (done) break
    buffer += decoder.decode(value, { stream: true })
    let i: number
    while ((i = buffer.indexOf('\n\n')) >= 0) {
      const raw = buffer.slice(0, i).replace(/^data: /, '')
      buffer = buffer.slice(i + 2)
      try { onEvent(JSON.parse(raw) as AgentEvent) } catch {}
    }
  }
}
