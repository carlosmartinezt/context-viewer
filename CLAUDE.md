# CLAUDE.md — context-viewer

A lightweight file viewer with AI capabilities, pointed at one directory of
documents. It started life as a page inside a personal website, which is
where the code came from and where the notebook stylesheet grew up.

Meant to be distributable: `npm start` with nothing configured boots into
`/_ctx/setup` and works on any server, with zero knowledge of what is in the tree
and no pre-generated secret to hand it.

```
app/                    the routes. Next.js App Router, one folder per URL.
  layout.tsx            <html>, the stylesheets, the pre-paint theme script
  (workbench)/          every page that renders the workbench chrome
    layout.tsx          the chrome, rendered once and kept across navigation
    page.tsx            the root listing
    [...path]/          a folder listing, or a document in its frame
    %5Fsettings/        /_ctx/settings, in a tab like any file
    %5Fcomponents/      /_ctx/components, the component reference
  (bare)/               sign in and first-run setup: no chrome, no session
  %5Fdoc/[...path]/     the document, as its own HTML page, for the frame
  %5Ffile/[...path]/    raw bytes: images, PDFs, a note's own css and js
  %5Fapi/               agent (SSE), rename, delete, git
src/lib/                the domain, and none of it knows about Next
  safe.ts               resolveWithin, the only path resolver
  files.ts              list, read, write, rename, trash, git
  auth.ts               scrypt password, HMAC cookie, lockout
  account.ts            hasAccount/createAccount/updateAccount
  settings.ts           the persisted store, and the Persisted type
  agent.ts              the Messages API, streaming, the tools
  markdown.ts, audit.ts, alerts.ts, smtp.ts, git.ts, config.ts
  types.ts              Config, Entry, TreeNode, AgentEvent, the shared shapes
  errors.ts             errorMessage / errorCode, for catch blocks
src/server/             the parts that may only run on the server
  runtime.ts            the singletons, built once per process
  session.ts            requireSession, the single gate
  origin.ts             the CSRF check for the JSON API
  api.ts                one wrapper for every JSON endpoint
  actions/              server actions: sign in, setup, settings
src/components/         the client: Workbench, Tree, Minimap, AgentPanel,
                        SourceControl, Listing, DocFrame, useTabs, themes
public/_ctx/assets/         viewer.css, themes.css, components.css, theme.js,
                        doc-frame.js, and custom.css if you add one
_data/                  audit log, trash, settings.json. Git-ignored
```

## Rules that are load-bearing

**Next.js, TypeScript, and nothing else.** The dependency list is `next`,
`react`, `react-dom` and `server-only`. It was zero for the first version, and
the reason to spend it was not features: it was that `render.js` had grown into
790 lines of HTML built by string concatenation, and `viewer.js` into 840 lines
of imperative DOM, both of which are the kind of code that is fine to write and
miserable to change. Everything that is not the framework is still hand-rolled
on `node:crypto`, `node:child_process` and the standard library: the password
hashing, the session cookie, the SMTP client, the markdown parser, the agent's
tool loop. Adding a library for any of those is still the wrong answer.

**Everything in `src/lib` is framework-agnostic and typed.** No import from
`next/*` belongs there. That is what lets `ops/*.js` run the same code from the
command line (node 22 strips the types, so they import the `.ts` directly), and
it is the boundary that would make the next move, whatever it is, cheap.

**Every path goes through `resolveWithin()`.** It is what keeps the agent inside
the root no matter what the model asks for. Do not add a second resolver, do not
give a tool an absolute path, do not shell out to anything that takes one.

**Dot-segments are rejected there too, not just hidden from listings.**
`listDir()` filters dotfiles out of what a directory shows, but until 9 Sep
2026 that filtering was cosmetic: `.git/config` was still reachable by direct
path, and `edit_file` had no extension check at all, so it could write
`.git/hooks/post-commit` — which `files.write()`'s own commit-after-every-write
then runs on the very next write. Found and fixed the same day, verified with
a live exploit attempt against a scratch repo before and after. The fix is one
check in `resolveWithin()`, so it covers the browser, the file route and every
agent tool at once. Do not add a route or a tool that reaches the filesystem
any other way.

