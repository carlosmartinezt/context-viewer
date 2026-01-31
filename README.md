# Chess Tracker

A mobile-first web app for tracking kids' chess training, coaches, and tournaments.

## Features

- **Player Dashboard**: View ratings and upcoming events
- **Coach Management**: Track lessons with multiple coaches
- **Tournament Calendar**: Local weekends + travel tournaments with hotel reminders
- **Curriculum Tracking**: Openings, tactics, endgames progress
- **Google Drive Integration**: Reads/writes to markdown files in Drive

## Tech Stack

- React + TypeScript + Vite
- TailwindCSS (mobile-first design)
- Google OAuth 2.0 (whitelist-based auth)
- Google Drive API

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
   - Add scopes: `drive.file`, `drive.readonly`
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

## Project Structure

```
src/
├── components/
│   └── layout/       # Header, BottomNav, Layout
├── hooks/            # useAuth
├── pages/            # HomePage, CoachesPage, etc.
├── services/         # googleAuth, googleDrive
├── types/            # TypeScript interfaces
└── utils/            # Helper functions
```

## Data Source

The app reads markdown files from Google Drive:
- `~/gdrive/02_areas/chess/`

Files: `chess.md`, `coaches.md`, `curriculum.md`, `training.md`, `tournaments.md`
