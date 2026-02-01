# Chess Tracker - Application Design

## Core Philosophy

**Markdown files in Google Drive are the single source of truth.** The website renders these files as-is using react-markdown. Claude is the intelligence layer that handles all queries and updates via natural language.

**Key Principle:** No parsing of markdown structure. Files can have any format - Claude adapts, the website just renders.

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────┐
│                         DATA LAYER                                   │
│                                                                      │
│   Google Drive (~/gdrive/02_areas/chess/)                           │
│   ├── chess.md        (player profiles, ratings, goals)             │
│   ├── coaches.md      (coach info, contact, rates)                  │
│   ├── training.md     (weekly schedule, lessons)                    │
│   ├── curriculum.md   (learning topics, progress)                   │
│   └── tournaments.md  (calendar, travel, results)                   │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
                              ▲
                              │ reads files / writes updates
                              │
┌─────────────────────────────┴───────────────────────────────────────┐
│                      INTELLIGENCE LAYER                              │
│                                                                      │
│   Claude Server (Mac via Tailscale)                                 │
│   • Express server on port 3847                                      │
│   • Runs Claude CLI with local file access                          │
│   • Handles natural language requests                                │
│   • Updates markdown files directly                                  │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
                              ▲
                              │ HTTP requests via Tailscale
                              │
┌─────────────────────────────┴───────────────────────────────────────┐
│                      PRESENTATION LAYER                              │
│                                                                      │
│   Chess Tracker Website (Vercel)                                    │
│   • Renders markdown files as-is (react-markdown)                   │
│   • NO parsing of markdown structure                                │
│   • Voice/text input → calls Claude server                          │
│   • Mobile-first responsive design                                  │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

## Request Flow

```
User types: "Update Rapha's rating to 1750"
                    │
                    ▼
         ┌─────────────────────┐
         │  Website            │
         │  VoiceInput.tsx     │
         └─────────────────────┘
                    │ POST /api/claude
                    ▼
         ┌─────────────────────┐
         │  Claude Server      │
         │  (Mac:3847)         │
         │                     │
         │  1. Receives request│
         │  2. Runs Claude CLI │
         │  3. Claude reads    │
         │     chess.md        │
         │  4. Claude updates  │
         │     the rating      │
         │  5. Returns response│
         └─────────────────────┘
                    │
                    ▼
         ┌─────────────────────┐
         │  Google Drive       │
         │  chess.md updated   │
         └─────────────────────┘
                    │
                    ▼
         ┌─────────────────────┐
         │  Website refreshes  │
         │  Shows new content  │
         └─────────────────────┘
```

## Website Features

### What the Website DOES

| Feature | Description |
|---------|-------------|
| **Markdown Viewer** | Renders any markdown file as-is using react-markdown |
| **Multiple Pages** | Home (chess.md), Coaches, Tournaments, Curriculum, Settings |
| **Claude Chat** | Text input to send requests to Claude |
| **Response Display** | Shows Claude's responses inline |
| **Mobile-First** | Bottom navigation, card layout, responsive tables |

### What the Website DOES NOT DO

- ❌ Parse or understand markdown structure
- ❌ Direct editing via forms
- ❌ CRUD operations
- ❌ Run Claude locally (uses remote Mac server)
- ❌ Store any data (purely reads from Drive)

## Claude Server

**Location:** `~/Workspace/chess-claude-server/`
**Port:** 3847 (accessible via Tailscale)

### Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/health` | GET | Health check |
| `/api/claude` | POST | Send request to Claude |

### Request Format

```json
{
  "request": "What tournaments are coming up?",
  "userEmail": "user@example.com"
}
```

### Response Format

```json
{
  "response": "The next tournament is..."
}
```

### Security

- Email whitelist validation
- Tailscale network access only (no public internet)
- `--dangerously-skip-permissions` for local file access

## Technology Stack

| Layer | Technology |
|-------|------------|
| Frontend | React 19 + TypeScript + Vite |
| Styling | TailwindCSS v4 |
| Routing | react-router-dom v7 |
| State | @tanstack/react-query |
| Markdown | react-markdown + remark-gfm |
| Auth | Google OAuth 2.0 |
| Data | Google Drive API v3 |
| Hosting | Vercel |
| Claude | Express + Claude CLI on Mac |
| Network | Tailscale |

## File Structure

```
src/
├── components/
│   ├── layout/          # Header, BottomNav, Layout
│   └── ui/              # MarkdownViewer, VoiceInput
├── pages/               # HomePage, CoachesPage, etc.
├── services/
│   ├── googleAuth.ts    # OAuth + whitelist
│   ├── googleDrive.ts   # Read raw markdown files
│   └── claudeServer.ts  # Call Claude server
├── hooks/               # useAuth
└── types/               # User type only
```

## Security Model

1. **Google OAuth** - Only whitelisted accounts can view
2. **Read-only website** - Cannot modify files directly
3. **Tailscale** - Claude server only accessible on private network
4. **Email validation** - Claude server validates user email

## Future Enhancements

1. **Push notifications** - "Lesson in 1 hour"
2. **PWA support** - Install on home screen
3. **Shared calendar** - Export to Google Calendar
4. **Progress reports** - Generated by Claude