**The agent cannot delete or rename.** Those are buttons in the listing. The
system prompt says so, and the tool list is the enforcement. Adding a delete
tool is how a bad afternoon starts.

**Trash lives outside the root.** Inside it, a deleted document stays in the git
history, keeps turning up in search and is still one URL away.

**`public/viewer.css` stays generic. Nothing in it may know how anyone
organises their files.** It styles the tree, the listing, the app's own pages
and ordinary HTML (headings, paragraphs, lists, tables, code, blockquotes),
and that is the whole remit. It is ~330 lines and should stay near that.

This was not always true: it started as a 2,330-line copy of the site's
stylesheet, and about 900 lines of it styled one person's filing conventions
while another 520 were dead selectors from the old site that no current code
emits. Split on 9 Sep 2026.

**Documents opt into components by class name: `public/components.css`.**
Four stylesheets, four remits, loaded in this order: `themes.css` (every
colour and type token), `viewer.css` (the workbench and ordinary HTML),
`components.css` (building blocks a note can use), `custom.css` (yours).

A note that wants a card, a status pill and a row of metadata had two options
before this file: two hundred characters of inline style per element, which is
what the notes in this tree grew into (unreadable, unmaintainable, and it
hard-codes one theme's hexes into a document fourteen other themes have to
render), or its own `<style>` block, which is self-contained but means every
note reinvents the same six components and they drift. `components.css` is the
third option: `<div class="ctx-card">` and the card already knows the theme.

Everything in it is prefixed `ctx-` and scoped to `.cv-content`, so no
component can reach the workbench, and no component styles a bare tag, so a
document that has never heard of the file is unaffected. Tones are named for
meaning (`ctx-tag-blocked`, not `ctx-tag-red`) and get their colour by mixing
one hue into the theme's own paper and ink, which is what makes a single hue
readable on cream and on near-black without fifteen pairs of values.

The set is: `ctx-header` / `ctx-eyebrow`, `ctx-meta`, `ctx-card` /
`ctx-card-head` / `ctx-sub` / `ctx-note`, `ctx-tag`, `ctx-chips` / `ctx-chip`,
`ctx-callout`, `ctx-grid`, `ctx-log`. **The reference page is the app's own
`/_ctx/components`**, written with the components it documents, so it breaks the
moment they do. Adding a component means adding its example there.

**Personal styling goes in `public/custom.css`.** Git-ignored, absent by
default, loaded after `viewer.css` when it exists (`customCss()` in
the root layout checks per request, so adding it needs no restart). If you
find yourself adding a selector to `viewer.css` for something only one
person's documents use, it belongs in `custom.css` instead. That split is what
makes the app worth handing to someone who organises their files differently.

**A document renders in an iframe, not injected into the page.** This is the
load-bearing decision of the whole viewer. A note is a complete HTML file: it
has a head, it links its own stylesheet, and some of them define custom
elements in their own script. Lifting the body out and dropping it into the
workbench meant none of that ran, so a note looked one way here and another way
when the same file was opened in a browser. `/_ctx/doc/<path>` serves the document
as its own page and `DocFrame` puts it in an iframe, which is a real document
boundary: everything the note wrote runs, and none of it can reach the
workbench around it.

Two whole mechanisms died with that change and must not come back.
`scopeStyles()` rewrote every selector in a note's `<style>` to sit under
`.cv-content`, and `extractBody()` pulled the body out of the file. Both
existed only to fake a boundary that the frame now provides for real. So did
`paintsItsOwnGround()`: a note that paints its own background simply fills its
frame.

**The document scope is `:where(.cv-content, :root[data-ctx-frame] body)`.**
Two things are a document: an article this app wraps its own pages in, and the
body of a framed note, which has no wrapper at all because it is somebody
else's file and may not even have a `<body>` tag. `doc-frame.js` marks the root
from the head, before the body is parsed, so there is no flash.

