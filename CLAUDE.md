# CLAUDE.md - Chess Tracker

This file provides context for Claude Code when working on this project.

## Project Overview

**Chess Tracker** is a mobile-first web app for Jenny to manage Rapha and Rory's chess training, coaches, and tournaments. It reads/writes directly to Google Drive markdown files (no content duplication).

## Tech Stack

- **Framework**: React 18 + TypeScript + Vite
- **Styling**: TailwindCSS v4 (via @tailwindcss/vite plugin)
- **Routing**: react-router-dom v6
- **State**: @tanstack/react-query
- **Auth**: Google OAuth 2.0 (whitelist-based)
- **Data**: Google Drive API (reads markdown files)

## Project Structure

```
src/
├── components/
│   ├── layout/          # Header, BottomNav, Layout
│   └── ui/              # Reusable UI components (empty, add as needed)
├── hooks/
│   └── useAuth.tsx      # Auth context and hook
├── pages/
│   ├── HomePage.tsx     # Dashboard with player cards, weekly schedule
│   ├── CoachesPage.tsx  # Coach list and management
│   ├── TournamentsPage.tsx  # Tournament calendar
│   ├── CurriculumPage.tsx   # Learning progress
│   ├── SettingsPage.tsx     # User settings
│   └── LoginPage.tsx        # Google OAuth login
├── services/
│   ├── googleAuth.ts    # OAuth setup, whitelist check
│   └── googleDrive.ts   # Drive API for reading/writing files
├── types/
│   └── index.ts         # TypeScript interfaces
└── utils/               # Helper functions (empty, add as needed)
```

## Data Source

The app reads markdown files from Google Drive:
- **Path**: `~/gdrive/claude/02_areas/chess/`
- **Files**: `chess.md`, `coaches.md`, `curriculum.md`, `training.md`, `tournaments.md`

These files are the source of truth. The app parses them for display and writes updates back as markdown.

## Authentication

- Uses Google OAuth 2.0 with token-based auth
- Whitelist in `src/services/googleAuth.ts` (`ALLOWED_EMAILS` array)
- Only authorized family members can access

## Current Status

| Feature | Status |
|---------|--------|
| Project scaffolding | ✅ Complete |
| TailwindCSS setup | ✅ Complete |
| Routing | ✅ Complete |
| Auth flow (UI) | ✅ Complete |
| Placeholder pages | ✅ Complete |
| Google OAuth integration | ⏳ Needs Client ID |
| Google Drive read | ⏳ Needs OAuth working |
| Google Drive write | ❓ Not started |
| Markdown parsing | ❓ Not started |
| Form-based editing | ❓ Not started |
| PWA support | ❓ Not started |

## Setup Instructions

1. **Install dependencies**: `npm install`
2. **Configure OAuth**: Copy `.env.example` to `.env.local`, add Google Client ID
3. **Update whitelist**: Add emails to `ALLOWED_EMAILS` in `src/services/googleAuth.ts`
4. **Run dev server**: `npm run dev`

## Google Cloud Setup (Required)

1. Create project at [console.cloud.google.com](https://console.cloud.google.com/)
2. Enable **Google Drive API**
3. Configure OAuth consent screen (External, add scopes: `drive.file`, `drive.readonly`)
4. Create OAuth 2.0 Client ID (Web application)
5. Add authorized origins: `http://localhost:5173`, production URL
6. Copy Client ID to `.env.local`

## Design Decisions

- **Mobile-first**: Bottom navigation, large touch targets, card-based layout
- **No content duplication**: Reads/writes directly to Drive markdown files
- **Whitelist auth**: Only specific Google accounts can access
- **Reminder integration**: Will integrate with OpenClaw for WhatsApp reminders

## Related Documentation

- **Plan**: `~/gdrive/claude/01_projects/improve_home_tech/chess_website/chess_website.md`
- **Chess data**: `~/gdrive/claude/02_areas/chess/`

## Commands

```bash
npm run dev      # Start dev server (port 5173)
npm run build    # Production build
npm run preview  # Preview production build
npm run lint     # Run ESLint
```

---

## Changelog

| Date | Change |
|------|--------|
| 2026-01-31 | Initial scaffolding: Vite + React + TailwindCSS |
| 2026-01-31 | Added routing, auth flow, placeholder pages |
| 2026-01-31 | Added Google Drive service (needs OAuth to work) |
