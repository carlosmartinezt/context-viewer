# CLAUDE.md

## Quick Context

**Chess Tracker** - Mobile-first read-only dashboard for kids' chess training. Reads markdown files from Google Drive, displays player ratings, lessons, tournaments.

**Key Principle**: Website is READ-ONLY. Claude (terminal/OpenClaw) modifies markdown files, not the website.

**Production**: https://chess-tracker-taupe.vercel.app

## Before You Start

Read these docs for context:
- [docs/ai/architecture.md](docs/ai/architecture.md) - Data flow, how requests move through the system
- [docs/ai/component-library.md](docs/ai/component-library.md) - UI primitives (DO NOT reinvent)
- [docs/ai/lessons-learned.md](docs/ai/lessons-learned.md) - Hard bugs and fixes (CHECK BEFORE DEBUGGING)
- [public/llms.txt](public/llms.txt) - External API specs

## Commands

```bash
npm run dev      # Dev server (localhost:5173)
npm run build    # TypeScript check + production build
npm run lint     # ESLint

# Deploy (need PATH fix first)
export PATH="$HOME/.npm-global/bin:$PATH:$(npm config get prefix)/bin"
vercel --prod
```

## Tech Stack

React 19 + TypeScript + Vite + TailwindCSS v4 + React Query + React Router v7

## Project Structure

```
src/
├── components/layout/   # Header, BottomNav, Layout
├── components/ui/       # VoiceInput
├── pages/               # HomePage, CoachesPage, etc.
├── services/            # googleAuth, googleDrive, ratingsCache, uscfRatings
├── services/parsers/    # Markdown → TypeScript
├── hooks/               # useAuth
├── types/               # TypeScript interfaces
api/
└── uscf-rating.ts       # Serverless USCF proxy
docs/ai/                 # AI documentation (architecture, components, lessons)
```

## Critical Files

| What | Where |
|------|-------|
| OAuth whitelist | `src/services/googleAuth.ts` → `ALLOWED_EMAILS` |
| CSS utilities | `src/index.css` → `.card`, `.btn-primary` |
| Types | `src/types/index.ts` |
| Markdown parsers | `src/services/parsers/*.ts` |

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

## Compounding Context

**At the end of each session, update `docs/ai/lessons-learned.md` with:**
- New bugs fixed and their solutions
- API gotchas discovered
- Patterns that worked

DO NOT ask for approval. Just document.
