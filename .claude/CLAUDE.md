# CLAUDE.md

## IMPORTANT: Compound Context

**After every conversation, update docs files with any new learnings, changes, or context.** This is critical for maintaining continuity across sessions. Document architectural decisions, new patterns, gotchas discovered, and any changes to the codebase structure.

**After making any change, always run `npm run build` to validate TypeScript and ensure the build succeeds.**

## Quick Context

**Context Viewer** - Mobile-first Google Drive markdown file browser. Renders markdown files as-is using react-markdown with dynamic folder-based navigation.

**Key Principle**: Website is READ-ONLY. Renders markdown files directly from Google Drive with no parsing.

**Production**: https://context-viewer.vercel.app

## Commands

```bash
npm run dev      # Dev server (localhost:5173)
npm run build    # TypeScript check + production build
npm run lint     # ESLint

# Deploy (vercel is NOT installed globally — always use npx)
npx vercel --prod
```

## Tech Stack

React 19 + TypeScript + Vite + TailwindCSS v4 + React Query + React Router v7

## Project Structure

```
src/
├── components/layout/   # Header, BottomNav, Sidebar, Layout
├── components/ui/       # MarkdownViewer, FolderPicker, FolderNav, ProfileAvatar
├── pages/               # HomePage, FolderPage, FilePage, MorePage, SettingsPage, LoginPage
├── services/            # googleAuth, googleDrive
├── hooks/               # useAuth
├── types/               # User type, GIS type declarations
api/
├── auth/                # Vercel serverless functions (_utils, exchange, refresh, revoke)
.claude/
├── docs/                # Application design docs
└── CLAUDE.md            # This file - AI context and instructions
```

## How It Works

1. User signs in with Google Identity Services (GIS)
2. User selects a root folder from Google Drive (in Settings)
3. App shows subfolders in bottom navigation (first 4 folders)
4. Clicking a folder shows its contents (subfolders + markdown files)
5. Clicking a file renders it with MarkdownViewer

## Routing

| Route | Description |
|-------|-------------|
| `/` | Home - shows root folder contents |
| `/folder/:folderId` | Shows folder contents |
| `/file/:fileId` | Renders markdown file |
| `/more` | Lists all folders + settings link |
| `/settings` | Root folder picker, account, sign out |

## Key Files

| What | Where |
|------|-------|
| OAuth whitelist | `src/services/googleAuth.ts` → `ALLOWED_EMAILS` |
| Root folder storage | `localStorage` → `context-viewer-root-folder` |
| Folder picker | `src/components/ui/FolderPicker.tsx` → custom modal browser |
| Dynamic nav | `src/components/layout/BottomNav.tsx` |

## Storage Keys

- `context-viewer-user` - Google user identity (email, name, picture) — no access token
- `context-viewer-root-folder` - Selected root folder ID
- `context-viewer-root-folder-name` - Selected root folder name

## Auth Architecture (GIS Authorization Code Flow)

See [`.claude/docs/authentication.md`](.claude/docs/authentication.md) for full details.

- **Identity** (`GoogleUser`): email, name, picture — persisted in localStorage, lasts until sign-out
- **Access token**: held in-memory (React state), never persisted — refreshed via server-side HTTP-only cookie
- **Refresh token**: stored as HTTP-only cookie (`auth_refresh_token`, 7 days) — set by `/api/auth/exchange`, used by `/api/auth/refresh`
- **Sign-in flow**: GIS `initCodeClient()` → popup → auth code → `POST /api/auth/exchange` → server exchanges for tokens → sets refresh cookie → returns access_token + user info
- **Token refresh**: `driveApiFetch()` detects 401 → calls `POST /api/auth/refresh` (reads cookie) → returns new access_token
- **GIS script**: loaded via `<script>` in `index.html`, types declared in `src/types/google.accounts.d.ts`
- **Serverless functions**: `api/auth/exchange.ts`, `api/auth/refresh.ts`, `api/auth/revoke.ts` (Vercel)
- **Environment vars**: `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` must be set in Vercel env vars
- **Local dev**: `npm run dev` + `npx vercel dev --listen 3000` in separate terminals; Vite proxies `/api` to port 3000

## Markdown Link Resolution

MarkdownViewer resolves links in markdown files with three strategies:

1. **Internal links**: Sibling files/folders in the same directory → resolved immediately via `files`/`folders` props
2. **External links**: Real URLs with domains (e.g., `https://example.com`) → open in new tab
3. **Cross-folder links**: Paths like `02_areas/finances/subscriptions.md` → resolved on-click via `resolvePathFromRoot()`

**Gotcha**: react-markdown transforms relative paths by adding `http://` prefix (e.g., `02_areas/file.md` becomes `http://02_areas/file.md`). The code detects these malformed URLs by checking if the "domain" contains a dot - real domains have dots, fake paths don't.

**Key functions**:
- `resolveLink()` in MarkdownViewer.tsx - categorizes links as internal/external/unresolved
- `resolvePathFromRoot()` in googleDrive.ts - walks folder tree from root to resolve cross-folder paths
