/*
 * Runs inside the document iframe, and does only what a document cannot do
 * for itself: tell the workbench outside about things that must not happen
 * inside one pane.
 *
 * Kept deliberately small. Everything else a note does (its own styles, its
 * own scripts, its own custom elements) is none of our business now that it
 * has a real document of its own to do it in.
 */
(function () {
  /*
   * Mark the root before anything is painted. The document scope cannot be a
   * class on <body>, because a note is somebody else's HTML file and may not
   * have a <body> tag at all: this one has a doctype, a title and a custom
   * element, and the browser builds the body itself. This script sits in the
   * head, so documentElement already exists and the attribute is set before
   * the body is parsed, which is what keeps the stylesheets from flashing.
   */
  document.documentElement.setAttribute('data-ctx-frame', '')

  var parentWindow = window.parent
  if (parentWindow === window) return // Opened directly, not framed. Do nothing.

  function post(message) {
    try { parentWindow.postMessage(message, location.origin) } catch (e) {}
  }

  /*
   * A link inside a note must open a tab in the workbench, not navigate this
   * frame: navigating here would leave the tab bar, the breadcrumb and the
   * URL all pointing at the previous file. Links off the site keep their
   * normal behaviour, in a new tab, because this frame is not a browser.
   */
  document.addEventListener('click', function (e) {
    var a = e.target && e.target.closest && e.target.closest('a[href]')
    if (!a || e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey) return
    var href = a.getAttribute('href')
    if (!href || href.charAt(0) === '#') return

    var url = new URL(href, location.href)
    if (url.origin !== location.origin) {
      a.target = '_blank'
      a.rel = 'noopener noreferrer'
      return
    }
    e.preventDefault()
    // /_ctx/doc/x is how this frame addresses a file; the workbench knows it as /x.
    post({ type: 'ctx:open', path: url.pathname.replace(/^\/_ctx/doc/, '') + url.search })
  })

  // The minimap and its viewport box are drawn by the workbench from this
  // document's own scroll position, which it cannot observe from outside.
  addEventListener('scroll', function () {
    post({ type: 'ctx:scroll' })
  }, { passive: true })

  addEventListener('load', function () { post({ type: 'ctx:ready' }) })

  // A click anywhere in the document closes a menu left open in the workbench.
  document.addEventListener('mousedown', function () { post({ type: 'ctx:blur' }) })
})()
