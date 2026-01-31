# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Chess Tracker** is a mobile-first web app for tracking kids' chess training, coaches, and tournaments. It reads/writes directly to Google Drive markdown files stored at `~/gdrive/claude/02_areas/chess/`.

## Tech Stack

- **Framework**: React 19 + TypeScript + Vite
- **Styling**: TailwindCSS v4 (via @tailwindcss/vite plugin)
- **Routing**: react-router-dom v7
- **State**: @tanstack/react-query
- **Auth**: Google OAuth 2.0 (whitelist-based)
- **Data**: Google Drive API v3 (reads/writes markdown files)

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

## Architecture Details

### Authentication Flow

This app uses **whitelist-based Google OAuth**:

1. **Initialization**: `AuthProvider` loads Google Identity Services script dynamically via `initGoogleAuth()`
2. **Sign-in flow**: User clicks login → `signInWithGoogle()` → Google OAuth popup → receives access token
3. **Whitelist check**: User email is validated against `ALLOWED_EMAILS` array in src/services/googleAuth.ts
4. **Token storage**: User object (including access token) is stored in localStorage with key `chess-tracker-user`
5. **Route protection**: `ProtectedRoute` wrapper in App.tsx checks auth state and redirects to `/login` if unauthenticated
6. **Token expiry**: Access tokens expire; users may need to re-authenticate even if user data persists in localStorage

**To authorize new users**: Add their email to the `ALLOWED_EMAILS` array in src/services/googleAuth.ts.

### Google Drive Integration

The app operates on markdown files in Google Drive:

- **Expected path**: `~/gdrive/claude/02_areas/chess/`
- **File discovery**: `findChessFolder()` searches for a folder named "chess" (currently simplified search; in production should navigate full path hierarchy)
- **Expected files**: `chess.md`, `coaches.md`, `curriculum.md`, `training.md`, `tournaments.md`
- **API**: Uses Google Drive v3 REST API with user's access token from OAuth flow

**Key service functions** (src/services/googleDrive.ts):
- `findChessFolder(accessToken)` - Locates the chess folder by name
- `listChessFiles(accessToken, folderId)` - Lists all markdown files in folder
- `readFile(accessToken, fileId)` - Fetches file content as plain text
- `updateFile(accessToken, fileId, content)` - Updates file via PATCH request
- `createFile(accessToken, folderId, name, content)` - Creates new markdown file

### State Management

- **React Query** (@tanstack/react-query) handles all server state, caching, and async operations
- **React Context** provides global auth state via `AuthProvider`
- No Redux, Zustand, or other global state libraries are used
- Component state (useState) for local UI state only

### Routing Structure

React Router v7 with nested protected routes:

```
/login (public)
/ (ProtectedRoute wrapper)
  ├─ / (HomePage)
  ├─ /coaches
  ├─ /tournaments
  ├─ /curriculum
  └─ /settings
```

The `Layout` component (src/components/layout/Layout.tsx) wraps protected routes and provides:
- `Header` component with user info and sign-out
- `BottomNav` for mobile-first navigation
- `<Outlet />` for nested route content

### Type System

All shared TypeScript interfaces are in src/types/index.ts:
- `Player`, `Coach`, `Lesson` - People and lesson scheduling
- `Tournament`, `TravelPlan`, `TravelItem` - Tournament tracking and travel logistics
- `CurriculumTopic` - Learning progress for openings, tactics, endgames
- `OnlineAccount` - Chess platform accounts (Chess.com, Lichess)
- `User` - Local auth state

Google API types (GoogleUser, DriveFile) are declared in their service files.

## Development Status

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

## Commands

```bash
# Development
npm install          # Install dependencies
npm run dev          # Start dev server (http://localhost:5173)

# Build
npm run build        # TypeScript check + production build
npm run preview      # Preview production build locally

# Code Quality
npm run lint         # Run ESLint
```

## Initial Setup

1. **Install dependencies**: `npm install`
2. **Configure OAuth**:
   - Copy `.env.example` to `.env.local`
   - Add your Google Client ID: `VITE_GOOGLE_CLIENT_ID=your-id.apps.googleusercontent.com`
3. **Update whitelist**: Add authorized email addresses to `ALLOWED_EMAILS` in src/services/googleAuth.ts
4. **Run dev server**: `npm run dev`

### Google Cloud Setup (Required)

1. Create project at [console.cloud.google.com](https://console.cloud.google.com/)
2. Enable **Google Drive API**
3. Configure OAuth consent screen:
   - User type: External
   - Add scopes: `drive.file`, `drive.readonly`
4. Create OAuth 2.0 Client ID:
   - Application type: Web application
   - Authorized origins: `http://localhost:5173` (and production URL when deployed)
   - Authorized redirect URIs: `http://localhost:5173` (and production URL)
5. Copy Client ID to `.env.local` as `VITE_GOOGLE_CLIENT_ID`

## Design Principles

- **Mobile-first**: Bottom navigation, large touch targets, card-based layout
- **Source of truth**: Google Drive markdown files are the single source of truth (no database duplication)
- **Whitelist auth**: Only specific Google accounts can access the app
- **Direct file access**: App reads/writes markdown directly via Google Drive API

## Deployment

To deploy to Vercel:
1. Push code to GitHub
2. Import repository to [Vercel](https://vercel.com)
3. Add environment variable: `VITE_GOOGLE_CLIENT_ID`
4. Update Google OAuth authorized origins/redirect URIs to include Vercel URL

## Data Files

The app expects these markdown files in Google Drive at `~/gdrive/claude/02_areas/chess/`:

- `chess.md` - Player overview, ratings, goals
- `curriculum.md` - Topics, openings, tactics to learn
- `training.md` - Weekly schedule, puzzles, practice
- `coaches.md` - Coach information and lesson schedules
- `tournaments.md` - Tournament calendar, travel planning, results