`:where()` and not `:is()`, and this is not a style preference: `:is()` takes
the specificity of its most specific branch, so widening the scope with it
silently lifted every document rule above the folder listing's own and
re-broke an alignment fixed the day before. Flat specificity is also the right
precedence inside a frame, because a note's own stylesheet should win over our
defaults in its own document.

**The frame talks to the workbench by postMessage, and only about things a
document cannot do for itself.** `doc-frame.js` is deliberately tiny: a link
inside a note opens a tab in the workbench rather than navigating the frame
away from under the tab bar, scrolls are forwarded so the minimap can draw its
viewport box, and a click dismisses a menu left open outside. Everything else a
note does is now none of our business.

**`/_ctx/doc` adds to a note's head, it never rewrites its content.** For the
shells this app builds itself (markdown, source, plain text) that is three
stylesheets and the two scripts. **An HTML note gets `components.css` and
`doc-frame.js`, and nothing else.** A file that is already a complete HTML
document is self-sufficient: it renders here exactly as it renders when you
open it in a browser, and the one thing it opts into is a class named `ctx-`,
which is optional too. Two heads in the route, `NOTE_HEAD` and `HEAD`; do not
collapse them back into one.

*Not `viewer.css`*, which styles `body`, bare headings, paragraphs, links and
code: right for a document this app renders, wrong for somebody else's
finished page.

*Not `themes.css` or `theme.js` either*, and this is the half that is easy to
get wrong. A theme is the workbench's colours. `themes.css` states
`color-scheme: dark` for every dark theme, so loading it in a note flipped the
note's default ink to white and its canvas to black underneath cards the note
had painted light: a page that was readable in a browser was unreadable here.
Because the note now has no theme, its frame must not be given one either:
`.ctx-doc iframe[data-note]` is `color-scheme: light; background: Canvas`, the
browser's own page ground, and `DocFrame` sets that attribute from the
extension. It also skips the theme sync for a note, since there is nothing in
there to sync.

*So `components.css` has to stand on its own.* It is loaded inside a note with
no `themes.css` under it, so every theme token it reads carries the default
theme's value as its fallback: `var(--paper, #fdfcfa)` and so on. Adding a
token to that file means giving it a fallback too, or the component loses its
colour in exactly the place the file exists to serve.

*The tag match needs its lookahead.* `<head[^>]*>` also matches `<header>`, so
a note with no head of its own but a `<header>` in its body had our stylesheets
injected into the middle of that header, where nothing hoists them. It is
`<head(?=[\s>])`, and the no-head fallback inserts after the doctype rather
than before it, or the page renders in quirks mode.

**Themes are token blocks, nothing else, and there is one axis.**
`data-ui-theme` is the workbench's colours (thirteen tokens: `--bg`,
`--paper`, `--chrome`, `--accent` and the rest), and it lives in
`public/_ctx/assets/themes.css`, which loads before `viewer.css`. Nothing in
`viewer.css` hard-codes a colour, so adding a theme is one `:root[...]` block
and no new selectors, ever. The default is Paper. Adding one means adding its
name to `UI_THEMES` in `src/components/themes.ts`; a dark one also goes in the
shared dark selector in `themes.css`, which is where `--hover`, the status inks
and `color-scheme: dark` come from.

The fifteen colour themes are ports of VS Code's (Light+, Quiet Light, Dark+,
Dark Modern, Abyss, Monokai, Solarized both ways, Kimbie, Red, Tomorrow Night
Blue, both high contrasts), plus Paper, this app's own warm light theme and
the default. The choice is remembered per browser (`cvUiTheme`) and applied
before paint by `theme.js`.

**Document typography is one fixed setting, not a choice.** There was a second
axis, `data-doc-theme`, with twelve named ways to set a page (notebook,
editorial, typewriter, book, manuscript, and so on). It is gone: removed 10 Sep
2026 because nobody wanted to pick one. The `--doc-*` tokens it varied are
still there and still load-bearing (face, size, leading, tracking, heading
scale, `--doc-gap`, measure), now stated once on bare `:root` at the values the
old swiss-tight default used. Do not reintroduce a per-document layout class or
a second theme attribute to bring it back.

