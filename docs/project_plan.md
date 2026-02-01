# Chess Tracker

> A mobile-first markdown viewer for kids' chess training, with Claude as the intelligence layer.

---

## Current Status

**Production URL:** https://chess-tracker-taupe.vercel.app

| Component | Status |
|-----------|--------|
| Website (Vercel) | ✅ Live |
| Google OAuth | ✅ Working |
| Google Drive integration | ✅ Working |
| Claude Server (Mac) | ✅ Running via LaunchAgent |
| Tailscale | ✅ Connected |

---

## Architecture

```
Website (Vercel) ──── Tailscale ────▶ Mac Server ────▶ Claude CLI
       │                                                    │
       │                                                    ▼
       └──── Google Drive API ◀──────────────── Local GDrive files
```

**Key Principle:** Website renders markdown as-is. No parsing. Claude handles all intelligence.

---

## What's Built

### Website
- ✅ React 19 + TypeScript + Vite + TailwindCSS v4
- ✅ Google OAuth with email whitelist
- ✅ Google Drive API - reads raw markdown
- ✅ react-markdown rendering with GFM support
- ✅ Mobile-first bottom navigation
- ✅ VoiceInput component → calls Claude

### Mac Server
- ✅ Express server on port 3847
- ✅ Runs Claude CLI with `--dangerously-skip-permissions`
- ✅ Auto-starts via LaunchAgent
- ✅ Accessible via Tailscale (100.123.49.56)

---

## Data Files

**Location:** `~/gdrive/02_areas/chess/`

| File | Content |
|------|---------|
| `chess.md` | Player overview, ratings, goals, online accounts |
| `curriculum.md` | Topics, openings, tactics to learn |
| `training.md` | Weekly schedule, puzzles, practice |
| `coaches.md` | Coach info, lesson calendar |
| `tournaments.md` | Tournament calendar, travel, results |

**Key:** Files can have ANY structure. Claude adapts, website just renders.

---

## How Changes Work

1. User types request in website (e.g., "Update Rapha's rating to 1750")
2. Website sends POST to Mac server via Tailscale
3. Mac server runs Claude CLI with local file access
4. Claude reads/updates the markdown files
5. Website refreshes to show updated content

---

## Configuration

### Environment Variables

**Vercel:**
```
VITE_GOOGLE_CLIENT_ID=...
VITE_CLAUDE_SERVER_URL=http://100.123.49.56:3847
```

**Mac:**
- Server location: `~/Workspace/chess-claude-server/`
- LaunchAgent: `~/Library/LaunchAgents/com.chess.claude-server.plist`

### Whitelist

Authorized users in `src/services/googleAuth.ts`:
- carlosmartinezt@gmail.com
- lisvette.villar@gmail.com

---

## Commands

### Website
```bash
npm run dev      # Dev server (localhost:5173)
npm run build    # Production build
vercel --prod    # Deploy to Vercel
```

### Mac Server
```bash
# Check status
launchctl list | grep chess

# Restart
launchctl unload ~/Library/LaunchAgents/com.chess.claude-server.plist
launchctl load ~/Library/LaunchAgents/com.chess.claude-server.plist

# View logs
tail -f ~/Workspace/chess-claude-server/server.log
```

---

## Useful Links

| Resource | URL |
|----------|-----|
| Production | https://chess-tracker-taupe.vercel.app |
| Vercel Dashboard | https://vercel.com/carlos-martinezs-projects-edf1fd40/chess-tracker |
| Google Cloud Console | https://console.cloud.google.com/ |
| USCF Player Search | https://new.uschess.org/players/search |

---

## Future Enhancements

| Feature | Priority |
|---------|----------|
| Auto-refresh after Claude updates | High |
| PWA support (install on phone) | Medium |
| Push notifications | Medium |
| Shared calendar export | Low |

---

## Changelog

| Date | Change |
|------|--------|
| 2025-01-31 | Created initial plan |
| 2026-01-31 | Scaffolded project, OAuth, GitHub |
| 2026-02-01 | Implemented Claude server on Mac |
| 2026-02-01 | Simplified to pure markdown rendering (no parsing) |
| 2026-02-01 | Deployed v0.2.0 - markdown viewer + Claude chat |
