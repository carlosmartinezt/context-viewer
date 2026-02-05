# CLAUDE.md

## IMPORTANT: Compound Context

**After every conversation, update this file with any new learnings, changes, or context.** This is critical for maintaining continuity across sessions. Document architectural decisions, new patterns, gotchas discovered, and any changes to the codebase structure.

## Quick Context

**Context Viewer** - Mobile-first Google Drive markdown file browser. Renders markdown files as-is using react-markdown with dynamic folder-based navigation.

**Key Principle**: Website is READ-ONLY. Renders markdown files directly from Google Drive with no parsing.

**Production**: https://context-viewer.vercel.app

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
├── components/layout/   # Header, BottomNav, Sidebar, Layout
├── components/ui/       # MarkdownViewer
├── pages/               # HomePage, FolderPage, FilePage, MorePage, SettingsPage, LoginPage
├── services/            # googleAuth, googleDrive
├── hooks/               # useAuth
├── types/               # User type only
docs/                    # Application design docs
```

## How It Works

1. User logs in with Google OAuth
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
| Folder picker | `src/pages/SettingsPage.tsx` → Google Picker API |
| Dynamic nav | `src/components/layout/BottomNav.tsx` |

## Storage Keys

- `context-viewer-user` - Google user info + access token
- `context-viewer-root-folder` - Selected root folder ID
- `context-viewer-root-folder-name` - Selected root folder name

## Token Handling

- Google access tokens expire after ~1 hour
- `driveApiFetch()` in googleDrive.ts detects 401s and auto-clears localStorage + reloads
- Settings page has "Force Re-login" button for manual refresh

## Markdown Link Resolution

MarkdownViewer resolves links in markdown files with three strategies:

1. **Internal links**: Sibling files/folders in the same directory → resolved immediately via `files`/`folders` props
2. **External links**: Real URLs with domains (e.g., `https://example.com`) → open in new tab
3. **Cross-folder links**: Paths like `02_areas/finances/subscriptions.md` → resolved on-click via `resolvePathFromRoot()`

**Gotcha**: react-markdown transforms relative paths by adding `http://` prefix (e.g., `02_areas/file.md` becomes `http://02_areas/file.md`). The code detects these malformed URLs by checking if the "domain" contains a dot - real domains have dots, fake paths don't.

**Key functions**:
- `resolveLink()` in MarkdownViewer.tsx - categorizes links as internal/external/unresolved
- `resolvePathFromRoot()` in googleDrive.ts - walks folder tree from root to resolve cross-folder paths
