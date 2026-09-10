import { NextRequest } from 'next/server'
import fs from 'node:fs/promises'
import path from 'node:path'
import { files, config } from '@/server/runtime'
import { requireSessionJson } from '@/server/session'
import { markdown } from '@/lib/markdown'
import { kindOf } from '@/lib/files'
import { OutsideRootError } from '@/lib/safe'
import { errorMessage } from '@/lib/errors'

/**
 * The document, as its own HTML page, for the iframe in the workbench to load.
 *
 * This is the whole reason documents are no longer injected into the page.
 * A note is a complete HTML file: it has a head, it links its own stylesheet,
 * and some of them define custom elements in their own script. Lifting the
 * body out and dropping it into the workbench meant none of that ran, so a
 * note rendered one way here and a different way when you opened the file in
 * a browser. An iframe is a real document boundary, so the note gets its own
 * head, its own scripts and its own styles, and cannot reach the workbench
 * around it. scopeStyles() and extractBody() existed only to fake that
 * boundary, and both are gone.
 *
 * What is still added to an HTML note: the theme tokens, the optional ctx-
 * components and the two scripts. Never viewer.css, which styles body, bare
 * headings, paragraphs, links and code: right for the documents this app
 * renders itself, wrong for somebody else's finished page. A note is
 * self-sufficient, and the only thing it opts into is a class named ctx-.
 */

/**
 * What a note that brought its own HTML gets, and all it gets: the optional
 * ctx- components, and the script that lets a link in it open a tab.
 *
 * No themes.css and no theme.js either. A theme is the workbench's colours,
 * and a note that ships its own palette does not want them: themes.css states
 * `color-scheme: dark` for every dark theme, which flips the note's default
 * ink to white and its canvas to black underneath cards it painted light.
 * components.css carries the default theme's values as fallbacks, so a ctx-
 * component still looks right here with nothing under it.
 */
const NOTE_HEAD = `<link rel="stylesheet" href="/_ctx/assets/components.css">
<script src="/_ctx/assets/doc-frame.js"></script>`

/** Our own shells (markdown, source, plain text) have no styles of their own,
    so they take viewer.css as well: it is what renders them. */
const HEAD = `<link rel="stylesheet" href="/_ctx/assets/themes.css">
<link rel="stylesheet" href="/_ctx/assets/viewer.css">
<link rel="stylesheet" href="/_ctx/assets/components.css">
<script src="/_ctx/assets/theme.js"></script>
<script src="/_ctx/assets/doc-frame.js"></script>`

/** Code is shown as source whichever way you arrive at it. */
const CODE = new Set(['js', 'mjs', 'ts', 'tsx', 'css', 'json', 'yml', 'yaml', 'sh', 'py', 'rb', 'go', 'rs', 'toml', 'ini', 'sql'])

function isCode(name: string): boolean {
  return CODE.has(path.extname(name).slice(1).toLowerCase())
}

const esc = (s: string) =>
  s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c] as string)

/**
 * Line numbers are a CSS counter in ::before, not markup: one block element
 * per line and the number drawn as a counter, so selecting the code and
 * copying it does not pick the numbers up.
 */
function codeBlock(raw: string): string {
  const lines = raw.replace(/\r\n?/g, '\n').split('\n')
  return `<pre class="ctx-code"><code>${lines.map((l) => `<span>${esc(l) || '​'}</span>`).join('')}</code></pre>`
}

/** Our own shell, for the files that are not already an HTML document. */
function shell(title: string, body: string, cls: string): string {
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(title)}</title>
${HEAD}
</head>
<body class="ctx-frame">
<article class="${cls}">${body}</article>
</body>
</html>`
}

/**
 * Add our head to a note's own, without touching anything it wrote.
 *
 * The lookahead in each pattern is load-bearing: `<head[^>]*>` also matches
 * `<header>`, so a note with no <head> of its own but a <header> in its body
 * had our stylesheets injected into the middle of that header instead, where
 * the browser hoists nothing. Found the day this split was made, on a note
 * that is exactly that shape.
 */
function withOurHead(raw: string): string {
  const head = /<head(?=[\s>])[^>]*>/i
  if (head.test(raw)) return raw.replace(head, (m) => `${m}\n${NOTE_HEAD}`)
  const html = /<html(?=[\s>])[^>]*>/i
  if (html.test(raw)) return raw.replace(html, (m) => `${m}\n<head>${NOTE_HEAD}</head>`)
  // Neither tag: the browser builds both, and tags placed before the body get
  // hoisted into the head it builds. After the doctype, never before it, or
  // the page renders in quirks mode.
  const doctype = /^\s*<!doctype[^>]*>/i
  if (doctype.test(raw)) return raw.replace(doctype, (m) => `${m}\n${NOTE_HEAD}`)
  return `${NOTE_HEAD}\n${raw}`
}

export async function GET(req: NextRequest, ctx: { params: Promise<{ path: string[] }> }) {
  if (!(await requireSessionJson())) return new Response('Not signed in', { status: 401 })

  const { path: segments } = await ctx.params
  const mode = req.nextUrl.searchParams.get('mode')
  const name = segments[segments.length - 1] ?? ''

  try {
    const abs = await files.resolve(segments)
    const raw = await fs.readFile(abs, 'utf8')
    const kind = kindOf(name)

    let html: string
    if (mode === 'source' || isCode(name)) {
      html = shell(name, codeBlock(raw), 'cv-content ctx-is-code')
    } else if (kind === 'html') {
      html = withOurHead(raw)
    } else if (kind === 'markdown') {
      html = shell(name, markdown(raw), 'cv-content')
    } else {
      html = shell(name, `<pre class="cv-raw">${esc(raw)}</pre>`, 'cv-content')
    }

    return new Response(html, {
      headers: { 'content-type': 'text/html; charset=utf-8', 'cache-control': 'no-store' },
    })
  } catch (err) {
    if (err instanceof OutsideRootError) return new Response('Not found', { status: 404 })
    const missing = errorMessage(err).includes('ENOENT')
    return new Response(
      shell(
        missing ? 'Not here' : 'Cannot read',
        missing
          ? `<h1>This file is not here</h1><p>${esc(segments.join('/'))} has been moved, renamed or deleted.</p>`
          : `<h1>Cannot read this file</h1><p>${esc(errorMessage(err))}</p>`,
        'cv-content ctx-empty',
      ),
      { status: missing ? 404 : 500, headers: { 'content-type': 'text/html; charset=utf-8' } },
    )
  }
}
