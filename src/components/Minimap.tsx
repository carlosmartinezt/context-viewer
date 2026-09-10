'use client'

import { useCallback, useEffect, useRef, useState } from 'react'

/**
 * There is no editor here, so the minimap is a scaled-down clone of the real
 * DOM rather than a render of text. Cloning is cheap because a document is a
 * few hundred nodes, and it means the map always matches what is on screen.
 *
 * One number does all the work. `scale` is the factor the clone is drawn at,
 * and every other measurement is the document's own pixels multiplied by it.
 * Deriving the viewport box from anything else is what made it disagree with
 * the picture underneath.
 *
 * The document lives in an iframe now, so the source of the clone is either
 * that frame's document or, for this app's own pages, the pane itself. Both
 * are same-origin, so both can simply be read.
 */
export function Minimap({ paneRef, hidden, revision }: {
  paneRef: React.RefObject<HTMLDivElement | null>
  hidden: boolean
  revision: number
}) {
  const mapRef = useRef<HTMLDivElement>(null)
  const innerRef = useRef<HTMLDivElement>(null)
  const [scale, setScale] = useState(0)
  const [box, setBox] = useState<{ top: number; height: number } | null>(null)

  /** Whatever is actually scrolling: the frame's document, or the pane. */
  const scroller = useCallback((): HTMLElement | null => {
    const pane = paneRef.current
    if (!pane) return null
    const frame = pane.querySelector('iframe')
    if (frame) return (frame.contentDocument?.scrollingElement as HTMLElement) ?? null
    return pane
  }, [paneRef])

  const source = useCallback((): Element | null => {
    const pane = paneRef.current
    if (!pane) return null
    const frame = pane.querySelector('iframe')
    if (frame) return frame.contentDocument?.body ?? null
    return pane.firstElementChild
  }, [paneRef])

  const position = useCallback((withScale: number) => {
    const map = mapRef.current
    const s = scroller()
    if (!map || !s || !withScale) return setBox(null)
    // Nothing to drag when the document already fits, and a box that cannot
    // move is just a rectangle in the way.
    const scrollable = s.scrollHeight - s.clientHeight
    if (scrollable <= 1) return setBox(null)
    setBox({ top: s.scrollTop * withScale, height: Math.max(8, s.clientHeight * withScale) })
  }, [scroller])

  const draw = useCallback(() => {
    const map = mapRef.current
    const inner = innerRef.current
    const src = source()
    const s = scroller()
    if (!map || !inner || hidden) return
    inner.replaceChildren()
    if (!src || !s) return

    const copy = src.cloneNode(true) as HTMLElement
    copy.querySelectorAll('[id]').forEach((n) => n.removeAttribute('id'))
    // Scripts in the clone must never run: it is a picture, not a page.
    copy.querySelectorAll('script').forEach((n) => n.remove())
    inner.append(copy)

    // The clone is laid out at the pane's real width, not a fixed one, or it
    // wraps differently from the document and the map is a picture of a page
    // nobody is looking at.
    const paneWidth = Math.max(s.clientWidth, 1)
    inner.style.width = `${paneWidth}px`

    // Fit by width, unless the document is long enough that fitting by width
    // would overflow. The map shows the whole document; it never scrolls.
    const byWidth = map.clientWidth / paneWidth
    const byHeight = map.clientHeight / Math.max(s.scrollHeight, 1)
    const next = Math.min(byWidth, byHeight)
    inner.style.transform = `scale(${next})`
    setScale(next)
    position(next)
  }, [hidden, position, scroller, source])

  useEffect(() => {
    if (hidden) return
    // The frame has to have loaded before there is anything to clone.
    const timer = setTimeout(draw, 60)
    const onResize = () => draw()
    addEventListener('resize', onResize)

    const pane = paneRef.current
    const observer = pane && window.ResizeObserver ? new ResizeObserver(() => draw()) : null
    if (pane && observer) observer.observe(pane)

    // The frame posts its own scrolls out, since a cross-document scroll event
    // does not reach this window.
    const onMessage = (e: MessageEvent) => {
      if (e.origin !== location.origin) return
      if (e.data?.type === 'ctx:scroll') position(scale)
      if (e.data?.type === 'ctx:ready') draw()
    }
    addEventListener('message', onMessage)
    const onScroll = () => position(scale)
    pane?.addEventListener('scroll', onScroll, { passive: true })

    return () => {
      clearTimeout(timer)
      removeEventListener('resize', onResize)
      removeEventListener('message', onMessage)
      pane?.removeEventListener('scroll', onScroll)
      observer?.disconnect()
    }
  }, [draw, hidden, paneRef, position, scale, revision])

  /**
   * Click or drag scrolls the document to that point, with the clicked point
   * becoming the middle of the viewport, which is what makes dragging the box
   * feel like dragging the box. Divided by the same scale the clone is drawn
   * at, so clicking a paragraph lands on that paragraph.
   */
  const jump = useCallback((clientY: number) => {
    const map = mapRef.current
    const s = scroller()
    if (!map || !s || !scale) return
    const rect = map.getBoundingClientRect()
    const docY = (clientY - rect.top) / scale
    const max = Math.max(s.scrollHeight - s.clientHeight, 0)
    s.scrollTop = Math.min(max, Math.max(0, docY - s.clientHeight / 2))
    position(scale)
  }, [position, scale, scroller])

  return (
    <div
      className="ctx-minimap"
      ref={mapRef}
      hidden={hidden}
      onPointerDown={(e) => {
        try { e.currentTarget.setPointerCapture(e.pointerId) } catch {}
        jump(e.clientY)
      }}
      onPointerMove={(e) => { if (e.buttons === 1) jump(e.clientY) }}
    >
      <div className="inner" ref={innerRef} />
      <div className="viewport" hidden={!box} style={box ? { top: box.top, height: box.height } : undefined} />
    </div>
  )
}