What must keep working, and what the removal was checked against: a document's
paper and ink follow the UI theme (`--doc-paper: var(--paper)`, `--doc-ink:
var(--text)`), so choosing a dark chrome darkens the page under the text with
it, inside the frame as well as outside. Verified by switching to Dark+ with a
document open and watching `--doc-paper` go from `#fdfcfa` to `#1e1e1e` in the
iframe's own root.

**The UI is VS Code's, on purpose.** Activity bar, sidebar (explorer and
source control), tabs, breadcrumbs, minimap, a bottom panel for the agent, a
status bar. That is the shape people already know for "browse a directory and
read what is in it", so it needs no explaining.

It is a **viewer, not an editor**: no Monaco, no CodeMirror, no syntax
highlighting, no typing into files. The agent does the editing.

**The chrome is a layout, so it survives navigation.** `app/(workbench)/
layout.tsx` renders it once; moving between files changes only `children`, and
the tab strip, the tree's open folders and the agent's conversation are all
still there afterwards. That is what replaced the old `?fragment=1` fetch and
`innerHTML` swap, and it is why there is no longer any HTML built by string
concatenation in this app.

**A refresh and a push in the same tick: the refresh loses.** The tree comes
from the layout, so re-reading the directory after a rename or a delete is
`router.refresh()`. Deleting the file you were looking at also navigates you
off it, and doing both together meant the push served the parent listing with
the layout the router already had: the file was gone from disk and from the
listing, and still in the sidebar until a reload. `afterFileChange()` navigates
first and refreshes on the other side of the navigation, when `pathname` has
actually changed. Deleting a file you are not looking at refreshes directly,
because there is no navigation to lose to.

**A rendered HTML note is titled by its own `<title>`.** `generateMetadata()`
reads the first 64KB of the file and `htmlTitle()` takes the title out of the
head, which is the same string a browser shows when the file is opened
directly, and usually better than the filename. Only the head is searched: a
`<title>` in the body belongs to an `<svg>`. The filename is the fallback, and
it stays the title in `?mode=source`, where you are looking at the file rather
than at the page it makes.

**Source view is `?mode=source`, a query and not a hash.** The old build put it
in the hash because a hash is never sent to a server and the document was
fetched as a fragment; with the document rendered on the server that reason is
gone, and a query is simply what a server can read. The behaviour it bought is
unchanged: the URL is shareable, and one file can be open twice, rendered in
one tab and as source in another.

**The workbench grid places every child explicitly.** Seven children and
implicit placement means the browser invents rows: the first version collapsed
the sidebar to zero height and dropped the editor on top of it. Every element
gets a `grid-area`.

**Markdown is `src/lib/markdown.ts`, about a hundred lines and no dependency.** It
covers what turns up in a notes directory and nothing more. Everything is
escaped before any markup is produced, so raw HTML inside a `.md` file is
shown rather than run, which is the right default for files the app did not
write.

**Chrome is a desk, the document is paper on it.** The two tones (`--chrome`,
`--paper`) used to be a hair apart and nothing read as a surface. The gap
between them is what stops the app looking flat, and it does the job with no
borders or shadows, which is why it was chosen over a card.

**Folder expansion is remembered per browser** (`cvExpanded` in localStorage),
read on mount rather than during render, because localStorage does not exist on
the server and reading it while rendering would make the two disagree. The server only
knows to open the path you arrived on.

**Documents get no boxes.** Code blocks are an indented rule, not a card;
tables rule the header only; blockquotes have no left bar. Simplicity was
asked for explicitly, twice. Keep it.

**The tree has one context menu, moved to the pointer.** Right click or the
row's ⋮, both open it: open, view source, copy path, rename, delete. It is a
single element repositioned rather than a menu per row, and file-only items
hide themselves on a folder.

