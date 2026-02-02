# Context Viewer - Application Design

## Core Philosophy

**Browse and render markdown files from any Google Drive folder.** The app is a read-only viewer that renders markdown files using react-markdown with dynamic folder-based navigation.

**Key Principle:** No parsing of markdown structure. Files render as-is - the app just navigates and displays.

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────┐
│                         DATA LAYER                                   │
│                                                                      │
│   Google Drive (user-selected root folder)                          │
│   ├── folder1/                                                       │
│   │   ├── index.md                                                   │
│   │   └── notes.md                                                   │
│   ├── folder2/                                                       │
│   │   └── readme.md                                                  │
│   └── ...                                                            │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
                              ▲
                              │ Google Drive API v3
                              │
┌─────────────────────────────┴───────────────────────────────────────┐
│                      PRESENTATION LAYER                              │
│                                                                      │
│   Context Viewer Website (Vercel)                                   │
│   • User selects root folder via Google Picker                      │
│   • Dynamic navigation from folder structure                        │
│   • Renders markdown files as-is (react-markdown)                   │
│   • Mobile-first responsive design                                  │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

## User Flow

```
1. User signs in with Google
           │
           ▼
2. User selects root folder in Settings
           │
           ▼
3. Bottom nav shows first 4 subfolders + More
           │
           ▼
4. User taps folder → sees subfolders + files
           │
           ▼
5. User taps file → renders markdown content
```

## Website Features

### What the Website DOES

| Feature | Description |
|---------|-------------|
| **Folder Browser** | Navigate folder structure from selected root |
| **Dynamic Navigation** | Bottom nav shows first 4 folders dynamically |
| **Markdown Viewer** | Renders any markdown file using react-markdown |
| **Index Files** | Auto-displays index.md or readme.md in folders |
| **Root Folder Picker** | Google Picker API for folder selection |
| **Mobile-First** | Bottom navigation, card layout, responsive design |

### What the Website DOES NOT DO

- ❌ Parse or understand markdown structure
- ❌ Edit or modify files
- ❌ Store files locally (reads from Drive on demand)

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
| Folder Picker | Google Picker API |
| Hosting | Vercel |

## File Structure

```
src/
├── components/
│   ├── layout/          # Header, BottomNav, Layout
│   └── ui/              # MarkdownViewer, VoiceInput
├── pages/
│   ├── HomePage.tsx     # Root folder contents
│   ├── FolderPage.tsx   # Subfolder contents
│   ├── FilePage.tsx     # Markdown file viewer
│   ├── MorePage.tsx     # All folders + settings link
│   ├── SettingsPage.tsx # Folder picker, account
│   └── LoginPage.tsx    # Google sign-in
├── services/
│   ├── googleAuth.ts    # OAuth + whitelist
│   ├── googleDrive.ts   # Drive API functions
│   └── claudeServer.ts  # (optional) Claude integration
├── hooks/
│   └── useAuth.tsx      # Auth context
└── types/
    └── index.ts         # User type
```

## Routing

| Route | Component | Description |
|-------|-----------|-------------|
| `/` | HomePage | Shows root folder contents |
| `/folder/:folderId` | FolderPage | Shows folder contents |
| `/file/:fileId` | FilePage | Renders markdown file |
| `/more` | MorePage | All folders + settings |
| `/settings` | SettingsPage | Root folder picker, account |
| `/login` | LoginPage | Google sign-in |

## Storage

All stored in localStorage:

| Key | Value |
|-----|-------|
| `context-viewer-user` | Google user info + access token |
| `context-viewer-root-folder` | Selected root folder ID |
| `context-viewer-root-folder-name` | Selected root folder name |

## Security Model

1. **Google OAuth** - Only whitelisted accounts can access
2. **Read-only** - Cannot modify files, only view
3. **Token refresh** - Auto-clears on 401, prompts re-login
