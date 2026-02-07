# Context Viewer

A mobile-first web app for browsing and viewing markdown files from Google Drive.

**Production**: https://context-viewer.vercel.app

## Features

- **Folder Browser**: Navigate any Google Drive folder structure
- **Dynamic Navigation**: Bottom nav shows first 4 subfolders automatically
- **Markdown Viewer**: Renders markdown files with tables, code, lists
- **Index Files**: Auto-displays index.md or readme.md in folders
- **Root Folder Picker**: Select any folder as your root via Google Picker

## Tech Stack

- React 19 + TypeScript + Vite
- TailwindCSS v4 (mobile-first design)
- Google OAuth 2.0 (whitelist-based auth)
- Google Drive API v3
- Google Picker API

## Setup

### 1. Install dependencies

```bash
npm install
```

### 2. Configure Google OAuth

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project (or select existing)
3. Enable the **Google Drive API** and **Google Picker API**
4. Configure **OAuth consent screen**:
   - User type: External
   - Add scopes: `drive.readonly`
5. Create **OAuth 2.0 Client ID**:
   - Application type: Web application
   - Authorized origins: `http://localhost:5173`
   - Authorized redirect URIs: `http://localhost:5173`

### 3. Create .env.local

```bash
cp .env.example .env.local
```

Edit `.env.local` and add your Client ID:

```
VITE_GOOGLE_CLIENT_ID=your-client-id-here.apps.googleusercontent.com
```

### 4. Update authorized users

Edit `src/services/googleAuth.ts` and add authorized email addresses to `ALLOWED_EMAILS`.

### 5. Run development server

```bash
npm run dev
```

Open http://localhost:5173

## Deployment to Vercel

1. Push to GitHub
2. Import to [Vercel](https://vercel.com)
3. Add environment variable: `VITE_GOOGLE_CLIENT_ID`
4. Update Google OAuth authorized origins to include your Vercel URL

## Commands

```bash
# Deploy
npx vercel --prod
```
## Project Structure

```
src/
├── components/
│   ├── layout/       # Header, BottomNav, Layout
│   └── ui/           # MarkdownViewer, VoiceInput
├── hooks/            # useAuth
├── pages/            # HomePage, FolderPage, FilePage, etc.
├── services/         # googleAuth, googleDrive
└── types/            # TypeScript interfaces
```

## Usage

1. Sign in with Google
2. Go to Settings and select a root folder from your Drive
3. Browse folders using the bottom navigation
4. Tap any markdown file to view it