**Every open adds a tab.** VS Code's preview slot, where a single click reuses
the last tab, is deliberately not copied: it throws away the file you were
just looking at.

**Source view rides in the hash: `/README.md#mode=source`.** A hash is never
sent to a server, so `open()` turns it into `?mode=source` on the fragment
request and puts it back as a hash afterwards. That keeps the URL shareable
and lets one file be open twice, rendered in one tab and as source in another.
Code files (js, css, json, yml, sh, py, …) are source either way.

**Line numbers are a CSS counter in `::before`, not markup.** One block
element per line, the number drawn as a counter. Selecting the code and
copying it does not pick the numbers up, which is the whole reason not to put
them in a gutter column.

**Settings is a document, not a page.** `/_ctx/settings` opens in a tab like any
file: `settingsBody()` is what the tab fetches, `settingsPage()` wraps the
same body in the workbench for a direct URL. Its forms are ordinary
`<form method="post">` and still work with no JavaScript; inside a tab
`settingsForms()` posts them in the background, because a normal submit would
navigate the whole workbench away and close every open tab.

**Sign in and setup are one card on the desk.** `.cv-auth` is the chrome
tone, `.cv-card` is paper with the same 2px accent top edge the active tab
wears, so the door is made of the parts the workbench is made of and not of a
brand. Fields carry visible labels rather than placeholder-only ones (the
placeholder disappears the moment you type into it), the error sits above the
button where you are already looking, and the button says the same word the
heading does. The login page never names the directory it guards: that is one
fact a stranger should not get before authenticating.

**Two radii and no more: `--r1` for a control in a row, `--r2` for a surface
that floats.** Documents get neither, because a document is paper and paper
has corners.

**Ink on a filled surface is a token, twice: `--on-accent` and `--on-focus`.**
`--accent` and `--focus` are different colours in most themes, and a theme
with a pale accent needs dark ink on its buttons: white on Dark Modern's
`#4daafc` is not readable. Every theme with a pale accent states its own.

**Scrollbars are themed.** The browser default is a light chunky bar whatever
sits under it, which is the loudest way a dark theme gives itself away. One
`::-webkit-scrollbar` block plus `scrollbar-width`, drawn from `--scroll`.

**The agent panel starts closed.** It is something you reach for, not
something already open when you arrive.

**Preferences live behind the gear, not in the toolbar.** Themes and the
minimap toggle are in the activity bar's menu.

**The agent lives in the status bar**, as an icon and a label, dressed as a
status item: no border, no card, the strip's own height, a hover wash and
`aria-expanded` because the button is the only handle on a panel that may be
closed. It was in the toolbar until 10 Sep 2026; the toolbar now holds only
breadcrumbs.

**`[data-menu]` is the dismiss handler's hook and nothing else. Menus are
positioned by class.** When that attribute did both jobs, the context menu
picked up the gear menu's `bottom` and, already carrying an inline `top`,
stretched between the two: 145px of items in a 377px box, with the empty part
still swallowing the clicks meant to close it. The gear menu is
`.ctx-root-menu`, the context menus are `.ctx-context`, and both carry
`data-menu` purely so a click inside them is not a click outside.

**Confirm, prompt and alert are `src/components/Dialog.tsx`, not the
browser's.** `useDialog()` returns a promise-based `confirm`/`prompt`/`alert`
and the node to render, so a call site reads the way the native one did. It is
built on `<dialog>` and `showModal()`, which is why it is short: the platform
already provides the focus trap, Escape, the inert background and the
backdrop, and a hand-rolled overlay would be longer and worse at all four.
Escape and a backdrop click resolve the same way Cancel does, and the promise
settles exactly once however it ends. Delete is the only action coloured
`danger`, because it is the only one that is hard to take back.

**The tab strip scrolls the active tab into view.** The strip overflows once
there are a dozen tabs, and a tab opened past its right edge was added
somewhere you could not see. `scrollIntoView({ inline: 'nearest' })`, so a tab
already on screen does not slide around under the pointer.

