# CLAUDE.md

## Quick Context

**Chess Tracker** - Mobile-first read-only dashboard for kids' chess training. Renders markdown files from Google Drive as-is using react-markdown.

**Key Principle**: Website is READ-ONLY. Claude modifies markdown files directly. NO parsing - files render as-is with any structure.

**Production**: https://chess-tracker-taupe.vercel.app

## Before You Start

Read [docs/application-design.md](docs/application-design.md) for full architecture.

## Commands

```bash
npm run dev      # Dev server (localhost:5173)
npm run build    # TypeScript check + production build
npm run lint     # ESLint

# Deploy
npx vercel --prod
```

## Tech Stack

React 19 + TypeScript + Vite + TailwindCSS v4 + React Query + React Router v7

## Project Structure

```
src/
├── components/layout/   # Header, BottomNav, Layout
├── components/ui/       # VoiceInput, MarkdownViewer
├── pages/               # HomePage, CoachesPage, MorePage, FilePage, etc.
├── services/            # googleAuth, googleDrive, claudeServer
├── hooks/               # useAuth
├── types/               # User type only (no data types - no parsing)
docs/                    # Application design docs
```

## Critical Files

| What | Where |
|------|-------|
| OAuth whitelist | `src/services/googleAuth.ts` → `ALLOWED_EMAILS` |
| CSS utilities | `src/index.css` → `.card`, `.btn-primary` |
| File routes | `src/components/ui/MarkdownViewer.tsx` → `FILE_ROUTES` |
| Nav items | `src/components/layout/BottomNav.tsx` → `navItems` |

## Routing

| Route | File | Description |
|-------|------|-------------|
| `/` | chess.md | Home/overview |
| `/coaches` | coaches.md | Coach info |
| `/tournaments` | tournaments.md | Tournament calendar |
| `/curriculum` | curriculum.md | Learning progress |
| `/more` | - | Lists additional files + settings |
| `/file/:name` | [name].md | Dynamic route for any markdown file |

Internal `.md` links in markdown are handled by MarkdownViewer and navigate within the app.

## Token Handling

- Google access tokens expire after ~1 hour
- `driveApiFetch()` in googleDrive.ts detects 401s and auto-clears localStorage + reloads
- Settings page has "Force Re-login" button for manual refresh
- After VoiceInput gets Claude response, `queryClient.invalidateQueries()` refreshes all data

## Claude Server (Mac)

**Location:** `~/Workspace/chess-claude-server/`

Express server that receives requests from the website and runs Claude CLI with access to Google Drive files.

- Port: 3847 (Tailscale IP: 100.123.49.56)
- Auto-starts via LaunchAgent: `~/Library/LaunchAgents/com.chess.claude-server.plist`
- Logs: `~/Workspace/chess-claude-server/server.log`

```bash
# Check status
launchctl list | grep chess

# Stop/start
launchctl unload ~/Library/LaunchAgents/com.chess.claude-server.plist
launchctl load ~/Library/LaunchAgents/com.chess.claude-server.plist
```

**Gotchas when spawning Claude CLI from Node.js:**
- Redirect stdin: `< /dev/null` - prevents hanging
- Use `--dangerously-skip-permissions` - avoids permission prompts
- Use `exec()` not `spawn()` with `shell: true` - better escaping
