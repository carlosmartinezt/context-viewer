# Context Viewer

A mobile-first web app for browsing and viewing markdown files from Google Drive.

**Production**: https://context-viewer.vercel.app

## Features

- **Folder Browser**: Navigate any Google Drive folder structure
- **Dynamic Navigation**: Bottom nav shows first 4 subfolders automatically
- **Markdown Viewer**: Renders markdown files with tables, code, lists
- **Index Files**: Auto-displays index.md or readme.md in folders
- **Root Folder Picker**: Select any folder as your root via custom folder browser

## Tech Stack

- React 19 + TypeScript + Vite
- TailwindCSS v4 (mobile-first design)
- Google OAuth 2.0 (authorization code flow, whitelist-based auth)
- Google Drive API v3
- Vercel (hosting + serverless functions)

## Setup

### 1. Install dependencies

```bash
npm install
```

### 2. Configure Google OAuth

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project (or select existing)
3. Enable the **Google Drive API**
4. Configure **OAuth consent screen**:
   - User type: External
   - Add scopes: `openid`, `email`, `profile`, `drive.file`, `drive.readonly`
5. Create **OAuth 2.0 Client ID**:
   - Application type: Web application
   - Authorized JavaScript origins: `http://localhost:5173`, `https://context-viewer.vercel.app`
   - Authorized redirect URIs: `http://localhost:5173`, `https://context-viewer.vercel.app`

### 3. Create .env.local

```bash
cp .env.example .env.local
```

Edit `.env.local` and add your Client ID:

```
VITE_GOOGLE_CLIENT_ID=your-client-id-here.apps.googleusercontent.com
```

### 4. Environment Variables

#### Local development (`.env.local`)

| Variable | Required | Description |
|----------|----------|-------------|
| `VITE_GOOGLE_CLIENT_ID` | Yes | Google OAuth Client ID (used by frontend) |
| `VITE_CLAUDE_SERVER_URL` | No | Claude server URL for AI features |

#### Vercel (production)

| Variable | Required | Description |
|----------|----------|-------------|
| `VITE_GOOGLE_CLIENT_ID` | Yes | Google OAuth Client ID (used by frontend at build time) |
| `GOOGLE_CLIENT_ID` | Yes | Google OAuth Client ID (used by serverless API functions) |
| `GOOGLE_CLIENT_SECRET` | Yes | Google OAuth Client Secret (used by serverless API functions) |
| `VITE_CLAUDE_SERVER_URL` | No | Claude server URL for AI features |

> **Note**: `VITE_GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_ID` have the same value. The `VITE_` prefix is required by Vite to expose the variable to the browser. The non-prefixed version is needed by the server-side token exchange/refresh endpoints.

### 5. Update authorized users

Edit `src/services/googleAuth.ts` and add authorized email addresses to `ALLOWED_EMAILS`.

### 6. Run development server

For frontend only:
```bash
npm run dev
```

For full stack (frontend + API functions):
```bash
npm run dev              # Terminal 1: Vite dev server (port 5173)
npx vercel dev --listen 3000  # Terminal 2: Vercel serverless functions (port 3000)
```

Open http://localhost:5173

## Deployment to Vercel

1. Push to GitHub
2. Import to [Vercel](https://vercel.com)
3. Add all required environment variables (see table above)
4. Update Google OAuth authorized origins to include your Vercel URL
5. Deploy:

```bash
npx vercel --prod
```

## Project Structure

```
src/
├── components/
│   ├── layout/       # Header, BottomNav, Sidebar, Layout
│   └── ui/           # MarkdownViewer, FolderPicker, FolderNav
├── hooks/            # useAuth
├── pages/            # HomePage, FolderPage, FilePage, SettingsPage, etc.
├── services/         # googleAuth, googleDrive
└── types/            # TypeScript interfaces, GIS type declarations
api/
└── auth/             # Vercel serverless functions (exchange, refresh, revoke)
```

## Usage

1. Sign in with Google
2. Go to Settings and select a root folder from your Drive
3. Browse folders using the bottom navigation
4. Tap any markdown file to view it

## Legal

- [Privacy Policy](https://context-viewer.vercel.app/privacy)
- [Terms of Service](https://context-viewer.vercel.app/terms)