**The narrow layout keeps all four grid columns.** Under 800px the sidebar
floats over the workbench, and the columns become `var(--activity) 0 0 1fr`
rather than dropping to three. Every `grid-area` in this file is written
against the four-column line numbers, so removing a column left the editor in
an implicit fifth one and the status bar's `-1` stopping short of it: the bar
came out 48px wide with the open file's path squeezed to zero. Same failure
mode as the one the explicit-placement rule above already warns about.

**Source control is `src/lib/git.ts`, and push is the one action that leaves the
box.** It reports the remote it is pushing to and the browser confirms first,
because "commit" on a tree of personal documents is local and reversible
while "push" is neither. Pull is `--ff-only`: a merge conflict is not something
this panel can sensibly resolve.

`files.tree()` caps at 4,000 entries because "point it at any directory"
includes directories with a hundred thousand files in them and the tree is
built on every page render; anything past the cap is still reachable by
clicking into the folder.

**The relaxed CSP is set in `next.config.ts`, and the patterns are mutually
exclusive on purpose.** Every matching rule contributes a header, and two
`content-security-policy` headers are enforced as their intersection, so the
catch-all excludes by name everything that must stay strict. Sign in, setup,
the API and the assets get `script-src 'self'`; the workbench and the document
frame get `'unsafe-inline'`, because notes carry their own styles and scripts.

**`/_ctx/doc` is the one route that may be framed, and only by us.** Every other
response sends `x-frame-options: DENY`, which blocks same-origin framing too:
with it applied to `/_ctx/doc` the document pane came up as an empty box with a
broken-document icon. That route sends `SAMEORIGIN` and `frame-ancestors
'self'` instead.

**Tree indent is `--ctx-indent`, one token, used by the rows and the guides.**
The rows carry `--i:<depth>` and derive their padding from it. VS Code's 8px
step is legible against its 22px rows and always-on guides; here it left a
folder's children looking like its siblings, so the step is 14px and the
guides are always drawn rather than on hover.

**The CSP on the document route is a real, checked allowlist, not a wildcard.**
Every other route is strict (`script-src 'self'`, no inline, no exceptions).
The doc route relaxes to `'unsafe-inline'` because notes carry their own
`<style>`/`<script>` (a note may chart against Chart.js, say), plus one
explicit host (`cdnjs.cloudflare.com`) that notes load libraries from. Before adding a host to the workbench policy in `next.config.ts`, check what a note
really needs (`grep -rohE '<script[^>]+src="https?://[^"]*"'`) rather than
reaching for a broad `https:` wildcard, which defeats the point of having a CSP
at all. This check needs redoing whenever `ROOT_DIR` points somewhere new.

**`config` is a shared, mutable object, not a snapshot.** `src/lib/settings.ts`
mutates `config.root`/`config.anthropicKey`/`config.model`/`config.username`/
`config.passwordHash`/`config.sessionSecret` in place, and every module
(`files.ts`, `agent.ts`, the routes) reads those fields at call time rather
than closing over a copy, so a change from `/_ctx/setup` or `/_ctx/settings` is live
everywhere with no restart. The one place this needed care: `files.ts`'s "is
this a git repo" cache is keyed by `config.root`, not a single flag,
precisely because the root can change under it.

**`applySettings()` must load every persisted field, including
`sessionSecret`.** Found by testing this: a script that called
`applySettings()` without also calling `ensureSessionSecret()` signed a token
against an empty secret and it self-verified anyway, because signing and
checking happened in the same process with the same wrong value — it only
broke against the real server, which does call both in the right order. Fixed
by having `applySettings()` load `sessionSecret` like every other field, so
`ensureSessionSecret()` is purely "generate one if still missing" and nothing
downstream can get a different secret than the running server has depending on
which functions it remembered to call.

