'use client'

import { useCallback, useEffect, useRef, useState } from 'react'

/**
 * The app's own confirm/prompt/alert, because the browser's name the origin
 * in the title bar, cannot say "Move to the trash" in the app's own voice,
 * and on a page that has just been styled to look like an editor they read as
 * something a website did to you rather than something the app asked.
 *
 * Built on <dialog> and showModal(), which is the reason this is short: the
 * platform already does the focus trap, the Escape key, the inert background
 * and the backdrop. A hand-rolled overlay would be a hundred lines and worse
 * at all four.
 *
 * The API is promise-based so a call site reads the way the browser's did:
 *   if (!(await dialog.confirm({ ... }))) return
 */

type Request =
  | { kind: 'confirm'; title: string; body?: string; confirmLabel: string; danger: boolean; resolve: (v: boolean) => void }
  | { kind: 'prompt'; title: string; body?: string; confirmLabel: string; value: string; resolve: (v: string | null) => void }
  | { kind: 'alert'; title: string; body?: string; resolve: () => void }

export function useDialog() {
  const ref = useRef<HTMLDialogElement>(null)
  const [req, setReq] = useState<Request | null>(null)
  const [value, setValue] = useState('')
  // The promise must settle exactly once, whether it ends at a button, at
  // Escape, or at a click on the backdrop.
  const settled = useRef(false)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    if (req && !el.open) {
      settled.current = false
      el.showModal()
    }
    if (!req && el.open) el.close()
  }, [req])

  const finish = useCallback((outcome: 'ok' | 'cancel') => {
    setReq((current) => {
      if (current && !settled.current) {
        settled.current = true
        if (current.kind === 'confirm') current.resolve(outcome === 'ok')
        else if (current.kind === 'prompt') current.resolve(outcome === 'ok' ? value : null)
        else current.resolve()
      }
      return null
    })
  }, [value])

  const confirm = useCallback((o: { title: string; body?: string; confirmLabel?: string; danger?: boolean }) =>
    new Promise<boolean>((resolve) => setReq({
      kind: 'confirm', title: o.title, body: o.body,
      confirmLabel: o.confirmLabel ?? 'OK', danger: o.danger ?? false, resolve,
    })), [])

  const promptFor = useCallback((o: { title: string; body?: string; value?: string; confirmLabel?: string }) =>
    new Promise<string | null>((resolve) => {
      setValue(o.value ?? '')
      setReq({ kind: 'prompt', title: o.title, body: o.body, confirmLabel: o.confirmLabel ?? 'Rename', value: o.value ?? '', resolve })
    }), [])

  const alert = useCallback((o: { title: string; body?: string }) =>
    new Promise<void>((resolve) => setReq({ kind: 'alert', title: o.title, body: o.body, resolve })), [])

  const node = (
    <dialog
      className="ctx-dialog"
      ref={ref}
      // Escape fires cancel, not close, and without this the promise would
      // hang and the caller would wait forever for an answer nobody gave.
      onCancel={(e) => { e.preventDefault(); finish('cancel') }}
      onClose={() => finish('cancel')}
      // showModal centres the dialog in the viewport, so a click that lands on
      // the element itself rather than on its content is a click on the
      // backdrop around it.
      onClick={(e) => { if (e.target === ref.current) finish('cancel') }}
    >
      {req ? (
        <form method="dialog" onSubmit={(e) => { e.preventDefault(); finish('ok') }}>
          <h2>{req.title}</h2>
          {req.body ? <p>{req.body}</p> : null}
          {req.kind === 'prompt' ? (
            <input
              autoFocus
              value={value}
              onChange={(e) => setValue(e.target.value)}
              spellCheck={false}
              aria-label={req.title}
            />
          ) : null}
          <div className="ctx-dialog-actions">
            {req.kind === 'alert' ? null : (
              <button type="button" onClick={() => finish('cancel')}>Cancel</button>
            )}
            <button
              type="submit"
              autoFocus={req.kind === 'confirm'}
              className={req.kind === 'confirm' && req.danger ? 'danger' : 'primary'}
            >
              {req.kind === 'alert' ? 'OK' : req.confirmLabel}
            </button>
          </div>
        </form>
      ) : null}
    </dialog>
  )

  return { node, confirm, prompt: promptFor, alert }
}
