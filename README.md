# context-viewer

**A lightweight file viewer with AI capabilities.**

A small web app that serves one directory of documents: browse it, read it,
rename and delete files, and ask an agent to edit them while you watch.

![context-viewer showing its own source](docs/screenshot.png)

Point it at a directory and it works. Nothing about the code knows what is in
the tree, which is the whole idea: the files stay wherever they live, in
whatever repo they belong to, and this is only a way to look at them.

```bash
npm start                      # http://127.0.0.1:3064
```

That's it. Nothing is required first: open the browser, `/_ctx/setup` asks for a
directory, a username and a password, and you're in. `.env.local` is only for
a scripted deployment that wants to skip that screen — see `.env.example`.

### Settings

Everything past the first run lives behind the login, no file to edit:

- **`/_ctx/setup`** runs once, the first time an instance has no account yet.
  Picks the directory (if `ROOT_DIR` wasn't set by env), the username and the
  password. It closes itself the moment an account exists — visiting it again
  just redirects to `/_ctx/login` — so whoever completes it first is the only
  account this instance will ever have on its own. Finish it before the port
  is reachable from anywhere but you.
- **`/_ctx/settings`** changes the directory, the Anthropic API key, the model,
  and the username/password (which requires the current one), all live, no
  restart. A bad directory is rejected with the reason, not silently ignored.

Everything saved through either page persists to `_data/settings.json` (mode
600, git-ignored), which takes over from `.env.local` for whatever it holds.
The API key is never rendered back into the page, only a masked hint that it
is set. The session-signing secret is generated on first boot if not given
and persisted the same way, so nobody has to run a command just to get a
cookie to work.

No dependencies, no build step, no framework. Node 20 or newer, `node server.js`,
that is the whole runtime.

## What it does

- **Browse.** A folder is a table: name, size, created, modified, and sorting on
  any of them through plain `?sort=&dir=` links. Works with JavaScript off.
- **Read.** A VS Code-shaped workbench: activity bar, file tree, tabs,
  breadcrumbs, minimap, status bar. Any HTML renders; there is no layout class
  or attribute a document has to carry. Eight typographic themes.
- **Source control.** The sidebar's second view: what changed, commit it, push
  (with a confirmation, since that one leaves the machine), pull, and history.
- **Markdown and HTML both render.** Markdown through a small built-in
  renderer; HTML as written, with its own `<style>` scoped to the document so
  a file cannot restyle the app around it.
- **A viewer, not an editor.** No syntax highlighting and no typing into files,
  which is what keeps this dependency-free. Edits go through the agent.
- **Make it yours.** `public/viewer.css` is generic and stays that way. Drop a
  `public/custom.css` next to it (git-ignored, absent by default) and it loads
  after, scoped to `.cv-content`, for whatever conventions your own documents
  use.
- **View source.** Right click anything in the tree, or use the row's ⋮:
  open, view source, copy path, rename, delete. Source view lives at
  `/file#mode=source` and comes with line numbers, as do code files by default.
- **Rename and delete.** Buttons on the row, appearing on hover. Delete moves the
  file to the trash directory rather than unlinking it.
- **Ask.** An agent with four tools (`list_dir`, `read_file`, `search`,
  `edit_file`, `write_file`) scoped to the root. It streams, and when it edits
  the file you are reading, the page swaps in the new version in place.
- **Settings.** `/_ctx/setup` on first run, `/_ctx/settings` after: the served
  directory, the agent's API key and model, and the account, all live, no
  restart and no file to edit.

## Created dates come from git

The filesystem cannot answer "when was this written". Every file's birthtime is
the day the tree landed on this machine, which for anything older reads as later
than its own mtime. So the created column asks git for the commit that first
added the file, one call per directory, cached. Files from a repo's initial
import all read as that import date, which is the best that exists.

Where the root is not a repo, the column falls back to birthtime and means less.

## The security model

This app writes, so the boring parts matter.

- **One resolver.** `resolveWithin()` in `lib/safe.js` rejects traversal segments
  before touching disk, then realpaths and proves the result is still inside the
  root, so a symlink cannot escape either. Every read and every write goes
  through it, including all of the agent's tools. **Do not add a second way to
  open a file**, and do not give the agent a tool that takes an absolute path or
  shells out: that property is the reason it is safe to point this at a tree of
  personal documents.
- **One gate.** Every route calls `session()` first. Not a middleware matcher: a
  matcher is one careless pattern away from exposing a route.
- **Auth is a username and password**, both required, both checked with
  timing-safe compares so a bad username costs the same time as a bad password
  and neither is revealed to be the wrong one. Password hashing is scrypt,
  session cookies are HMAC-SHA256, both on `node:crypto` alone: no session
  library, no auth framework. A lockout follows repeated failures. The cookie
  is `HttpOnly`, `SameSite=Strict` and `__Host-` prefixed behind TLS.
  State-changing requests also check the origin.
- **The account is created once, by whoever gets to `/_ctx/setup` first.** The
  same limitation Seq and most self-hosted tools accept: there is no invite
  flow and no recovery flow, because there is exactly one account. Complete
  setup immediately after first boot, before the port is reachable from
  anywhere it doesn't need to be. Changing the password afterward requires
  the current one.
- **Every response carries hardening headers**: `X-Content-Type-Options`,
  `X-Frame-Options: DENY`, `Referrer-Policy: no-referrer`, `X-Robots-Tag`,
  `Strict-Transport-Security` behind TLS, and a `Content-Security-Policy`.
  The CSP is strict (`script-src 'self'`, no inline) everywhere except the
  document page, which is the one place someone else's HTML gets embedded
  wholesale: some notes carry an inline `<style>` or a hand-rolled `<script>`,
  so that one response relaxes to `'unsafe-inline'` plus a short, explicit
  allowlist of hosts a note is actually known to load (see `DOC_CSP` in
  `server.js`). Add a host there only when a note genuinely needs it.
- **Everything is logged** to `_data/audit.jsonl`: sign-ins, failures, every
  file served, every write, every prompt.
- **Writes are commits.** Where the root is a git repo, each edit, rename and
  delete commits, so anything the agent does is recoverable with `git revert`.
- **Delete is trash, not unlink.** The trash directory sits outside the root by
  default. Inside it, a deleted document would stay in the git history, keep
  turning up in search, and still be one URL away.

## The screenshot

`ops/screenshot.js` takes it, headless, driving Chrome over the DevTools
protocol so it can arrive already signed in. It points at this repo viewing its
own source on purpose: the screenshot of a file browser is a screenshot of
somebody's files, and this one ships publicly.

```bash
node ops/screenshot.js http://127.0.0.1:3064/README.md "$SESSION_COOKIE" docs/screenshot.png
```

## Not done yet

- No email alerts on sign-in or failure. The audit log records them.
- No search page. The agent can search, you cannot yet.
- No mobile layout pass.