**No account means no login, not a broken one.** `hasAccount(config)` gates the
whole app before the session check even runs: with nothing configured, every
path (including `/_ctx/login`) redirects to `/_ctx/setup`, and the moment an account
exists, `/_ctx/setup` redirects to `/_ctx/login` and refuses to ever create a second
one. This is the one place a route is gated outside the normal session check,
because there is no session to check yet.

**Login takes a username and password, both required, both timing-safe.** Not
password-only: `safeEqual(username, config.username)` and `verifyPassword()`
both always run, so the response time and the error message never reveal which
field was wrong. Do not special-case an early return on a bad username.
Changing either later, in `/_ctx/settings`, requires the current password —
`updateAccount()` checks it unconditionally, and a successful change issues a
fresh session cookie in the same response, since the cookie's payload is
checked against `config.username` and a bare username change would otherwise
log the very request that made it out.

**Recovery is a local command, never a route.** `npm run factory-reset` forgets
every setting so the next visit boots into `/_ctx/setup` and the whole first-run
flow happens in the browser. `npm run reset-password` is the narrower version.
Both need the shell account that owns `_data/`, which is the same trust
boundary `settings.json` already sits behind. An online "reset everything"
button reachable from a login page you cannot get past is a door an attacker
can open too, to solve a problem the owner can already solve from a shell.
Factory reset forgets the root directory but never touches the documents in
it, and leaves `audit.jsonl` and the trash alone: neither is a setting, and the
log is the record that the reset happened. It backs up `settings.json` first.

**`/_ctx/setup` collects the alert config alongside the account and the root**, so
a factory reset genuinely restores everything in one screen. The mail fields
are optional and inside a `<details>`, because "npm start with nothing
configured works on any server" is a promise this page keeps: a mail server
nobody has yet must not stand between someone and their files. Half-filled is
rejected (a host with no recipient, or the reverse); typed values are echoed
back on error so a password typo does not empty the eight fields above it.

**Email is `src/lib/smtp.ts`, hand-rolled on `node:tls`, and the zero-dependency
rule survives.** EHLO, STARTTLS, AUTH PLAIN/LOGIN, MAIL/RCPT/DATA, QUIT, and
nothing else: no attachments, no MIME multipart, no HTML bodies, no queueing.
Two things it will not do: send in the clear (a server offering no STARTTLS on
587 is refused, because credentials and the subject line of a security alert
are not going out unencrypted), and trust a caller's string in a header
(`headerSafe()` strips CR/LF, or a subject could inject `Bcc:` and turn an
alert into a relay).

*Implicit TLS is a setting, not an inference from the port.* It defaults to
`port === 465`, but a server on a non-standard port is real, and guessing
wrong means connecting in plaintext to a TLS listener and hanging until the
timeout. That was a live bug, found on a fake server on port 2465.

*Replies are queued, not handed straight to a waiter.* The server speaks
first, so on an implicit-TLS connection the 220 greeting can arrive before the
code that wants it has asked; a reply handed to nobody is a hang. `expect()`
drains the queue before it agrees to wait. This was the second live bug, and
STARTTLS had been passing only by timing luck.

**Alerts hang off `audit()`, not off each call site.** Every event worth
mailing about is already logged, so one wrapper in `src/server/runtime.ts` means a newly
audited event can never be one someone forgot to alert on. `src/lib/alerts.ts`
decides what is worth sending, and the answer is almost nothing: the log took
180KB of `auth.required` from bots in a day, so the alert set is lockouts,
logins from an unseen IP, settings changes, account creation and factory
resets. A single mistyped password is not on the list; five of them become a
lockout, which is. Sending is fire-and-forget with a throttle, and every
failure lands in the audit log rather than in a request: a mail server being
down must never make a login hang.

**`referrer-policy` is `same-origin`, and changing it back to `no-referrer`
breaks every form in the app.** Chrome ties the `Origin` header on a
same-origin form POST to the referrer policy, so `no-referrer` made the
browser send the literal `Origin: null`, which matches no host. The app
rejected its own logins and its own setup posts. It shipped that way in the
first commit, and because `login()` reported every failure identically it
presented as a wrong password: the audit log holds exactly one `auth.success`,
timed 37 minutes before the commit that added the header. Nobody had forgotten
a password. `same-origin` still sends nothing to third parties.

**`Sec-Fetch-Site` is the primary CSRF signal, `Origin` only the fallback.**
The browser sets it, page script cannot forge it, and it does not depend on
the referrer policy, which is the trap the `Origin` comparison fell into.
`same-origin` and `none` pass; `same-site` and `cross-site` do not. `Origin:
null` with no `Sec-Fetch-Site` to fall back on is refused, because at that
point a legitimate old browser and a hostile page look identical.

**A rejected Origin is audited and says what it saw.** The CSRF check compares
the browser's `Origin` against, in order, `config.publicOrigin`, then
`X-Forwarded-Host`, then `Host`. Only the first does not depend on a header
the proxy controls, which is why `PUBLIC_ORIGIN` is set in `.env.local` here.
Until 9 Sep 2026 the check compared `Origin` to `Host` alone and returned a
bare `403 Bad origin.` with nothing written anywhere, so a rejection was
invisible from both sides.

*Worse, `login()` folded the origin check in with the credential checks*, so a
browser whose origin did not match got "Wrong username or password" no matter
what it typed, and five attempts locked the account. A correct password
presenting as a wrong one is what sends someone to reset a password that was
right all along. The response is still identical for all three failures, since
a caller must not learn which one it hit, but the audit log now distinguishes
`bad origin` from `bad credentials` and records the origin and what was
expected. If a login mysteriously fails, read the log before resetting
anything.

Trusting `X-Forwarded-Host` is safe only because the app listens on loopback
and Caddy overwrites that header on every request. Do not bind it to a public
interface without revisiting this.

**Writing style: no em dashes.** Comma, colon, full stop or parentheses.

## Running it

```bash
npm run dev              # next dev
npm run build            # required before start; output lands in .next
npm start                # next start, or: systemctl --user start context-viewer
npm run typecheck        # tsc --noEmit, and it is expected to be clean
npm run hash-password    # optional: prints a PASSWORD_HASH for a scripted deploy
npm run reset-password   # a way back in when the password is lost
npm run factory-reset    # forget the account and start from /_ctx/setup again
```

`npm start` serves the build, so a deploy is `npm ci && npm run build` before
the restart. The three `ops/*.js` scripts import from `src/lib/*.ts` directly:
node 22 strips the types, so they need no build of their own, and that only
works because nothing in `src/lib` imports from `next/*`. Keep it that way.

Nothing in `.env.local` is required. An instance may still set
`PORT`/`HOST`/`SESSION_TTL_SECONDS`/`SECURE_COOKIE`/`GIT_COMMITS` there as
explicit documentation of the running config, but the account, the directory,
the session secret and the agent's key all live in `_data/settings.json`.
`SECURE_COOKIE=false` is needed to test over plain http on localhost, because
`__Host-` requires Secure.

The agent needs a key, set through `/_ctx/settings` (or `ANTHROPIC_API_KEY` for a
scripted deployment). Without one, everything else still works and the panel
says it is not configured. `ANTHROPIC_BASE_URL` points the agent somewhere
else, which is how the tool loop gets tested without a real key.

**Signing in is a server action now, not a form post to `/_ctx/login`.** It still
works with JavaScript off, because that is what progressive enhancement means,
but `curl -d 'username=...&password=...' /_ctx/login` no longer mints a session:
the POST target is the action's own id. A script that needs a session should
build the cookie with `createSession()` from `src/lib/auth.ts` instead.

## Serving it

`ops/context-viewer.service` is a systemd **user** unit (no sudo, with
lingering enabled for the account that runs it). `ops/Caddyfile.block` is the
reference copy of the Caddy block: the live config is `/etc/caddy/Caddyfile`,
editing the repo copy changes nothing, and that edit needs root.

`flush_interval -1` in the proxy is not optional. The agent streams as
`text/event-stream` and a buffering proxy turns the whole conversation into one
lump at the end.
